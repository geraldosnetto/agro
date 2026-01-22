import { NextResponse } from "next/server";
import { fetchDolarPTAX } from "@/lib/data-sources/bcb";
import prisma from "@/lib/prisma";
import { CategoriaSchema } from "@/lib/schemas/api";
import { formatarUnidade } from "@/lib/formatters";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export async function GET(request: Request) {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Tente novamente em alguns segundos." },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimitResult),
            }
        );
    }

    const { searchParams } = new URL(request.url);
    const categoriaParam = searchParams.get("categoria");

    // Validação type-safe da categoria com Zod
    const categoriaResult = CategoriaSchema.safeParse(
        categoriaParam ? categoriaParam.toUpperCase() : undefined
    );
    const categoriaFilter = categoriaResult.success ? categoriaResult.data : undefined;

    // Buscar dólar PTAX real (BCB)
    const dolar = await fetchDolarPTAX();

    try {
        // Query no banco: Commodities ativas com última cotação
        const commodities = await prisma.commodity.findMany({
            where: {
                ativo: true,
                ...(categoriaFilter ? { categoria: categoriaFilter } : {})
            },
            include: {
                cotacoes: {
                    orderBy: { dataReferencia: 'desc' },
                    take: 1
                }
            }
        });

        // Mapear para o formato esperado pelo frontend
        const cotacoesFormatadas = commodities.map((c) => {
            const ultimaCotacao = c.cotacoes[0];

            // Valores default caso não tenha cotação (ex: recém criada)
            const valor = ultimaCotacao?.valor?.toNumber() ?? 0;
            const valorAnterior = ultimaCotacao?.valorAnterior?.toNumber() ?? 0;

            // Recalcular variação se necessário, ou usar a do banco
            const variacao = ultimaCotacao?.variacao?.toNumber() ??
                (valorAnterior > 0 ? ((valor - valorAnterior) / valorAnterior) * 100 : 0);

            return {
                slug: c.slug,
                nome: c.nome,
                valor: valor,
                valorAnterior: valorAnterior,
                unidade: c.unidade,
                categoria: c.categoria,
                praca: ultimaCotacao?.praca ?? "N/A",
                estado: ultimaCotacao?.estado ?? "N/A",
                fonte: ultimaCotacao?.fonte ?? "Interno",
                variacao: variacao,
                dataAtualizacao: ultimaCotacao?.dataReferencia?.toISOString() ?? c.updatedAt.toISOString(),
                // Formatando Unidade para Display (Opcional, mas bom para UX)
                unidadeDisplay: formatarUnidade(c.unidade)
            };
        });

        return NextResponse.json({
            cotacoes: cotacoesFormatadas,
            dolar: dolar
                ? {
                    compra: dolar.compra,
                    venda: dolar.venda,
                    variacao: dolar.variacao,
                    data: dolar.data.toISOString(),
                }
                : null,
            meta: {
                total: cotacoesFormatadas.length,
                ultimaAtualizacao: new Date().toISOString(),
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                ...getRateLimitHeaders(rateLimitResult),
            }
        });
    } catch (error) {
        logger.error("Erro ao buscar cotações", { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Erro interno ao buscar dados" }, { status: 500 });
    }
}
