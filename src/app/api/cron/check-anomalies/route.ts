import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { detectAnomalies, formatExpectedRange, type DetectedAnomaly } from '@/lib/ml/anomaly';
import logger from '@/lib/logger';

// Este endpoint deve ser chamado por um cron job
// Frequência recomendada: diariamente após atualização de cotações

export async function GET(request: Request) {
  // Verificar cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    let anomaliesDetected = 0;
    let commoditiesChecked = 0;

    // Buscar todas as commodities ativas
    const commodities = await prisma.commodity.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, slug: true },
    });

    const results: Array<{
      commodity: string;
      anomalies: DetectedAnomaly[];
    }> = [];

    // Para cada commodity, buscar histórico e detectar anomalias
    for (const commodity of commodities) {
      commoditiesChecked++;

      // Buscar últimos 60 dias de cotações
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 60);

      const cotacoes = await prisma.cotacao.findMany({
        where: {
          commodityId: commodity.id,
          dataReferencia: { gte: cutoffDate },
        },
        orderBy: { dataReferencia: 'asc' },
        select: {
          dataReferencia: true,
          valor: true,
        },
      });

      if (cotacoes.length < 14) {
        // Não há dados suficientes
        continue;
      }

      // Agrupar por data (média se houver múltiplas praças)
      const grouped = new Map<string, { date: Date; values: number[] }>();
      for (const c of cotacoes) {
        const key = c.dataReferencia.toISOString().split('T')[0];
        const existing = grouped.get(key);
        if (existing) {
          existing.values.push(c.valor.toNumber());
        } else {
          grouped.set(key, { date: c.dataReferencia, values: [c.valor.toNumber()] });
        }
      }

      // Calcular média por dia
      const priceData = Array.from(grouped.values()).map(g => ({
        date: g.date,
        value: g.values.reduce((a, b) => a + b, 0) / g.values.length,
      }));

      // Detectar anomalias
      const anomalies = detectAnomalies(priceData);

      if (anomalies.length > 0) {
        results.push({ commodity: commodity.nome, anomalies });

        // Salvar anomalias no banco
        for (const anomaly of anomalies) {
          // Verificar se já existe anomalia similar recente (últimas 24h)
          const recentAnomaly = await prisma.priceAnomaly.findFirst({
            where: {
              commodityId: commodity.id,
              type: anomaly.type,
              detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });

          if (!recentAnomaly) {
            await prisma.priceAnomaly.create({
              data: {
                commodityId: commodity.id,
                type: anomaly.type,
                severity: anomaly.severity,
                description: anomaly.description,
                detectedValue: anomaly.detectedValue,
                expectedRange: formatExpectedRange(anomaly.expectedRange),
                deviationPercent: anomaly.deviationPercent,
              },
            });
            anomaliesDetected++;

            logger.info('Anomalia detectada', {
              commodity: commodity.nome,
              type: anomaly.type,
              severity: anomaly.severity,
              value: anomaly.detectedValue,
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log de execução
    await prisma.atualizacaoLog.create({
      data: {
        fonte: 'ANOMALY_DETECTION',
        status: 'SUCCESS',
        mensagem: `Verificadas ${commoditiesChecked} commodities, ${anomaliesDetected} anomalias detectadas`,
        registros: anomaliesDetected,
        duracao: duration,
      },
    });

    logger.info('Verificação de anomalias concluída', {
      commoditiesChecked,
      anomaliesDetected,
      duration,
    });

    return NextResponse.json({
      message: 'Verificação concluída',
      commoditiesChecked,
      anomaliesDetected,
      results,
      duration,
    });

  } catch (error) {
    logger.error('Erro na verificação de anomalias', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
