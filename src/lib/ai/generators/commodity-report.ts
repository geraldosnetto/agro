import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import {
  buildCommodityContext,
  formatCommodityContextForPrompt,
} from '@/lib/ai/rag/context-builder';
import { buildCommodityReportPrompt } from '@/lib/ai/prompts/market-report';
import { fetchAllNews } from '@/lib/data-sources/news';
import logger from '@/lib/logger';

const CACHE_HOURS = 168; // Relatório semanal válido por 7 dias (168 horas)

export interface CommodityReport {
  id: string;
  commoditySlug: string;
  commodityName: string;
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
 * Calcula a data de início da semana (segunda-feira)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda
  d.setDate(diff);
  return normalizeDate(d);
}

/**
 * Formata CommodityReport a partir de um registro do banco
 */
function formatCommodityReport(
  report: {
    id: string;
    commodityId: string | null;
    title: string;
    content: string;
    summary: string | null;
    reportDate: Date;
    generatedAt: Date;
    validUntil: Date;
    tokensUsed: number;
    model: string;
  },
  commodityName: string,
  cached: boolean
): CommodityReport {
  return {
    id: report.id,
    commoditySlug: report.commodityId ?? '',
    commodityName,
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
 * Obtém o relatório semanal mais recente de uma commodity
 */
export async function getLatestCommodityReport(slug: string): Promise<CommodityReport | null> {
  const commodity = await prisma.commodity.findUnique({
    where: { slug },
    select: { nome: true },
  });

  if (!commodity) return null;

  const report = await prisma.aIReport.findFirst({
    where: {
      type: 'WEEKLY_COMMODITY',
      commodityId: slug,
    },
    orderBy: { reportDate: 'desc' },
  });

  if (!report) return null;
  return formatCommodityReport(report, commodity.nome, true);
}

/**
 * Lista datas disponíveis de relatórios semanais de uma commodity
 */
export async function listCommodityReportDates(slug: string, limit = 12): Promise<string[]> {
  const reports = await prisma.aIReport.findMany({
    where: {
      type: 'WEEKLY_COMMODITY',
      commodityId: slug,
    },
    orderBy: { reportDate: 'desc' },
    select: { reportDate: true },
    take: limit,
  });

  return reports.map(r => r.reportDate.toISOString().split('T')[0]);
}

/**
 * Gera o relatório semanal de uma commodity (chamado pelo cron)
 */
export async function generateCommodityReport(
  slug: string,
  targetDate?: Date
): Promise<CommodityReport | null> {
  const now = new Date();
  const weekStart = getWeekStart(targetDate || now);

  // Buscar commodity para validar
  const commodity = await prisma.commodity.findUnique({
    where: { slug },
    select: { slug: true, nome: true },
  });

  if (!commodity) {
    logger.warn('Commodity não encontrada para relatório', { slug });
    return null;
  }

  // Verificar se já existe relatório para esta semana
  const existingReport = await prisma.aIReport.findFirst({
    where: {
      type: 'WEEKLY_COMMODITY',
      commodityId: slug,
      reportDate: weekStart,
    },
  });

  if (existingReport) {
    logger.info('Relatório semanal já existe para esta semana', {
      commodity: slug,
      weekStart: weekStart.toISOString().split('T')[0],
    });
    return formatCommodityReport(existingReport, commodity.nome, true);
  }

  logger.info('Gerando relatório semanal', {
    commodity: slug,
    weekStart: weekStart.toISOString().split('T')[0],
  });

  // Gerar contexto da commodity
  const commodityContext = await buildCommodityContext(slug);
  if (!commodityContext) {
    logger.warn('Sem contexto suficiente para gerar relatório', { slug });
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

  // Calcular validade (7 dias)
  const validUntil = new Date(now.getTime() + CACHE_HOURS * 60 * 60 * 1000);

  // Gerar título
  const weekNumber = getWeekNumber(weekStart);
  const title = `Análise Semanal: ${commodity.nome} - Semana ${weekNumber}/${weekStart.getFullYear()}`;

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
      reportDate: weekStart,
    },
  });

  logger.info('Relatório semanal gerado com sucesso', {
    id: report.id,
    commodity: slug,
    weekStart: weekStart.toISOString().split('T')[0],
    tokensUsed,
  });

  return formatCommodityReport(report, commodity.nome, false);
}

/**
 * Obtém ou gera o relatório semanal de uma commodity específica (para API de usuário)
 * @deprecated Use getLatestCommodityReport() em vez disso
 */
export async function getCommodityReport(
  slug: string,
  forceRegenerate = false
): Promise<CommodityReport | null> {
  // Se não quer forçar, tenta buscar o mais recente
  if (!forceRegenerate) {
    const latest = await getLatestCommodityReport(slug);
    if (latest) return latest;
  }

  // Se não existe ou quer forçar, gera novo para esta semana
  return generateCommodityReport(slug);
}

/**
 * Lista relatórios disponíveis de commodities (mais recentes)
 */
export async function listCommodityReports(): Promise<
  Array<{
    commoditySlug: string;
    commodityName: string;
    hasReport: boolean;
    reportId: string | null;
    reportDate: string | null;
    generatedAt: string | null;
  }>
> {
  // Buscar todas as commodities ativas
  const commodities = await prisma.commodity.findMany({
    where: { ativo: true },
    select: { slug: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  // Buscar o relatório mais recente de cada commodity
  const latestReports = await prisma.aIReport.findMany({
    where: {
      type: 'WEEKLY_COMMODITY',
    },
    orderBy: { reportDate: 'desc' },
    distinct: ['commodityId'],
    select: {
      id: true,
      commodityId: true,
      reportDate: true,
      generatedAt: true,
    },
  });

  const reportMap = new Map(
    latestReports.map((r) => [
      r.commodityId,
      { id: r.id, reportDate: r.reportDate, generatedAt: r.generatedAt },
    ])
  );

  return commodities.map((c) => {
    const report = reportMap.get(c.slug);
    return {
      commoditySlug: c.slug,
      commodityName: c.nome,
      hasReport: !!report,
      reportId: report?.id ?? null,
      reportDate: report?.reportDate.toISOString().split('T')[0] ?? null,
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
