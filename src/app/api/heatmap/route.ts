
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Commodity } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const commoditySlug = searchParams.get('commodity');

    try {
        // 1. Buscar a commodity
        let commodity: Commodity | null = null;

        if (commoditySlug) {
            commodity = await prisma.commodity.findUnique({
                where: { slug: commoditySlug }
            });
        } else {
            // Se não especificado, pega a primeira (geralmente Soja)
            commodity = await prisma.commodity.findFirst({
                orderBy: { nome: 'asc' }
            });
        }

        if (!commodity) {
            return NextResponse.json({ error: 'Commodity não encontrada' }, { status: 404 });
        }

        // 2. Buscar últimas cotações para essa commodity
        // Precisamos agrupar por Estado.
        // Como o Prisma não tem "DISTINCT ON" nativo fácil para agrupar por estado pegando a última data,
        // vamos buscar as cotações recentes (últimos 7 dias) e processar em memória.

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const cotacoes = await prisma.cotacao.findMany({
            where: {
                commodityId: commodity.id,
                dataReferencia: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: {
                dataReferencia: 'desc'
            }
        });

        // 3. Agrupar por Estado (UF)
        const stateMap = new Map<string, {
            prices: number[];
            variations: number[];
            cityCount: number;
        }>();

        // Processar cotações, mantendo apenas a MACIS RECENTE para cada praça
        const processedPracas = new Set<string>();

        for (const cotacao of cotacoes) {
            // Chave única para praça (ex: "Sorriso-MT")
            const pracaKey = `${cotacao.praca}-${cotacao.estado}`;

            if (processedPracas.has(pracaKey)) continue;
            processedPracas.add(pracaKey);

            const uf = cotacao.estado.toUpperCase();

            if (!stateMap.has(uf)) {
                stateMap.set(uf, { prices: [], variations: [], cityCount: 0 });
            }

            const stateData = stateMap.get(uf)!;
            stateData.prices.push(Number(cotacao.valor));
            stateData.cityCount++;

            if (cotacao.variacao) {
                stateData.variations.push(Number(cotacao.variacao));
            }
        }

        // 4. Calcular médias por estado
        let heatmapData = Array.from(stateMap.entries()).map(([uf, data]) => {
            const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;

            // Variação média (considerando apenas quem teve variação registrada)
            const avgVariation = data.variations.length > 0
                ? data.variations.reduce((a, b) => a + b, 0) / data.variations.length
                : 0;

            return {
                id: `BR-${uf}`, // Formato padrão do TopoJSON
                uf,
                value: Number(avgPrice.toFixed(2)),
                variation: Number(avgVariation.toFixed(2)),
                cities: data.cityCount
            };
        });

        // =================================================================================
        // O FALLBACK simulado com Math.random foi removido por exigência do negócio. 
        // Apenas dados reais agregados nos estados via Prisma serão exibidos.
        // Se a commodity só tiver cotação unificada 'BR', o mapa não pintará os estados.
        // =================================================================================

        // 5. Buscar lista de commodities para o dropdown
        const allCommodities = await prisma.commodity.findMany({
            where: { ativo: true },
            select: { slug: true, nome: true, unidade: true },
            orderBy: { nome: 'asc' }
        });

        return NextResponse.json({
            commodity: {
                name: commodity.nome,
                unit: commodity.unidade,
                slug: commodity.slug
            },
            data: heatmapData,
            availableCommodities: allCommodities
        });

    } catch (error) {
        console.error("Erro no Heatmap API:", error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
