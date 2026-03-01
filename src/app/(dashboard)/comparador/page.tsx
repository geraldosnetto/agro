
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { CommodityComparator } from "@/components/dashboard/comparator/CommodityComparator";
import { ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Comparador de Commodities | IndicAgro",
    description: "Compare a evolução de preços de diferentes commodities agrícolas lado a lado.",
};

export default async function ComparadorPage() {
    const commodities = await prisma.commodity.findMany({
        where: { ativo: true },
        select: {
            id: true,
            nome: true,
            slug: true,
            categoria: true,
        },
        orderBy: { nome: "asc" },
    });

    const formattedCommodities = commodities.map((c) => ({
        id: c.id,
        name: c.nome,
        slug: c.slug,
        category: c.categoria,
    }));

    return (
        <div className="container px-4 py-6 md:py-8 space-y-8">
            <PageHeader
                title="Comparador de Preços"
                description="Compare o histórico de preços entre diferentes commodities ou praças."
                icon={ArrowRightLeft}
            />

            <CommodityComparator availableCommodities={formattedCommodities} />
        </div>
    );
}
