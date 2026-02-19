import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

import { PRACA_NAMES } from "@/lib/commodities";

const createAlertaSchema = z.object({
    commodityId: z.string().min(1, "Commodity é obrigatória"),
    tipo: z.enum(["ACIMA", "ABAIXO", "VARIACAO"]),
    valorAlvo: z.number().positive().optional(),
    percentual: z.number().min(0.1).max(100).optional(),
}).refine(
    (data) => {
        if (data.tipo === "VARIACAO") {
            return data.percentual !== undefined;
        }
        return data.valorAlvo !== undefined;
    },
    {
        message: "Valor alvo é obrigatório para alertas de preço, percentual para variação",
    }
);

// GET - List user's alerts
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const alertas = await prisma.alertaUsuario.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        // Get commodity info for each alert
        const commodityIds = [...new Set(alertas.map((a) => a.commodityId))];
        const commodities = await prisma.commodity.findMany({
            where: { id: { in: commodityIds } },
            select: {
                id: true,
                nome: true,
                slug: true,
                unidade: true,
                cotacoes: {
                    orderBy: { dataReferencia: "desc" },
                    take: 5, // Fetch more to find the preferred praca
                    select: { valor: true, praca: true },
                },
            },
        });

        type CommodityWithCotacoes = (typeof commodities)[0];
        const commodityMap = new Map<string, CommodityWithCotacoes>(
            commodities.map((c) => [c.id, c])
        );

        const alertasComCommodity = alertas.map((alerta) => {
            const commodity = commodityMap.get(alerta.commodityId);
            let precoAtual = 0;

            if (commodity && commodity.cotacoes && commodity.cotacoes.length > 0) {
                const preferredPracas = PRACA_NAMES[commodity.slug] || [];

                // Try to find a quote from the preferred praca
                const bestQuote = commodity.cotacoes.find(c => c.praca && preferredPracas.includes(c.praca))
                    || commodity.cotacoes[0]; // Fallback to the latest one

                precoAtual = bestQuote.valor?.toNumber() ?? 0;
            }

            return {
                ...alerta,
                valorAlvo: alerta.valorAlvo?.toNumber() ?? null,
                percentual: alerta.percentual?.toNumber() ?? null,
                commodity: commodity
                    ? {
                        nome: commodity.nome,
                        slug: commodity.slug,
                        unidade: commodity.unidade,
                        precoAtual: precoAtual,
                    }
                    : null,
            };
        });

        return NextResponse.json(alertasComCommodity);
    } catch (error) {
        console.error("Erro ao listar alertas:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// POST - Create new alert
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const result = createAlertaSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Dados inválidos", details: result.error.issues },
                { status: 400 }
            );
        }

        const { commodityId, tipo, valorAlvo, percentual } = result.data;

        // Check if commodity exists (try by ID first, then by slug)
        let commodity = await prisma.commodity.findUnique({
            where: { id: commodityId },
        });

        // If not found by ID, try by slug
        if (!commodity) {
            commodity = await prisma.commodity.findUnique({
                where: { slug: commodityId },
            });
        }

        if (!commodity) {
            return NextResponse.json(
                { error: "Commodity não encontrada" },
                { status: 404 }
            );
        }

        // Check user's alert limit (free plan = 3 alerts)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true },
        });

        const alertCount = await prisma.alertaUsuario.count({
            where: { userId: session.user.id, ativo: true },
        });

        const maxAlerts = user?.plan === "free" ? 3 : user?.plan === "pro" ? 50 : 1000;

        if (alertCount >= maxAlerts) {
            return NextResponse.json(
                {
                    error: `Limite de alertas atingido (${maxAlerts})`,
                    upgrade: user?.plan === "free",
                },
                { status: 403 }
            );
        }

        // Create alert (use the real commodity ID from database)
        const alerta = await prisma.alertaUsuario.create({
            data: {
                userId: session.user.id,
                commodityId: commodity.id,
                tipo,
                valorAlvo: valorAlvo ?? null,
                percentual: percentual ?? null,
            },
        });

        return NextResponse.json(
            {
                message: "Alerta criado com sucesso",
                alerta: {
                    ...alerta,
                    valorAlvo: alerta.valorAlvo?.toNumber() ?? null,
                    percentual: alerta.percentual?.toNumber() ?? null,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao criar alerta:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
