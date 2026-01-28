import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import { buildMarketContext, formatContextForPrompt } from '@/lib/ai/rag/context-builder';
import { buildDailyReportPrompt } from '@/lib/ai/prompts/market-report';

const CACHE_HOURS = 6; // Relatório válido por 6 horas

export interface DailyReport {
  id: string;
  title: string;
  content: string;
  summary: string;
  generatedAt: string;
  validUntil: string;
  tokensUsed: number;
  model: string;
  cached: boolean;
}

/**
 * Obtém ou gera o relatório diário do mercado
 */
export async function getDailyReport(forceRegenerate = false): Promise<DailyReport> {
  const now = new Date();

  // Verificar cache
  if (!forceRegenerate) {
    const cachedReport = await prisma.aIReport.findFirst({
      where: {
        type: 'DAILY_MARKET',
        validUntil: { gt: now },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (cachedReport) {
      return {
        id: cachedReport.id,
        title: cachedReport.title,
        content: cachedReport.content,
        summary: cachedReport.summary ?? '',
        generatedAt: cachedReport.generatedAt.toISOString(),
        validUntil: cachedReport.validUntil.toISOString(),
        tokensUsed: cachedReport.tokensUsed,
        model: cachedReport.model,
        cached: true,
      };
    }
  }

  // Gerar novo relatório
  const marketContext = await buildMarketContext();
  const contextString = formatContextForPrompt(marketContext);
  const prompt = buildDailyReportPrompt(contextString);

  const client = getAnthropicClient();
  const config = MODEL_CONFIG.dailyReport;

  const response = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const content = textContent.text;
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  // Extrair resumo (primeiro parágrafo após "Resumo Executivo")
  const summaryMatch = content.match(/(?:Resumo Executivo|resumo executivo)[^\n]*\n+([\s\S]*?)(?:\n\n|\n###)/i);
  const summary = summaryMatch?.[1]?.trim().slice(0, 500) ?? content.slice(0, 500);

  // Calcular validade
  const validUntil = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);

  // Gerar título com data
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const title = `Resumo do Mercado - ${dateStr}`;

  // Salvar no banco
  const report = await prisma.aIReport.create({
    data: {
      type: 'DAILY_MARKET',
      title,
      content,
      summary,
      model: config.model,
      tokensUsed,
      validUntil,
    },
  });

  return {
    id: report.id,
    title: report.title,
    content: report.content,
    summary: report.summary ?? '',
    generatedAt: report.generatedAt.toISOString(),
    validUntil: report.validUntil.toISOString(),
    tokensUsed: report.tokensUsed,
    model: report.model,
    cached: false,
  };
}

/**
 * Limpa relatórios expirados do banco
 */
export async function cleanExpiredReports(): Promise<number> {
  const result = await prisma.aIReport.deleteMany({
    where: {
      validUntil: { lt: new Date() },
    },
  });

  return result.count;
}
