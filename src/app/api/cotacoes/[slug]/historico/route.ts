
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> } // Next.js 15+ espera promise em params dynamic
) {
    const slug = (await params).slug;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

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

        // Buscar histórico
        const historico = await prisma.cotacao.findMany({
            where: {
                commodityId: commodity.id,
                dataReferencia: {
                    gte: startDate
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

        // Formatar para o gráfico
        const data = historico.map(h => ({
            date: new Date(h.dataReferencia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            valor: h.valor.toNumber()
        }));

        return NextResponse.json(data);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
