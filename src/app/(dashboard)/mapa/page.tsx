
import { Metadata } from "next";
import { HeatMapContainer } from "@/components/dashboard/heatmap/HeatMapContainer";
import { Map } from "lucide-react";

export const metadata: Metadata = {
    title: "Mapa de Calor Agrícola | IndicAgro",
    description: "Visualize as cotações agrícolas e variações de preço por estado no mapa do Brasil.",
};

export default function MapaPage() {
    return (
        <div className="container mx-auto p-6 md:py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Map className="h-8 w-8 text-primary" />
                    Mapa de Calor
                </h1>
                <p className="text-muted-foreground text-lg">
                    Visualize a tendência de preços em todo o território nacional.
                </p>
            </div>

            <HeatMapContainer />
        </div>
    );
}
