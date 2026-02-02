"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateData {
    uf: string;
    value: number;
    variation: number;
    cities: number;
}

interface StateRankingProps {
    data: StateData[];
    onStateClick?: (uf: string) => void;
    selectedState?: string | null;
}

// Nomes completos dos estados
const stateNames: Record<string, string> = {
    AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
    BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
    GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
    MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
    PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
    SE: "Sergipe", SP: "São Paulo", TO: "Tocantins"
};

export function StateRanking({ data, onStateClick, selectedState }: StateRankingProps) {
    if (!data || data.length === 0) {
        return null;
    }

    // Ordenar por variação (maior para menor)
    const sortedByVariation = [...data].sort((a, b) => b.variation - a.variation);

    const topGainers = sortedByVariation.slice(0, 5);
    const topLosers = sortedByVariation.slice(-5).reverse();

    return (
        <div className="space-y-4">
            {/* Top 5 em Alta */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Maiores Altas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {topGainers.map((state, index) => (
                            <StateRow
                                key={state.uf}
                                state={state}
                                rank={index + 1}
                                isPositive={true}
                                onClick={() => onStateClick?.(state.uf)}
                                isSelected={selectedState === state.uf}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top 5 em Queda */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Maiores Quedas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {topLosers.map((state, index) => (
                            <StateRow
                                key={state.uf}
                                state={state}
                                rank={index + 1}
                                isPositive={false}
                                onClick={() => onStateClick?.(state.uf)}
                                isSelected={selectedState === state.uf}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StateRow({
    state,
    rank,
    isPositive,
    onClick,
    isSelected
}: {
    state: StateData;
    rank: number;
    isPositive: boolean;
    onClick?: () => void;
    isSelected?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                isSelected && "bg-primary/10"
            )}
        >
            {/* Posição */}
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                rank === 1 && isPositive && "bg-emerald-100 text-emerald-700",
                rank === 1 && !isPositive && "bg-red-100 text-red-700",
                rank !== 1 && "bg-muted text-muted-foreground"
            )}>
                {rank === 1 ? <Trophy className="h-3 w-3" /> : rank}
            </div>

            {/* Estado */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                    {stateNames[state.uf] || state.uf}
                </p>
                <p className="text-xs text-muted-foreground">
                    {state.cities} {state.cities === 1 ? "praça" : "praças"}
                </p>
            </div>

            {/* Preço */}
            <div className="text-right">
                <p className="font-medium text-sm">
                    R$ {state.value.toFixed(2)}
                </p>
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs px-1.5",
                        state.variation >= 0
                            ? "text-emerald-600 border-emerald-200"
                            : "text-red-600 border-red-200"
                    )}
                >
                    {state.variation >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {state.variation >= 0 ? "+" : ""}{state.variation.toFixed(1)}%
                </Badge>
            </div>
        </button>
    );
}

// Tabela completa (para expansão)
interface StateTableProps {
    data: StateData[];
    onStateClick?: (uf: string) => void;
}

export function StateTable({ data, onStateClick }: StateTableProps) {
    const sorted = [...data].sort((a, b) => b.variation - a.variation);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Todos os Estados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-4 py-2 font-medium">Estado</th>
                                <th className="text-right px-4 py-2 font-medium">Preço</th>
                                <th className="text-right px-4 py-2 font-medium">Variação</th>
                                <th className="text-right px-4 py-2 font-medium">Praças</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sorted.map((state) => (
                                <tr
                                    key={state.uf}
                                    onClick={() => onStateClick?.(state.uf)}
                                    className="hover:bg-muted/30 cursor-pointer"
                                >
                                    <td className="px-4 py-2 font-medium">
                                        {stateNames[state.uf] || state.uf}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        R$ {state.value.toFixed(2)}
                                    </td>
                                    <td className={cn(
                                        "px-4 py-2 text-right font-medium",
                                        state.variation >= 0 ? "text-emerald-600" : "text-red-600"
                                    )}>
                                        {state.variation >= 0 ? "+" : ""}{state.variation.toFixed(2)}%
                                    </td>
                                    <td className="px-4 py-2 text-right text-muted-foreground">
                                        {state.cities}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
