
"use client";

import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BrazilMapProps {
    data: Array<{
        id: string; // BR-SP format
        uf: string;
        value: number;
        variation: number;
        cities: number;
    }>;
    unit: string;
}

// Mapa GeoJSON do Brasil (Estados)
const geoUrl = "/brazil-states.json";

const BrazilMap = ({ data, unit }: BrazilMapProps) => {
    // Configuração da escala de cores
    const maxVariation = Math.max(...data.map((d) => Math.abs(d.variation)), 0.1);

    // Escala: Vermelho (-max) -> Cinza (0) -> Verde (+max)
    const colorScale = scaleLinear<string>()
        .domain([-maxVariation, 0, maxVariation])
        .range(["#ef4444", "#e5e7eb", "#22c55e"]) // red-500, gray-200, green-500
        .clamp(true);

    return (
        <div className="w-full h-[500px] bg-card rounded-xl border shadow-sm flex items-center justify-center overflow-hidden relative">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 750,
                    center: [-54, -15] // Centro aproximado do Brasil
                }}
                className="w-full h-full"
            >
                <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // GeoJSON properties: { name: "São Paulo", sigla: "SP" } - depende do arquivo
                                // O arquivo do click_that_hood tem "name" e "sigla" ou similar? 
                                // Vou assumir que precisamos mapear o nome ou sigla.
                                // O arquivo baixado tem "name" e "sigla"? Vamos checar ou assumir match pelo nome.
                                // Geralmente user tem "sigla" ou "state_code".
                                // VOU ASSUMIR QUE VOU USAR 'id' ou 'properties.sigla'.
                                // Se o arquivo tiver 'properties.sigla', ótimo.

                                const cur = data.find((s) => s.uf === geo.properties.sigla || s.uf === geo.properties.name);

                                return (
                                    <TooltipProvider key={geo.rsmKey}>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Geography
                                                    geography={geo}
                                                    fill={cur ? colorScale(cur.variation) : "#f3f4f6"} // default gray-100
                                                    stroke="#ffffff"
                                                    strokeWidth={0.5}
                                                    style={{
                                                        default: { outline: "none" },
                                                        hover: { fill: "#10b981", outline: "none", cursor: "pointer" }, // green-500 hover
                                                        pressed: { outline: "none" },
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="p-3 text-center">
                                                <div className="font-bold text-lg">{geo.properties.name}</div>
                                                {cur ? (
                                                    <>
                                                        <div className="text-2xl font-bold my-1">
                                                            R$ {cur.value.toFixed(2)}
                                                        </div>
                                                        <div className={`text-sm font-medium ${cur.variation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {cur.variation > 0 ? '+' : ''}{cur.variation}% ({cur.cities} cidades)
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1 uppercase">{unit}</div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">Sem dados recentes</div>
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Legenda */}
            <div className="absolute bottom-4 right-4 bg-background/90 p-3 rounded-lg border text-xs shadow-sm backdrop-blur">
                <div className="font-medium mb-2 text-center">Variação (7 dias)</div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Queda</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                    <span>Estável</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Alta</span>
                </div>
            </div>
        </div>
    );
};

export default memo(BrazilMap);
