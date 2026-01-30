import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import { buildSentimentPrompt } from '@/lib/ai/prompts/sentiment';
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
  commodity: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

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
    let analysis: {
      sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      score: number;
      commodities: string[];
      impact: number;
      reasoning?: string;
    };

    try {
      analysis = JSON.parse(responseText);
    } catch {
      logger.error('Erro ao parsear resposta de sentimento', { responseText });
      return NextResponse.json(
        { error: 'Erro ao processar análise' },
        { status: 500 }
      );
    }

    // Validar e limpar score
    const score = Math.max(-1, Math.min(1, analysis.score));
    const impact = Math.max(0, Math.min(1, analysis.impact));

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
      },
      update: {
        newsTitle: title,
        sentiment: analysis.sentiment,
        score,
        commodities: analysis.commodities || [],
        impactScore: impact,
        analyzedAt: new Date(),
      },
    });

    logger.info('Sentimento analisado', {
      url,
      sentiment: analysis.sentiment,
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
        reasoning: analysis.reasoning,
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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = QuerySchema.safeParse({
      commodity: searchParams.get('commodity'),
      limit: searchParams.get('limit') || '10',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { commodity, limit } = parsed.data;

    // Buscar sentimentos
    const where = commodity
      ? { commodities: { has: commodity } }
      : {};

    const sentiments = await prisma.newsSentiment.findMany({
      where,
      orderBy: { analyzedAt: 'desc' },
      take: limit,
    });

    // Calcular agregado se filtrou por commodity
    let aggregate = null;
    if (commodity && sentiments.length > 0) {
      const scores = sentiments.map(s => s.score.toNumber());
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const positiveCount = sentiments.filter(s => s.sentiment === 'POSITIVE').length;
      const negativeCount = sentiments.filter(s => s.sentiment === 'NEGATIVE').length;
      const neutralCount = sentiments.filter(s => s.sentiment === 'NEUTRAL').length;

      aggregate = {
        averageScore: avgScore,
        sentiment: avgScore > 0.2 ? 'POSITIVE' : avgScore < -0.2 ? 'NEGATIVE' : 'NEUTRAL',
        distribution: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
        },
        totalAnalyzed: sentiments.length,
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
        analyzedAt: s.analyzedAt,
      })),
      aggregate,
    });

  } catch (error) {
    logger.error('Erro ao buscar sentimentos', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
