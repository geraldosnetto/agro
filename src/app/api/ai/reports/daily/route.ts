import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getLatestDailyReport,
  getDailyReportByDate,
  listDailyReportDates,
  generateDailyReport,
} from '@/lib/ai/generators/daily-report';
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
    const { searchParams } = new URL(request.url);

    // 2. Verificar se é requisição de listar datas
    const listDates = searchParams.get('list') === 'true';
    if (listDates) {
      const dates = await listDailyReportDates(30);
      return NextResponse.json({ dates });
    }

    // 3. Buscar plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const plan = (user?.plan || 'free') as UserPlan;

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

    // 5. Verificar se quer uma data específica
    const dateParam = searchParams.get('date');
    const forceRegenerate = searchParams.get('force') === 'true';

    let report;

    if (dateParam) {
      // Buscar relatório de data específica
      const targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Data inválida', code: 'INVALID_DATE' },
          { status: 400 }
        );
      }
      report = await getDailyReportByDate(targetDate);

      if (!report) {
        return NextResponse.json(
          { error: 'Relatório não encontrado para esta data', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
    } else if (forceRegenerate) {
      // Forçar geração de novo relatório
      report = await generateDailyReport();
      if (!report.cached) {
        await incrementAIUsage(userId, 'report', report.tokensUsed);
      }
    } else {
      // Buscar o mais recente
      report = await getLatestDailyReport();

      if (!report) {
        return NextResponse.json(
          {
            error: 'Nenhum relatório disponível ainda',
            code: 'NO_REPORTS',
            message: 'O relatório diário será gerado automaticamente pelo sistema.',
          },
          { status: 404 }
        );
      }
    }

    // 6. Buscar datas disponíveis para histórico
    const availableDates = await listDailyReportDates(30);

    return NextResponse.json({
      report,
      availableDates,
      usage: {
        remaining: usageCheck.remaining.reports,
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório diário', code: 'API_ERROR' },
      { status: 500 }
    );
  }
}
