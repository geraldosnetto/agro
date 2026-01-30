import { NextResponse } from 'next/server';
import { generateCommodityReport } from '@/lib/ai/generators/commodity-report';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';

// Este endpoint deve ser chamado por um cron job
// Frequência recomendada: semanalmente às segundas-feiras às 08:00

export async function GET(request: Request) {
  // Verificar cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{
    commodity: string;
    success: boolean;
    reportId?: string;
    cached?: boolean;
    error?: string;
  }> = [];

  try {
    logger.info('Iniciando geração de relatórios semanais');

    // Buscar todas as commodities ativas
    const commodities = await prisma.commodity.findMany({
      where: { ativo: true },
      select: { slug: true, nome: true },
      orderBy: { nome: 'asc' },
    });

    let generated = 0;
    let cached = 0;
    let errors = 0;

    // Gerar relatório para cada commodity
    for (const commodity of commodities) {
      try {
        const report = await generateCommodityReport(commodity.slug);

        if (report) {
          results.push({
            commodity: commodity.nome,
            success: true,
            reportId: report.id,
            cached: report.cached,
          });

          if (report.cached) {
            cached++;
          } else {
            generated++;
          }
        } else {
          results.push({
            commodity: commodity.nome,
            success: false,
            error: 'Dados insuficientes',
          });
          errors++;
        }
      } catch (error) {
        results.push({
          commodity: commodity.nome,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        errors++;

        logger.error('Erro ao gerar relatório semanal para commodity', {
          commodity: commodity.slug,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Pequeno delay para não sobrecarregar a API do Claude
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const duration = Date.now() - startTime;

    // Log de execução
    await prisma.atualizacaoLog.create({
      data: {
        fonte: 'WEEKLY_REPORTS',
        status: errors === commodities.length ? 'ERROR' : 'SUCCESS',
        mensagem: `Relatórios semanais: ${generated} gerados, ${cached} em cache, ${errors} erros`,
        registros: generated + cached,
        duracao: duration,
      },
    });

    logger.info('Geração de relatórios semanais concluída', {
      total: commodities.length,
      generated,
      cached,
      errors,
      duration,
    });

    return NextResponse.json({
      message: 'Geração de relatórios concluída',
      stats: {
        total: commodities.length,
        generated,
        cached,
        errors,
      },
      results,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Erro crítico na geração de relatórios semanais', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Log de erro
    await prisma.atualizacaoLog.create({
      data: {
        fonte: 'WEEKLY_REPORTS',
        status: 'ERROR',
        mensagem: error instanceof Error ? error.message : 'Erro crítico',
        registros: 0,
        duracao: duration,
      },
    });

    return NextResponse.json(
      { error: 'Erro crítico na geração de relatórios' },
      { status: 500 }
    );
  }
}
