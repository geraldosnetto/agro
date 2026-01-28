import prisma from '@/lib/prisma';
import { fetchDolarPTAX } from '@/lib/data-sources/bcb';
import { fetchAllNews } from '@/lib/data-sources/news';
import { formatarMoeda, formatarVariacao, formatarUnidade } from '@/lib/formatters';

export interface MarketContext {
  commodities: CommodityContext[];
  dolar: DolarContext | null;
  news: NewsContext[];
  generatedAt: string;
}

export interface CommodityContext {
  slug: string;
  nome: string;
  categoria: string;
  valorAtual: number;
  valorAnterior: number;
  variacao: number;
  praca: string;
  unidade: string;
  historico7d: { data: string; valor: number }[];
  stats: {
    min30d: number;
    max30d: number;
    media30d: number;
    volatilidade: number;
  };
}

interface DolarContext {
  compra: number;
  venda: number;
  variacao: number;
}

interface NewsContext {
  title: string;
  source: string;
  timeAgo: string;
}

/**
 * Constrói contexto completo do mercado para uso em prompts
 */
export async function buildMarketContext(): Promise<MarketContext> {
  const [commoditiesData, dolar, news] = await Promise.all([
    fetchCommoditiesWithHistory(),
    fetchDolarPTAX().catch(() => null),
    fetchAllNews(10).catch(() => []),
  ]);

  return {
    commodities: commoditiesData,
    dolar: dolar
      ? {
          compra: dolar.compra,
          venda: dolar.venda,
          variacao: dolar.variacao ?? 0,
        }
      : null,
    news: news.map((n) => ({
      title: n.title,
      source: n.source,
      timeAgo: n.timeAgo,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Constrói contexto específico de uma commodity
 */
export async function buildCommodityContext(slug: string): Promise<CommodityContext | null> {
  const commodity = await prisma.commodity.findUnique({
    where: { slug },
    include: {
      cotacoes: {
        orderBy: { dataReferencia: 'desc' },
        take: 60, // ~2 meses de dados
      },
    },
  });

  if (!commodity || commodity.cotacoes.length === 0) {
    return null;
  }

  const cotacoes = commodity.cotacoes;
  const atual = cotacoes[0];
  const anterior = cotacoes[1];

  const valores30d = cotacoes.slice(0, 30).map((c) => c.valor.toNumber());
  const media30d = valores30d.reduce((a, b) => a + b, 0) / valores30d.length;

  // Cálculo de volatilidade (desvio padrão)
  const variance =
    valores30d.reduce((sum, val) => sum + Math.pow(val - media30d, 2), 0) / valores30d.length;
  const volatilidade = Math.sqrt(variance);

  return {
    slug: commodity.slug,
    nome: commodity.nome,
    categoria: commodity.categoria,
    valorAtual: atual.valor.toNumber(),
    valorAnterior: anterior?.valor.toNumber() ?? atual.valor.toNumber(),
    variacao: atual.variacao?.toNumber() ?? 0,
    praca: atual.praca,
    unidade: formatarUnidade(commodity.unidade),
    historico7d: cotacoes
      .slice(0, 7)
      .reverse()
      .map((c) => ({
        data: c.dataReferencia.toISOString().split('T')[0],
        valor: c.valor.toNumber(),
      })),
    stats: {
      min30d: Math.min(...valores30d),
      max30d: Math.max(...valores30d),
      media30d,
      volatilidade,
    },
  };
}

/**
 * Formata contexto para incluir no prompt
 */
export function formatContextForPrompt(context: MarketContext): string {
  const dataAtual = new Date(context.generatedAt).toLocaleDateString('pt-BR');
  let prompt = `=== DADOS DE MERCADO (${dataAtual}) ===\n\n`;

  // Dólar
  if (context.dolar) {
    prompt += `DÓLAR PTAX:\n`;
    prompt += `- Compra: ${formatarMoeda(context.dolar.compra, 4)}\n`;
    prompt += `- Venda: ${formatarMoeda(context.dolar.venda, 4)}\n`;
    prompt += `- Variação: ${formatarVariacao(context.dolar.variacao)}\n\n`;
  }

  // Commodities
  prompt += `COMMODITIES:\n`;
  for (const c of context.commodities) {
    prompt += `\n${c.nome} (${c.slug}):\n`;
    prompt += `- Preço atual: ${formatarMoeda(c.valorAtual)}/${c.unidade}\n`;
    prompt += `- Variação: ${formatarVariacao(c.variacao)}\n`;
    prompt += `- Praça: ${c.praca}\n`;
    prompt += `- Min/Máx 30d: ${formatarMoeda(c.stats.min30d)} - ${formatarMoeda(c.stats.max30d)}\n`;
    prompt += `- Média 30d: ${formatarMoeda(c.stats.media30d)}\n`;
  }

  // Notícias
  if (context.news.length > 0) {
    prompt += `\nNOTÍCIAS RECENTES:\n`;
    for (const n of context.news) {
      prompt += `- [${n.source}] ${n.title} (${n.timeAgo})\n`;
    }
  }

  return prompt;
}

/**
 * Formata contexto de uma commodity específica
 */
export function formatCommodityContextForPrompt(context: CommodityContext): string {
  let prompt = `=== ${context.nome.toUpperCase()} ===\n\n`;

  prompt += `Preço atual: ${formatarMoeda(context.valorAtual)}/${context.unidade}\n`;
  prompt += `Variação: ${formatarVariacao(context.variacao)}\n`;
  prompt += `Praça: ${context.praca}\n`;
  prompt += `Categoria: ${context.categoria}\n\n`;

  prompt += `Estatísticas (30 dias):\n`;
  prompt += `- Mínimo: ${formatarMoeda(context.stats.min30d)}\n`;
  prompt += `- Máximo: ${formatarMoeda(context.stats.max30d)}\n`;
  prompt += `- Média: ${formatarMoeda(context.stats.media30d)}\n`;
  prompt += `- Volatilidade: ${context.stats.volatilidade.toFixed(2)}\n\n`;

  prompt += `Histórico (7 dias):\n`;
  for (const h of context.historico7d) {
    prompt += `- ${h.data}: ${formatarMoeda(h.valor)}\n`;
  }

  return prompt;
}

async function fetchCommoditiesWithHistory(): Promise<CommodityContext[]> {
  const commodities = await prisma.commodity.findMany({
    where: { ativo: true },
    include: {
      cotacoes: {
        orderBy: { dataReferencia: 'desc' },
        take: 30,
      },
    },
  });

  return commodities
    .filter((c) => c.cotacoes.length > 0)
    .map((c) => {
      const cotacoes = c.cotacoes;
      const atual = cotacoes[0];
      const valores = cotacoes.map((cot) => cot.valor.toNumber());
      const media = valores.reduce((a, b) => a + b, 0) / valores.length;
      const variance = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / valores.length;

      return {
        slug: c.slug,
        nome: c.nome,
        categoria: c.categoria,
        valorAtual: atual.valor.toNumber(),
        valorAnterior: cotacoes[1]?.valor.toNumber() ?? atual.valor.toNumber(),
        variacao: atual.variacao?.toNumber() ?? 0,
        praca: atual.praca,
        unidade: formatarUnidade(c.unidade),
        historico7d: cotacoes
          .slice(0, 7)
          .reverse()
          .map((cot) => ({
            data: cot.dataReferencia.toISOString().split('T')[0],
            valor: cot.valor.toNumber(),
          })),
        stats: {
          min30d: Math.min(...valores),
          max30d: Math.max(...valores),
          media30d: media,
          volatilidade: Math.sqrt(variance),
        },
      };
    });
}
