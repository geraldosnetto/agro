import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { formatarUnidade } from "@/lib/formatters";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// GET - Export commodity price history as CSV
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30"; // Default 30 days

        // Find commodity
        const commodity = await prisma.commodity.findUnique({
            where: { slug },
            select: {
                id: true,
                nome: true,
                slug: true,
                unidade: true,
            },
        });

        if (!commodity) {
            return NextResponse.json(
                { error: "Commodity não encontrada" },
                { status: 404 }
            );
        }

        // Calculate date range
        let startDate: Date | undefined;
        const now = new Date();

        switch (period) {
            case "7":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "90":
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case "365":
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case "all":
                startDate = undefined;
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Fetch quotes
        const cotacoes = await prisma.cotacao.findMany({
            where: {
                commodityId: commodity.id,
                ...(startDate && { dataReferencia: { gte: startDate } }),
            },
            orderBy: { dataReferencia: "desc" },
            select: {
                dataReferencia: true,
                valor: true,
                valorAnterior: true,
                variacao: true,
                praca: true,
            },
        });

        if (cotacoes.length === 0) {
            return NextResponse.json(
                { error: "Nenhuma cotação encontrada para o período" },
                { status: 404 }
            );
        }

        // Build CSV
        const unidade = formatarUnidade(commodity.unidade);
        const headers = ["Data", "Valor (R$)", "Valor Anterior (R$)", "Variação (%)", "Praça"];

        const rows = cotacoes.map((c) => {
            const data = new Date(c.dataReferencia).toLocaleDateString("pt-BR");
            const valor = c.valor?.toNumber().toFixed(2) ?? "";
            const valorAnterior = c.valorAnterior?.toNumber().toFixed(2) ?? "";
            const variacao = c.variacao?.toNumber().toFixed(2) ?? "";
            const praca = c.praca || "";

            return [data, valor, valorAnterior, variacao, praca].join(";");
        });

        // Add metadata header
        const metadata = [
            `# Exportação de Cotações - IndicAgro`,
            `# Commodity: ${commodity.nome}`,
            `# Unidade: ${unidade}`,
            `# Período: ${period === "all" ? "Todos" : `Últimos ${period} dias`}`,
            `# Gerado em: ${new Date().toLocaleString("pt-BR")}`,
            `# Total de registros: ${cotacoes.length}`,
            ``,
        ];

        const csvContent = [...metadata, headers.join(";"), ...rows].join("\n");

        // Return CSV file
        const filename = `${commodity.slug}-cotacoes-${period}d-${new Date().toISOString().split("T")[0]}.csv`;

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Erro ao exportar cotações:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
