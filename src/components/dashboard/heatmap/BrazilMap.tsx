
"use client";

import React, { memo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BrazilMapProps {
    data: Array<{
        id: string;
        uf: string;
        value: number;
        variation: number;
        cities: number;
    }>;
    unit: string;
    colorMode?: "variation" | "price";
    selectedState?: string | null;
    onStateClick?: (uf: string) => void;
}

// Mapa GeoJSON do Brasil (Estados)
const geoUrl = "/brazil-states.json";

// Nomes dos estados
const stateNames: Record<string, string> = {
    AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
    BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
    GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
    MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
    PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
    SE: "Sergipe", SP: "São Paulo", TO: "Tocantins"
};

const BrazilMap = ({
    data,
    unit,
    colorMode = "variation",
    selectedState,
    onStateClick
}: BrazilMapProps) => {
    // Configuração da escala de cores para variação
    const maxVariation = Math.max(...data.map((d) => Math.abs(d.variation)), 0.1);

    const variationColorScale = scaleLinear<string>()
        .domain([-maxVariation, 0, maxVariation])
        .range(["#ef4444", "#e5e7eb", "#22c55e"])
        .clamp(true);

    // Configuração da escala de cores para preço
    const prices = data.map(d => d.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceColorScale = scaleLinear<string>()
        .domain([minPrice, (minPrice + maxPrice) / 2, maxPrice])
        .range(["#fef3c7", "#f59e0b", "#b45309"]) // amber gradient
        .clamp(true);

    const getStateColor = (stateData: typeof data[0] | undefined) => {
        if (!stateData) return "#f3f4f6";

        if (colorMode === "price") {
            return priceColorScale(stateData.value);
        }
        return variationColorScale(stateData.variation);
    };

    return (
        <div className="w-full h-[500px] bg-card rounded-xl border shadow-sm flex items-center justify-center overflow-hidden relative">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 800,
                    center: [-54, -15]
                }}
                className="w-full h-full"
            >
                <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const uf = geo.properties.sigla || geo.properties.name?.substring(0, 2).toUpperCase();
                                const cur = data.find((s) => s.uf === uf || s.uf === geo.properties.sigla || s.uf === geo.properties.name);
                                const isSelected = selectedState === uf || selectedState === geo.properties.sigla;

                                return (
                                    <TooltipProvider key={geo.rsmKey}>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Geography
                                                    geography={geo}
                                                    fill={getStateColor(cur)}
                                                    stroke={isSelected ? "#000" : "#ffffff"}
                                                    strokeWidth={isSelected ? 2 : 0.5}
                                                    onClick={() => {
                                                        const stateUf = geo.properties.sigla || uf;
                                                        onStateClick?.(stateUf);
                                                    }}
                                                    style={{
                                                        default: {
                                                            outline: "none",
                                                            transition: "all 0.2s ease"
                                                        },
                                                        hover: {
                                                            fill: "#10b981",
                                                            outline: "none",
                                                            cursor: "pointer",
                                                            strokeWidth: 1.5
                                                        },
                                                        pressed: { outline: "none" },
                                                    }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="p-3 min-w-[180px]">
                                                <div className="font-bold text-lg mb-2">
                                                    {stateNames[uf] || geo.properties.name}
                                                </div>
                                                {cur ? (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Preço:</span>
                                                            <span className="font-bold">R$ {cur.value.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Variação:</span>
                                                            <span className={cn(
                                                                "font-medium",
                                                                cur.variation >= 0 ? 'text-positive' : 'text-negative'
                                                            )}>
                                                                {cur.variation > 0 ? '+' : ''}{cur.variation}%
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Praças:</span>
                                                            <span>{cur.cities}</span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t text-center">
                                                            {unit}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground">
                                                        Sem dados recentes
                                                    </div>
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

            {/* Legenda dinâmica */}
            <div className="absolute bottom-4 left-4 bg-background/95 p-3 rounded-lg border text-xs shadow-sm backdrop-blur">
                <div className="font-medium mb-2">
                    {colorMode === "variation" ? "Variação (7 dias)" : "Faixa de Preço"}
                </div>
                {colorMode === "variation" ? (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-red-500 rounded" />
                            <span>Queda</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-gray-200 rounded" />
                            <span>Estável</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-green-500 rounded" />
                            <span>Alta</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-amber-100 rounded" />
                            <span>R$ {minPrice.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-amber-500 rounded" />
                            <span>R$ {((minPrice + maxPrice) / 2).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-amber-700 rounded" />
                            <span>R$ {maxPrice.toFixed(0)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Estado selecionado */}
            {selectedState && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    {stateNames[selectedState] || selectedState}
                </div>
            )}
        </div>
    );
};

export default memo(BrazilMap);
