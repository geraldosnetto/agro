import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SlugSchema } from "@/lib/schemas/api";
import logger from "@/lib/logger";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const rawSlug = (await params).slug;

    // Validação do slug com Zod
    const slugResult = SlugSchema.safeParse(rawSlug);
    if (!slugResult.success) {
        return NextResponse.json(
            { error: "Slug inválido", details: slugResult.error.issues },
            { status: 400 }
        );
    }
    const slug = slugResult.data;

    try {
        // Buscar commodity id pelo slug
        const commodity = await prisma.commodity.findUnique({
            where: { slug },
            select: { id: true, nome: true }
        });

        if (!commodity) {
            return NextResponse.json({ error: "Commodity não encontrada" }, { status: 404 });
        }

        // Calcular datas de corte
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        // Buscar cotações dos últimos 52 semanas (1 ano)
        const cotacoes52Semanas = await prisma.cotacao.findMany({
            where: {
                commodityId: commodity.id,
                dataReferencia: {
                    gte: umAnoAtras
                }
            },
            orderBy: {
                dataReferencia: 'asc'
            },
            select: {
                dataReferencia: true,
                valor: true
            }
        });

        if (cotacoes52Semanas.length === 0) {
            return NextResponse.json({
                min52Semanas: 0,
                max52Semanas: 0,
                media30Dias: 0,
                volatilidade: 0,
                dataMin: "N/A",
                dataMax: "N/A"
            });
        }

        // Calcular min e max de 52 semanas
        let min52Semanas = Infinity;
        let max52Semanas = -Infinity;
        let dataMin = "";
        let dataMax = "";

        cotacoes52Semanas.forEach(c => {
            const valor = c.valor.toNumber();
            if (valor < min52Semanas) {
                min52Semanas = valor;
                dataMin = new Date(c.dataReferencia).toLocaleDateString("pt-BR");
            }
            if (valor > max52Semanas) {
                max52Semanas = valor;
                dataMax = new Date(c.dataReferencia).toLocaleDateString("pt-BR");
            }
        });

        // Filtrar cotações dos últimos 30 dias para média e volatilidade
        const cotacoes30Dias = cotacoes52Semanas.filter(
            c => new Date(c.dataReferencia) >= trintaDiasAtras
        );

        // Calcular média dos últimos 30 dias
        const soma30Dias = cotacoes30Dias.reduce((acc, c) => acc + c.valor.toNumber(), 0);
        const media30Dias = cotacoes30Dias.length > 0 ? soma30Dias / cotacoes30Dias.length : 0;

        // Calcular volatilidade (desvio padrão percentual)
        let volatilidade = 0;
        if (cotacoes30Dias.length > 1) {
            const valores = cotacoes30Dias.map(c => c.valor.toNumber());
            const media = valores.reduce((a, b) => a + b, 0) / valores.length;
            const variancia = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valores.length;
            const desvioPadrao = Math.sqrt(variancia);
            volatilidade = (desvioPadrao / media) * 100; // Coeficiente de variação
        }

        return NextResponse.json({
            min52Semanas: min52Semanas === Infinity ? 0 : min52Semanas,
            max52Semanas: max52Semanas === -Infinity ? 0 : max52Semanas,
            media30Dias,
            volatilidade,
            dataMin,
            dataMax
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });

    } catch (error) {
        logger.error("Erro ao calcular estatísticas", { slug, error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
