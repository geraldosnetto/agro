import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import {
  buildSentimentPrompt,
  type Emotion,
  type MarketDriver,
  type Timeframe,
} from '@/lib/ai/prompts/sentiment';
import { z } from 'zod';
import logger from '@/lib/logger';

// Schema de validação
const AnalyzeRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  content: z.string().optional(),
  forceRefresh: z.boolean().optional().default(false),
});

const QuerySchema = z.object({
  commodity: z.string().nullish(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Tipos de resposta da IA
interface SentimentAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  commodities: string[];
  impact: number;
  emotion?: Emotion;
  emotionIntensity?: number;
  drivers?: MarketDriver[];
  timeframe?: Timeframe;
  reasoning?: string;
}

// POST - Analisar sentimento de uma notícia
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AnalyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { url, title, content, forceRefresh } = parsed.data;

    // Verificar se já existe análise
    if (!forceRefresh) {
      const existing = await prisma.newsSentiment.findUnique({
        where: { newsUrl: url },
      });

      if (existing) {
        return NextResponse.json({
          source: 'cache',
          sentiment: {
            sentiment: existing.sentiment,
            score: existing.score.toNumber(),
            commodities: existing.commodities,
            impact: existing.impactScore.toNumber(),
            emotion: existing.emotion,
            emotionIntensity: existing.emotionIntensity?.toNumber(),
            drivers: existing.drivers,
            timeframe: existing.timeframe,
            reasoning: existing.reasoning,
          },
        });
      }
    }

    // Analisar com Claude
    const client = getAnthropicClient();
    const config = MODEL_CONFIG.sentiment;

    const prompt = buildSentimentPrompt(title, content);

    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse da resposta JSON
    let analysis: SentimentAnalysis;

    try {
      analysis = JSON.parse(responseText);
    } catch {
      logger.error('Erro ao parsear resposta de sentimento', { responseText });
      return NextResponse.json(
        { error: 'Erro ao processar análise' },
        { status: 500 }
      );
    }

    // Validar e limpar valores
    const score = Math.max(-1, Math.min(1, analysis.score));
    const impact = Math.max(0, Math.min(1, analysis.impact));
    const emotionIntensity = analysis.emotionIntensity
      ? Math.max(0, Math.min(1, analysis.emotionIntensity))
      : null;

    // Salvar no banco
    const saved = await prisma.newsSentiment.upsert({
      where: { newsUrl: url },
      create: {
        newsUrl: url,
        newsTitle: title,
        sentiment: analysis.sentiment,
        score,
        commodities: analysis.commodities || [],
        impactScore: impact,
        // Campos avançados
        emotion: analysis.emotion || null,
        emotionIntensity,
        drivers: analysis.drivers || [],
        timeframe: analysis.timeframe || null,
        reasoning: analysis.reasoning || null,
      },
      update: {
        newsTitle: title,
        sentiment: analysis.sentiment,
        score,
        commodities: analysis.commodities || [],
        impactScore: impact,
        // Campos avançados
        emotion: analysis.emotion || null,
        emotionIntensity,
        drivers: analysis.drivers || [],
        timeframe: analysis.timeframe || null,
        reasoning: analysis.reasoning || null,
        analyzedAt: new Date(),
      },
    });

    logger.info('Sentimento analisado', {
      url,
      sentiment: analysis.sentiment,
      emotion: analysis.emotion,
      score,
      tokensUsed: response.usage.output_tokens
    });

    return NextResponse.json({
      source: 'analyzed',
      sentiment: {
        sentiment: saved.sentiment,
        score: saved.score.toNumber(),
        commodities: saved.commodities,
        impact: saved.impactScore.toNumber(),
        emotion: saved.emotion,
        emotionIntensity: saved.emotionIntensity?.toNumber(),
        drivers: saved.drivers,
        timeframe: saved.timeframe,
        reasoning: saved.reasoning,
      },
      tokensUsed: response.usage.output_tokens,
    });

  } catch (error) {
    logger.error('Erro na análise de sentimento', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - Obter sentimentos por commodity ou lista de URLs
// Pipeline Automático: Busca RSS -> Filtra Novos -> Analisa em Lote -> Salva -> Retorna
import { fetchNewsForCommodity, type NewsItem } from '@/lib/data-sources/news';
import { buildBatchSentimentPrompt } from '@/lib/ai/prompts/sentiment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const commodityParam = searchParams.get('commodity');
    const parsed = QuerySchema.safeParse({
      commodity: commodityParam || undefined,
      limit: searchParams.get('limit') || '10',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { commodity, limit } = parsed.data;

    // 1. Se tiver commodity, tentar buscar notícias novas e analisar em background (ou on-the-fly se rápido)
    if (commodity) {
      try {
        // a. Buscar últimas notícias do RSS (rápido, cacheado em memória)
        const rssNews = await fetchNewsForCommodity(commodity, 10); // Busca top 10

        if (rssNews.length > 0) {
          const rssUrls = rssNews.map(n => n.link);

          // b. Verificar quais já estão no banco
          const existing = await prisma.newsSentiment.findMany({
            where: { newsUrl: { in: rssUrls } },
            select: { newsUrl: true }
          });

          const existingUrls = new Set(existing.map(e => e.newsUrl));
          const missingAnalysis = rssNews.filter(n => !existingUrls.has(n.link));

          // c. Se houver notícias faltando, analisar em lote
          if (missingAnalysis.length > 0) {
            logger.info(`Analise em lote iniciada: ${missingAnalysis.length} notícias de ${commodity}`);

            // Limitar a 5 por vez para não estourar tokens/tempo
            const toAnalyze = missingAnalysis.slice(0, 5);

            const client = getAnthropicClient();
            const config = MODEL_CONFIG.sentiment; // Usar modelo rápido (Haiku)

            const prompt = buildBatchSentimentPrompt(toAnalyze.map((n, i) => ({
              index: i,
              title: `${n.title}\n${n.content || ''}`.trim()
            })));

            const response = await client.messages.create({
              model: config.model,
              max_tokens: 2000, // Maior buffer para array
              temperature: 0.2, // Mais determinístico para JSON
              messages: [{ role: 'user', content: prompt }]
            });

            const responseText = response.content[0].type === 'text'
              ? response.content[0].text
              : '[]';

            // Parse e Salvar
            try {
              const batchResults = JSON.parse(responseText.match(/\[.*\]/s)?.[0] || '[]');

              // Validar se é array
              if (Array.isArray(batchResults)) {
                // Salvar em transação ou loop
                for (const result of batchResults) {
                  const newsItem = toAnalyze[result.index];
                  if (!newsItem) continue;

                  // Validar dados básicos
                  const score = Math.max(-1, Math.min(1, Number(result.score) || 0));
                  const impact = Math.max(0, Math.min(1, Number(result.impact) || 0));

                  await prisma.newsSentiment.upsert({
                    where: { newsUrl: newsItem.link },
                    create: {
                      newsUrl: newsItem.link,
                      newsTitle: newsItem.title,
                      sentiment: result.sentiment || 'NEUTRAL',
                      score,
                      commodities: result.commodities || [commodity],
                      impactScore: impact,
                      emotion: result.emotion || null,
                      emotionIntensity: result.emotionIntensity ? Number(result.emotionIntensity) : null,
                      drivers: result.drivers || [],
                      timeframe: result.timeframe || null,
                      reasoning: result.reasoning || null, // Se a IA devolver reasoning no batch
                    },
                    update: {} // Se já existe (race condition), mantém
                  });
                }
                logger.info(`Batch Analysis concluída para ${missingAnalysis.length} itens.`);
              }
            } catch (e) {
              logger.error('Erro ao processar JSON do Batch Sentiment', { error: e });
            }
          }
        }
      } catch (rssError) {
        logger.warn('Falha no pipeline automático de notícias RSS', { error: rssError });
        // Não falha a request principal, apenas loga
      }
    }

    // 2. Buscar sentimentos do banco (agora atualizados)
    const where = commodity
      ? { commodities: { has: commodity } }
      : {};

    const sentiments = await prisma.newsSentiment.findMany({
      where,
      orderBy: { analyzedAt: 'desc' },
      take: limit,
    });

    // 3. Calcular agregado se filtrou por commodity
    let aggregate = null;
    if (commodity && sentiments.length > 0) {
      const scores = sentiments.map(s => s.score.toNumber());
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const positiveCount = sentiments.filter(s => s.sentiment === 'POSITIVE').length;
      const negativeCount = sentiments.filter(s => s.sentiment === 'NEGATIVE').length;
      const neutralCount = sentiments.filter(s => s.sentiment === 'NEUTRAL').length;

      // Calcular emoção predominante
      const emotions = sentiments
        .filter(s => s.emotion)
        .map(s => s.emotion as string);
      const emotionCounts = emotions.reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const predominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      // Calcular drivers mais comuns
      const allDrivers = sentiments.flatMap(s => s.drivers || []);
      const driverCounts = allDrivers.reduce((acc, d) => {
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topDrivers = Object.entries(driverCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([driver]) => driver);

      aggregate = {
        averageScore: avgScore,
        sentiment: avgScore > 0.2 ? 'POSITIVE' : avgScore < -0.2 ? 'NEGATIVE' : 'NEUTRAL',
        distribution: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
        },
        totalAnalyzed: sentiments.length,
        // Agregados avançados
        predominantEmotion,
        topDrivers,
      };
    }

    return NextResponse.json({
      sentiments: sentiments.map(s => ({
        url: s.newsUrl,
        title: s.newsTitle,
        sentiment: s.sentiment,
        score: s.score.toNumber(),
        commodities: s.commodities,
        impact: s.impactScore.toNumber(),
        // Campos avançados
        emotion: s.emotion,
        emotionIntensity: s.emotionIntensity?.toNumber(),
        drivers: s.drivers,
        timeframe: s.timeframe,
        reasoning: s.reasoning,
        analyzedAt: s.analyzedAt,
      })),
      aggregate,
      source: 'live-updated' // Flag para debug
    });

  } catch (error) {
    logger.error('Erro ao buscar sentimentos', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
