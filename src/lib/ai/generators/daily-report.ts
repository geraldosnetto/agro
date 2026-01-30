import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import { buildMarketContext, formatContextForPrompt } from '@/lib/ai/rag/context-builder';
import { buildDailyReportPrompt } from '@/lib/ai/prompts/market-report';
import logger from '@/lib/logger';

const CACHE_HOURS = 24; // Relatório diário válido por 24 horas

export interface DailyReport {
  id: string;
  title: string;
  content: string;
  summary: string;
  reportDate: string;
  generatedAt: string;
  validUntil: string;
  tokensUsed: number;
  model: string;
  cached: boolean;
}

/**
 * Normaliza uma data para início do dia (00:00:00) em UTC
 */
function normalizeDate(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Formata DailyReport a partir de um registro do banco
 */
function formatReport(report: {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  reportDate: Date;
  generatedAt: Date;
  validUntil: Date;
  tokensUsed: number;
  model: string;
}, cached: boolean): DailyReport {
  return {
    id: report.id,
    title: report.title,
    content: report.content,
    summary: report.summary ?? '',
    reportDate: report.reportDate.toISOString().split('T')[0],
    generatedAt: report.generatedAt.toISOString(),
    validUntil: report.validUntil.toISOString(),
    tokensUsed: report.tokensUsed,
    model: report.model,
    cached,
  };
}

/**
 * Obtém o relatório diário mais recente (para exibição automática)
 */
export async function getLatestDailyReport(): Promise<DailyReport | null> {
  const report = await prisma.aIReport.findFirst({
    where: { type: 'DAILY_MARKET' },
    orderBy: { reportDate: 'desc' },
  });

  if (!report) return null;
  return formatReport(report, true);
}

/**
 * Obtém o relatório de uma data específica
 */
export async function getDailyReportByDate(date: Date): Promise<DailyReport | null> {
  const normalizedDate = normalizeDate(date);

  const report = await prisma.aIReport.findFirst({
    where: {
      type: 'DAILY_MARKET',
      reportDate: normalizedDate,
    },
  });

  if (!report) return null;
  return formatReport(report, true);
}

/**
 * Lista datas disponíveis de relatórios diários (para histórico)
 */
export async function listDailyReportDates(limit = 30): Promise<string[]> {
  const reports = await prisma.aIReport.findMany({
    where: { type: 'DAILY_MARKET' },
    orderBy: { reportDate: 'desc' },
    select: { reportDate: true },
    take: limit,
  });

  return reports.map(r => r.reportDate.toISOString().split('T')[0]);
}

/**
 * Gera o relatório diário do mercado (chamado pelo cron)
 * Não verifica cache - sempre gera novo relatório para a data
 */
export async function generateDailyReport(targetDate?: Date): Promise<DailyReport> {
  const now = new Date();
  const reportDate = normalizeDate(targetDate || now);

  // Verificar se já existe relatório para esta data
  const existingReport = await prisma.aIReport.findFirst({
    where: {
      type: 'DAILY_MARKET',
      reportDate,
    },
  });

  if (existingReport) {
    logger.info('Relatório diário já existe para esta data', {
      date: reportDate.toISOString().split('T')[0],
    });
    return formatReport(existingReport, true);
  }

  // Gerar novo relatório
  logger.info('Gerando relatório diário', { date: reportDate.toISOString().split('T')[0] });

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

  // Calcular validade (24 horas)
  const validUntil = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);

  // Gerar título com data
  const dateStr = reportDate.toLocaleDateString('pt-BR', {
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
      reportDate,
    },
  });

  logger.info('Relatório diário gerado com sucesso', {
    id: report.id,
    date: reportDate.toISOString().split('T')[0],
    tokensUsed,
  });

  return formatReport(report, false);
}

/**
 * Obtém ou gera o relatório diário do mercado (para API de usuário)
 * @deprecated Use getLatestDailyReport() ou getDailyReportByDate() em vez disso
 */
export async function getDailyReport(forceRegenerate = false): Promise<DailyReport> {
  // Se não quer forçar, tenta buscar o mais recente
  if (!forceRegenerate) {
    const latest = await getLatestDailyReport();
    if (latest) return latest;
  }

  // Se não existe ou quer forçar, gera novo para hoje
  return generateDailyReport();
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
