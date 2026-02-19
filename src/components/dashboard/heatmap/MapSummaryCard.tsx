"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, MapPin, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapSummaryCardProps {
    data: Array<{
        uf: string;
        value: number;
        variation: number;
        cities: number;
    }>;
    commodityName: string;
    unit: string;
}

export function MapSummaryCard({ data, commodityName, unit }: MapSummaryCardProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    Sem dados disponíveis
                </CardContent>
            </Card>
        );
    }

    // Calcular estatísticas
    const avgPrice = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const avgVariation = data.reduce((sum, d) => sum + d.variation, 0) / data.length;
    const totalCities = data.reduce((sum, d) => sum + d.cities, 0);
    const totalStates = data.length;

    const minPrice = Math.min(...data.map(d => d.value));
    const maxPrice = Math.max(...data.map(d => d.value));
    const minState = data.find(d => d.value === minPrice);
    const maxState = data.find(d => d.value === maxPrice);

    const positiveStates = data.filter(d => d.variation > 0).length;
    const negativeStates = data.filter(d => d.variation < 0).length;

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Resumo Nacional
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Preço Médio */}
                <div className="text-center p-4 rounded-lg bg-muted/30 border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {commodityName} - Média Brasil
                    </p>
                    <p className="text-3xl font-bold mt-1">
                        R$ {avgPrice.toFixed(2)}
                    </p>
                    <Badge
                        variant="outline"
                        className={cn(
                            "mt-2",
                            avgVariation >= 0
                                ? "text-positive border-positive-subtle bg-positive-muted"
                                : "text-negative border-negative-subtle bg-negative-muted"
                        )}
                    >
                        {avgVariation >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {avgVariation >= 0 ? "+" : ""}{avgVariation.toFixed(2)}% (7 dias)
                    </Badge>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/20 border">
                        <p className="text-xs text-muted-foreground">Estados</p>
                        <p className="font-semibold">{totalStates}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border">
                        <p className="text-xs text-muted-foreground">Praças</p>
                        <p className="font-semibold">{totalCities}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-positive-muted border border-positive-subtle">
                        <p className="text-xs text-positive">Em Alta</p>
                        <p className="font-semibold text-positive">{positiveStates} estados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-negative-muted border border-negative-subtle">
                        <p className="text-xs text-negative">Em Queda</p>
                        <p className="font-semibold text-negative">{negativeStates} estados</p>
                    </div>
                </div>

                {/* Menor e Maior Preço */}
                <div className="space-y-2 border-t pt-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Menor preço
                        </span>
                        <span className="font-medium">
                            {minState?.uf}: R$ {minPrice.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Maior preço
                        </span>
                        <span className="font-medium">
                            {maxState?.uf}: R$ {maxPrice.toFixed(2)}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                    {unit}
                </p>
            </CardContent>
        </Card>
    );
}
