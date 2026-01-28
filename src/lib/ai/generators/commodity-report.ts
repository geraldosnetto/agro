import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import {
  buildCommodityContext,
  formatCommodityContextForPrompt,
} from '@/lib/ai/rag/context-builder';
import { buildCommodityReportPrompt } from '@/lib/ai/prompts/market-report';
import { fetchAllNews } from '@/lib/data-sources/news';

const CACHE_HOURS = 24; // Relatório semanal válido por 24 horas

export interface CommodityReport {
  id: string;
  commoditySlug: string;
  commodityName: string;
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
 * Obtém ou gera o relatório semanal de uma commodity específica
 */
export async function getCommodityReport(
  slug: string,
  forceRegenerate = false
): Promise<CommodityReport | null> {
  const now = new Date();

  // Buscar commodity para validar
  const commodity = await prisma.commodity.findUnique({
    where: { slug },
    select: { slug: true, nome: true },
  });

  if (!commodity) {
    return null;
  }

  // Verificar cache
  if (!forceRegenerate) {
    const cachedReport = await prisma.aIReport.findFirst({
      where: {
        type: 'WEEKLY_COMMODITY',
        commodityId: slug,
        validUntil: { gt: now },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (cachedReport) {
      return {
        id: cachedReport.id,
        commoditySlug: slug,
        commodityName: commodity.nome,
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

  // Gerar contexto da commodity
  const commodityContext = await buildCommodityContext(slug);
  if (!commodityContext) {
    return null;
  }

  const contextString = formatCommodityContextForPrompt(commodityContext);

  // Buscar notícias relacionadas
  const allNews = await fetchAllNews(20);
  const relatedNews = allNews.filter((n) =>
    n.title.toLowerCase().includes(commodity.nome.toLowerCase()) ||
    n.title.toLowerCase().includes(slug.toLowerCase())
  );

  const newsContext =
    relatedNews.length > 0
      ? relatedNews
          .slice(0, 5)
          .map((n) => `- [${n.source}] ${n.title} (${n.timeAgo})`)
          .join('\n')
      : 'Nenhuma notícia recente específica encontrada.';

  // Gerar prompt e chamar API
  const prompt = buildCommodityReportPrompt(commodity.nome, contextString, newsContext);

  const client = getAnthropicClient();
  const config = MODEL_CONFIG.commodityReport;

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

  // Extrair resumo
  const summaryMatch = content.match(/(?:Resumo da Semana|resumo)[^\n]*\n+([\s\S]*?)(?:\n\n|\n###)/i);
  const summary = summaryMatch?.[1]?.trim().slice(0, 500) ?? content.slice(0, 500);

  // Calcular validade
  const validUntil = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);

  // Gerar título
  const weekNumber = getWeekNumber(now);
  const title = `Análise Semanal: ${commodity.nome} - Semana ${weekNumber}/${now.getFullYear()}`;

  // Salvar no banco
  const report = await prisma.aIReport.create({
    data: {
      type: 'WEEKLY_COMMODITY',
      commodityId: slug,
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
    commoditySlug: slug,
    commodityName: commodity.nome,
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
 * Lista relatórios disponíveis de commodities
 */
export async function listCommodityReports(): Promise<
  Array<{
    commoditySlug: string;
    commodityName: string;
    hasReport: boolean;
    reportId: string | null;
    generatedAt: string | null;
  }>
> {
  const now = new Date();

  // Buscar todas as commodities ativas
  const commodities = await prisma.commodity.findMany({
    where: { ativo: true },
    select: { slug: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  // Buscar relatórios válidos
  const validReports = await prisma.aIReport.findMany({
    where: {
      type: 'WEEKLY_COMMODITY',
      validUntil: { gt: now },
    },
    select: {
      id: true,
      commodityId: true,
      generatedAt: true,
    },
  });

  const reportMap = new Map(
    validReports.map((r) => [r.commodityId, { id: r.id, generatedAt: r.generatedAt }])
  );

  return commodities.map((c) => {
    const report = reportMap.get(c.slug);
    return {
      commoditySlug: c.slug,
      commodityName: c.nome,
      hasReport: !!report,
      reportId: report?.id ?? null,
      generatedAt: report?.generatedAt.toISOString() ?? null,
    };
  });
}

/**
 * Calcula o número da semana do ano
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
