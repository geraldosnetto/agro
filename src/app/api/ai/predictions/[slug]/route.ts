import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAIUsage, incrementAIUsage } from '@/lib/ai/rate-limit-ai';
import { UserPlan, PredictionHorizonSchema } from '@/lib/schemas/ai';
import { predictPrice } from '@/lib/ml/predictions';
import type { DataPoint } from '@/lib/ml/predictions';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Autenticação necessária', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Buscar plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const plan = (user?.plan || 'free') as UserPlan;

    // 3. Verificar rate limit
    const usageCheck = await checkAIUsage(userId, plan, 'prediction');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          code: 'RATE_LIMIT',
          usage: usageCheck.usage,
          limits: usageCheck.limits,
        },
        { status: 429 }
      );
    }

    // 4. Parse query params
    const { searchParams } = new URL(request.url);
    const horizonParam = searchParams.get('horizon') || '7';
    const parsed = PredictionHorizonSchema.safeParse(horizonParam);
    const horizon = parsed.success ? parseInt(parsed.data) : 7;

    // 5. Buscar commodity
    const commodity = await prisma.commodity.findUnique({
      where: { slug },
      select: {
        id: true,
        nome: true,
        slug: true,
        unidade: true,
      },
    });

    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity não encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 6. Buscar dados históricos (90 dias para boa previsão)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const historicalData = await prisma.cotacao.findMany({
      where: {
        commodityId: commodity.id,
        dataReferencia: {
          gte: ninetyDaysAgo,
        },
      },
      orderBy: {
        dataReferencia: 'asc',
      },
      select: {
        dataReferencia: true,
        valor: true,
        praca: true,
      },
    });

    if (historicalData.length < 7) {
      return NextResponse.json(
        {
          error: 'Dados históricos insuficientes para previsão. Mínimo de 7 dias necessários.',
          code: 'INSUFFICIENT_DATA',
        },
        { status: 400 }
      );
    }

    // 7. Agrupar por data (média de todas as praças)
    const groupedByDate = new Map<string, { total: number; count: number; date: Date }>();

    for (const record of historicalData) {
      const dateKey = record.dataReferencia.toISOString().split('T')[0];
      const existing = groupedByDate.get(dateKey);

      if (existing) {
        existing.total += record.valor.toNumber();
        existing.count += 1;
      } else {
        groupedByDate.set(dateKey, {
          total: record.valor.toNumber(),
          count: 1,
          date: record.dataReferencia,
        });
      }
    }

    // Converter para array de DataPoints
    const dataPoints: DataPoint[] = Array.from(groupedByDate.entries())
      .map(([, data]) => ({
        date: data.date,
        value: data.total / data.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // 8. Gerar previsão
    const prediction = predictPrice(dataPoints, horizon);

    // 9. Incrementar uso
    await incrementAIUsage(userId, 'prediction');

    // 10. Formatar resposta
    return NextResponse.json({
      prediction: {
        commoditySlug: commodity.slug,
        commodityName: commodity.nome,
        unit: commodity.unidade,
        currentPrice: prediction.currentPrice,
        predictedPrice: prediction.predictedPrice,
        priceChange: prediction.priceChange,
        priceChangePercent: prediction.priceChangePercent,
        direction: prediction.direction,
        confidence: prediction.confidence,
        horizon: prediction.horizon,
        targetDate: prediction.targetDate.toISOString(),
        factors: prediction.factors,
        bounds: prediction.bounds,
        models: prediction.models,
        generatedAt: new Date().toISOString(),
        dataPointsUsed: dataPoints.length,
      },
      usage: {
        remaining: usageCheck.remaining.predictions - 1,
      },
    });
  } catch (error) {
    console.error('Prediction error:', error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('insuficientes')) {
      return NextResponse.json(
        { error: error.message, code: 'INSUFFICIENT_DATA' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao gerar previsão de preço', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}
