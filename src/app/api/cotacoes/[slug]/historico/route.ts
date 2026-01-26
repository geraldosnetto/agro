import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HistoricoQuerySchema, SlugSchema } from "@/lib/schemas/api";
import logger from "@/lib/logger";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const rawSlug = (await params).slug;
    const { searchParams } = new URL(request.url);

    // Validação do slug com Zod
    const slugResult = SlugSchema.safeParse(rawSlug);
    if (!slugResult.success) {
        return NextResponse.json(
            { error: "Slug inválido", details: slugResult.error.issues },
            { status: 400 }
        );
    }
    const slug = slugResult.data;

    // Validação do parâmetro days com Zod (inclui bounds 1-365)
    const queryResult = HistoricoQuerySchema.safeParse({
        days: searchParams.get("days") || "30",
    });
    if (!queryResult.success) {
        return NextResponse.json(
            { error: "Parâmetro days inválido", details: queryResult.error.issues },
            { status: 400 }
        );
    }
    const { days } = queryResult.data;

    // Praça filter (optional) - will be resolved to actual praça name from DB
    const pracaIndexParam = searchParams.get("praca");
    let pracaFilter: string | undefined;

    try {
        // Calcular data de corte
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Buscar commodity id pelo slug
        const commodity = await prisma.commodity.findUnique({
            where: { slug },
            select: { id: true, nome: true }
        });

        if (!commodity) {
            return NextResponse.json({ error: "Commodity não encontrada" }, { status: 404 });
        }

        // If praça index provided, get actual praça name from DB
        if (pracaIndexParam !== null) {
            const pracaIndex = parseInt(pracaIndexParam, 10);
            if (!isNaN(pracaIndex)) {
                const pracasResult = await prisma.cotacao.findMany({
                    where: {
                        commodityId: commodity.id,
                        NOT: { praca: 'Seed History' }
                    },
                    select: { praca: true },
                    distinct: ['praca'],
                    orderBy: { praca: 'asc' }
                });

                if (pracaIndex < pracasResult.length) {
                    pracaFilter = pracasResult[pracaIndex].praca || undefined;
                }
            }
        }

        // Build where clause
        const whereClause: {
            commodityId: string;
            dataReferencia: { gte: Date };
            praca?: string;
        } = {
            commodityId: commodity.id,
            dataReferencia: {
                gte: startDate
            }
        };

        if (pracaFilter) {
            whereClause.praca = pracaFilter;
        }

        // Buscar histórico
        const historico = await prisma.cotacao.findMany({
            where: whereClause,
            orderBy: {
                dataReferencia: 'asc'
            },
            select: {
                dataReferencia: true,
                valor: true,
                praca: true
            }
        });

        // Formatar para o gráfico
        const data = historico.map(h => ({
            date: new Date(h.dataReferencia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            valor: h.valor.toNumber(),
            praca: h.praca
        }));

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });

    } catch (error) {
        logger.error("Erro ao buscar histórico", { slug, days, error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
