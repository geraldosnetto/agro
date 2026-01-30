import { NextResponse } from 'next/server';
import { generateDailyReport } from '@/lib/ai/generators/daily-report';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

// Este endpoint deve ser chamado por um cron job
// Frequência recomendada: diariamente às 07:00 (após atualização de cotações)

export async function GET(request: Request) {
  // Verificar cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    logger.info('Iniciando geração de relatório diário');

    const report = await generateDailyReport();

    const duration = Date.now() - startTime;

    // Log de execução
    await prisma.atualizacaoLog.create({
      data: {
        fonte: 'DAILY_REPORT',
        status: 'SUCCESS',
        mensagem: `Relatório diário gerado: ${report.title}`,
        registros: 1,
        duracao: duration,
      },
    });

    logger.info('Relatório diário gerado com sucesso', {
      id: report.id,
      cached: report.cached,
      duration,
    });

    return NextResponse.json({
      message: 'Relatório gerado com sucesso',
      report: {
        id: report.id,
        title: report.title,
        reportDate: report.reportDate,
        cached: report.cached,
      },
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Erro ao gerar relatório diário', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Log de erro
    await prisma.atualizacaoLog.create({
      data: {
        fonte: 'DAILY_REPORT',
        status: 'ERROR',
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        registros: 0,
        duracao: duration,
      },
    });

    return NextResponse.json(
      { error: 'Erro ao gerar relatório diário' },
      { status: 500 }
    );
  }
}
