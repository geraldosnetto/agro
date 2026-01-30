import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAnthropicClient, MODEL_CONFIG } from '@/lib/ai/anthropic';
import { buildBatchSentimentPrompt } from '@/lib/ai/prompts/sentiment';
import { fetchAllNews } from '@/lib/data-sources/news';
import logger from '@/lib/logger';

// Este endpoint deve ser chamado por um cron job
// Frequência recomendada: a cada 6 horas

export async function GET(request: Request) {
  // Verificar cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Buscar notícias recentes
    const news = await fetchAllNews(30);

    if (news.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma notícia encontrada',
        analyzed: 0,
      });
    }

    // Verificar quais já foram analisadas
    const urls = news.map(n => n.link);
    const existing = await prisma.newsSentiment.findMany({
      where: { newsUrl: { in: urls } },
      select: { newsUrl: true },
    });

    const existingUrls = new Set(existing.map(e => e.newsUrl));
    const toAnalyze = news.filter(n => !existingUrls.has(n.link));

    if (toAnalyze.length === 0) {
      return NextResponse.json({
        message: 'Todas as notícias já foram analisadas',
        existing: existing.length,
        analyzed: 0,
      });
    }

    // Limitar a 10 por execução para não estourar tokens
    const batch = toAnalyze.slice(0, 10);

    // Analisar em batch
    const client = getAnthropicClient();
    const config = MODEL_CONFIG.sentiment;

    const prompt = buildBatchSentimentPrompt(
      batch.map((n, i) => ({ title: n.title, index: i }))
    );

    const response = await client.messages.create({
      model: config.model,
      max_tokens: 1024,
      temperature: config.temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse da resposta
    let analyses: Array<{
      index: number;
      sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      score: number;
      commodities: string[];
      impact: number;
    }>;

    try {
      analyses = JSON.parse(responseText);
    } catch {
      logger.error('Erro ao parsear resposta batch de sentimento', { responseText });
      return NextResponse.json(
        { error: 'Erro ao processar análise' },
        { status: 500 }
      );
    }

    // Salvar no banco
    let savedCount = 0;
    for (const analysis of analyses) {
      const newsItem = batch[analysis.index];
      if (!newsItem) continue;

      try {
        await prisma.newsSentiment.upsert({
          where: { newsUrl: newsItem.link },
          create: {
            newsUrl: newsItem.link,
            newsTitle: newsItem.title,
            sentiment: analysis.sentiment,
            score: Math.max(-1, Math.min(1, analysis.score)),
            commodities: analysis.commodities || [],
            impactScore: Math.max(0, Math.min(1, analysis.impact)),
          },
          update: {
            newsTitle: newsItem.title,
            sentiment: analysis.sentiment,
            score: Math.max(-1, Math.min(1, analysis.score)),
            commodities: analysis.commodities || [],
            impactScore: Math.max(0, Math.min(1, analysis.impact)),
            analyzedAt: new Date(),
          },
        });
        savedCount++;
      } catch (err) {
        logger.error('Erro ao salvar sentimento', {
          url: newsItem.link,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log de execução
    await prisma.atualizacaoLog.create({
      data: {
        fonte: 'SENTIMENT_ANALYSIS',
        status: 'SUCCESS',
        mensagem: `Analisadas ${savedCount} notícias`,
        registros: savedCount,
        duracao: duration,
      },
    });

    logger.info('Análise de sentimento batch concluída', {
      total: news.length,
      existing: existing.length,
      analyzed: savedCount,
      tokensUsed: response.usage.output_tokens,
      duration,
    });

    return NextResponse.json({
      message: 'Análise concluída',
      total: news.length,
      existing: existing.length,
      analyzed: savedCount,
      tokensUsed: response.usage.output_tokens,
      duration,
    });

  } catch (error) {
    logger.error('Erro na análise de sentimento batch', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
