
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
    ids: z.string().transform((val) => val.split(",")),
    days: z.coerce.number().default(30),
});

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const result = querySchema.safeParse({
            ids: searchParams.get("ids"),
            days: searchParams.get("days"),
        });

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid parameters" },
                { status: 400 }
            );
        }

        const { ids, days } = result.data;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const commodities = await prisma.commodity.findMany({
            where: {
                id: { in: ids },
            },
            select: {
                id: true,
                nome: true,
                slug: true,
                unidade: true,
                cotacoes: {
                    where: {
                        dataReferencia: {
                            gte: startDate,
                        },
                    },
                    orderBy: {
                        dataReferencia: "asc",
                    },
                    select: {
                        dataReferencia: true,
                        valor: true,
                    },
                },
            },
        });

        // Format data for the chart
        // Recharts usually likes array of objects like [{ date: '...', series1: 100, series2: 200 }]
        // But keeping it normalized by commodity first is easier for the frontend to process into chart format if needed,
        // or we can pre-process here. Let's return raw data grouped by commodity for flexibility.

        const formattedData = commodities.map((c) => ({
            id: c.id,
            name: c.nome,
            slug: c.slug,
            unit: c.unidade,
            data: c.cotacoes.map((cot) => ({
                date: cot.dataReferencia.toISOString().split("T")[0],
                value: cot.valor.toNumber(),
            })),
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error("Error fetching comparison data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
