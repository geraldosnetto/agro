
import { Metadata } from "next";
import { HeatMapContainer } from "@/components/dashboard/heatmap/HeatMapContainer";
import { Map } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const metadata: Metadata = {
    title: "Mapa de Calor Agrícola | IndicAgro",
    description: "Visualize as cotações agrícolas e variações de preço por estado no mapa do Brasil.",
};

export default function MapaPage() {
    return (
        <div className="container px-4 py-6 md:py-8 space-y-8">
            <PageHeader
                title="Mapa de Preços"
                description="Visualize a distribuição geográfica dos preços das commodities agrícolas."
                icon={Map}
            />

            <HeatMapContainer />
        </div>
    );
}
