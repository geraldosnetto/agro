import { NextResponse } from "next/server";
import { fetchDolarPTAX } from "@/lib/data-sources/bcb";
import prisma from "@/lib/prisma";
import { Categoria } from "@prisma/client";

// Validador de categoria usando o enum do Prisma
function isValidCategoria(value: string): value is Categoria {
    return Object.values(Categoria).includes(value.toUpperCase() as Categoria);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const categoriaParam = searchParams.get("categoria");

    // Validação type-safe da categoria
    const categoriaFilter = categoriaParam && isValidCategoria(categoriaParam)
        ? categoriaParam.toUpperCase() as Categoria
        : undefined;

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
                unidade: c.unidade, // O enum do banco bate com o esperado? (SACA_60KG vs "sc 60kg") -> Precisa mapear para display?
                // O Frontend exibe direto string. O Seed populou "SACA_60KG".
                // Talvez precise formatar a unidade para ficar bonito ("sc 60kg").
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
        });
    } catch (error) {
        console.error("Erro ao buscar cotações:", error);
        return NextResponse.json({ error: "Erro interno ao buscar dados" }, { status: 500 });
    }
}

function formatarUnidade(unidade: string): string {
    const map: Record<string, string> = {
        'SACA_60KG': 'sc 60kg',
        'ARROBA': '@',
        'LITRO': 'L',
        'TONELADA': 'ton',
        'KG': 'kg',
        'SACA_50KG': 'sc 50kg'
    };
    return map[unidade] || unidade;
}
