import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCommodityReport } from '@/lib/ai/generators/commodity-report';
import { checkAIUsage, incrementAIUsage } from '@/lib/ai/rate-limit-ai';
import { UserPlan } from '@/lib/schemas/ai';
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

    // 3. Relatórios de commodity são exclusivos para Pro/Business
    if (plan === 'free') {
      return NextResponse.json(
        {
          error: 'Análises semanais de commodities estão disponíveis apenas para planos Pro e Business.',
          code: 'PLAN_REQUIRED',
        },
        { status: 403 }
      );
    }

    // 4. Verificar rate limit
    const usageCheck = await checkAIUsage(userId, plan, 'report');
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

    // 5. Verificar se quer forçar regeneração
    const { searchParams } = new URL(request.url);
    const forceRegenerate = searchParams.get('force') === 'true';

    // 6. Obter relatório
    const report = await getCommodityReport(slug, forceRegenerate);

    if (!report) {
      return NextResponse.json(
        { error: 'Commodity não encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 7. Incrementar uso apenas se não foi do cache
    if (!report.cached) {
      await incrementAIUsage(userId, 'report', report.tokensUsed);
    }

    return NextResponse.json({
      report,
      usage: {
        remaining: usageCheck.remaining.reports - (report.cached ? 0 : 1),
      },
    });
  } catch (error) {
    console.error('Commodity report error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório da commodity', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}
