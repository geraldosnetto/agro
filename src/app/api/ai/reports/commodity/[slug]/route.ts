import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getLatestCommodityReport,
  listCommodityReportDates,
  generateCommodityReport,
} from '@/lib/ai/generators/commodity-report';
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
    const { searchParams } = new URL(request.url);

    // 2. Verificar se é requisição de listar datas
    const listDates = searchParams.get('list') === 'true';
    if (listDates) {
      const dates = await listCommodityReportDates(slug, 12);
      return NextResponse.json({ dates });
    }

    // 3. Buscar plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const plan = (user?.plan || 'free') as UserPlan;

    // 4. Relatórios de commodity são exclusivos para Pro/Business
    if (plan === 'free') {
      return NextResponse.json(
        {
          error: 'Análises semanais de commodities estão disponíveis apenas para planos Pro e Business.',
          code: 'PLAN_REQUIRED',
        },
        { status: 403 }
      );
    }

    // 5. Verificar rate limit
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

    // 6. Verificar se quer forçar regeneração
    const forceRegenerate = searchParams.get('force') === 'true';

    let report;

    if (forceRegenerate) {
      // Forçar geração de novo relatório
      report = await generateCommodityReport(slug);
      if (report && !report.cached) {
        await incrementAIUsage(userId, 'report', report.tokensUsed);
      }
    } else {
      // Buscar o mais recente
      report = await getLatestCommodityReport(slug);
    }

    if (!report) {
      return NextResponse.json(
        {
          error: 'Nenhum relatório disponível para esta commodity',
          code: 'NO_REPORTS',
          message: 'O relatório semanal será gerado automaticamente pelo sistema.',
        },
        { status: 404 }
      );
    }

    // 7. Buscar datas disponíveis para histórico
    const availableDates = await listCommodityReportDates(slug, 12);

    return NextResponse.json({
      report,
      availableDates,
      usage: {
        remaining: usageCheck.remaining.reports,
      },
    });
  } catch (error) {
    console.error('Commodity report error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório da commodity', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}
