import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const QuerySchema = z.object({
  commodity: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  acknowledged: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// GET - Buscar anomalias
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Converter null para undefined (Zod .optional() não aceita null)
    const parsed = QuerySchema.safeParse({
      commodity: searchParams.get('commodity') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      acknowledged: searchParams.get('acknowledged') ?? undefined,
      limit: searchParams.get('limit') || '10',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { commodity, severity, acknowledged, limit } = parsed.data;

    // Construir filtro
    const where: {
      commodityId?: string;
      severity?: string;
      acknowledged?: boolean;
    } = {};

    if (commodity) {
      // Buscar commodity por slug
      const comm = await prisma.commodity.findUnique({
        where: { slug: commodity },
        select: { id: true },
      });
      if (comm) {
        where.commodityId = comm.id;
      }
    }

    if (severity) {
      where.severity = severity;
    }

    if (acknowledged !== undefined) {
      where.acknowledged = acknowledged === 'true';
    }

    // Buscar anomalias
    const anomalies = await prisma.priceAnomaly.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: limit,
    });

    // Buscar nomes das commodities
    const commodityIds = [...new Set(anomalies.map(a => a.commodityId))];
    const commodities = await prisma.commodity.findMany({
      where: { id: { in: commodityIds } },
      select: { id: true, nome: true, slug: true },
    });
    const commodityMap = new Map(commodities.map(c => [c.id, c]));

    // Formatar resposta
    const formatted = anomalies.map(a => {
      const comm = commodityMap.get(a.commodityId);
      return {
        id: a.id,
        commodity: {
          id: a.commodityId,
          name: comm?.nome || 'Desconhecida',
          slug: comm?.slug || '',
        },
        type: a.type,
        severity: a.severity,
        description: a.description,
        detectedValue: a.detectedValue.toNumber(),
        expectedRange: a.expectedRange,
        deviationPercent: a.deviationPercent.toNumber(),
        detectedAt: a.detectedAt,
        acknowledged: a.acknowledged,
      };
    });

    // Estatísticas
    const stats = {
      total: formatted.length,
      bySeverity: {
        high: formatted.filter(a => a.severity === 'HIGH').length,
        medium: formatted.filter(a => a.severity === 'MEDIUM').length,
        low: formatted.filter(a => a.severity === 'LOW').length,
      },
      unacknowledged: formatted.filter(a => !a.acknowledged).length,
    };

    return NextResponse.json({
      anomalies: formatted,
      stats,
    });

  } catch (error) {
    console.error('Erro ao buscar anomalias:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH - Marcar anomalia como reconhecida
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, acknowledged } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const updated = await prisma.priceAnomaly.update({
      where: { id },
      data: { acknowledged: acknowledged ?? true },
    });

    return NextResponse.json({
      success: true,
      anomaly: {
        id: updated.id,
        acknowledged: updated.acknowledged,
      },
    });

  } catch (error) {
    console.error('Erro ao atualizar anomalia:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
