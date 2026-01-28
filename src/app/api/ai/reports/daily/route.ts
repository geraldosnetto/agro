import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDailyReport } from '@/lib/ai/generators/daily-report';
import { checkAIUsage, incrementAIUsage } from '@/lib/ai/rate-limit-ai';
import { UserPlan } from '@/lib/schemas/ai';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
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

    // 4. Verificar se quer forçar regeneração
    const { searchParams } = new URL(request.url);
    const forceRegenerate = searchParams.get('force') === 'true';

    // 5. Obter relatório (do cache ou gerar novo)
    const report = await getDailyReport(forceRegenerate);

    // 6. Incrementar uso apenas se não foi do cache
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
    console.error('Daily report error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório diário', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}
