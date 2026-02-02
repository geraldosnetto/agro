"use client";

import { useEffect, useState } from "react";
import { ComparatorControls } from "./ComparatorControls";
import { ComparatorChart } from "./ComparatorChart";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommodityOption {
    id: string;
    name: string;
    slug: string;
    category: string;
}

interface CommodityComparatorProps {
    availableCommodities: CommodityOption[];
}

interface ChartDataPoint {
    date: string;
    [key: string]: number | string;
}

interface RawDataPoint {
    date: string;
    value: number;
}

interface RawSeries {
    id: string;
    name: string;
    data: RawDataPoint[];
}

const COLORS = [
    "#2563eb", // blue-600
    "#16a34a", // green-600
    "#dc2626", // red-600
    "#d97706", // amber-600
    "#9333ea", // purple-600
    "#0891b2", // cyan-600
];

export function CommodityComparator({
    availableCommodities,
}: CommodityComparatorProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [days, setDays] = useState("30");
    const [normalized, setNormalized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rawData, setRawData] = useState<RawSeries[]>([]);

    // Carregar dados quando a seleção ou período mudar
    useEffect(() => {
        if (selectedIds.length === 0) {
            setRawData([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    ids: selectedIds.join(","),
                    days: days,
                });
                const res = await fetch(`/api/commodities/history?${query}`);
                if (!res.ok) throw new Error("Falha ao buscar dados");
                const data = await res.json();
                setRawData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce pequeno ou chamada direta
        fetchData();
    }, [selectedIds, days]);

    // Processar dados para o gráfico
    const processData = () => {
        if (rawData.length === 0) return [];

        // 1. Coletar todas as datas únicas
        const allDates = new Set<string>();
        rawData.forEach((series) => {
            series.data.forEach((point) => allDates.add(point.date));
        });
        const sortedDates = Array.from(allDates).sort();

        // 2. Criar pontos de dados unificados
        const chartData: ChartDataPoint[] = sortedDates.map((date) => {
            const point: ChartDataPoint = { date };
            rawData.forEach((series) => {
                const entry = series.data.find((d) => d.date === date);
                if (entry) {
                    point[series.id] = entry.value;
                }
            });
            return point;
        });

        // 3. Normalizar se necessário (Variação %)
        if (normalized) {
            // Encontrar valor inicial de cada série
            const initialValues: Record<string, number> = {};

            // Varrer dados cronologicamente para achar o primeiro valor não nulo de cada id
            chartData.forEach(point => {
                rawData.forEach((series) => {
                    const val = point[series.id];
                    if (initialValues[series.id] === undefined && typeof val === 'number') {
                        initialValues[series.id] = val;
                    }
                });
            });

            return chartData.map((point) => {
                const newPoint = { ...point };
                rawData.forEach((series) => {
                    const val = point[series.id];
                    const initial = initialValues[series.id];
                    if (typeof val === "number" && initial) {
                        newPoint[series.id] = ((val - initial) / initial) * 100;
                    }
                });
                return newPoint;
            });
        }

        return chartData;
    };

    const chartData = processData();

    // Calcular correlação e spread se houver exatamente 2 selecionados
    const stats = selectedIds.length === 2 ? calculateStats(rawData, selectedIds) : null;

    // Definir cores para as séries selecionadas
    const series = selectedIds.map((id, index) => {
        const raw = rawData.find((r) => r.id === id);
        return {
            id: id,
            name: raw ? raw.name : availableCommodities.find(c => c.id === id)?.name || id,
            color: COLORS[index % COLORS.length],
        };
    });

    return (
        <div className="space-y-6">
            <ComparatorControls
                commodities={availableCommodities}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                days={days}
                onDaysChange={setDays}
                normalized={normalized}
                onNormalizedChange={setNormalized}
            />

            {/* Advanced Metrics Panel */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card/50 border rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Correlação (Pearson)</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className={cn(
                                    "text-2xl font-bold",
                                    stats.correlation > 0.7 ? "text-green-500" :
                                        stats.correlation < -0.7 ? "text-red-500" : "text-yellow-500"
                                )}>
                                    {stats.correlation.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {stats.correlation > 0.5 ? "Forte positiva" :
                                        stats.correlation < -0.5 ? "Forte negativa" : "Fraca/Neutra"}
                                </span>
                            </div>
                        </div>
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn("h-full",
                                    stats.correlation > 0 ? "bg-green-500" : "bg-red-500"
                                )}
                                style={{ width: `${Math.abs(stats.correlation) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-card/50 border rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Spread Atual (Diferença)</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold font-mono">
                                    R$ {stats.spread.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {stats.lastDate}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Média do Período</p>
                            <p className="font-mono font-medium">R$ {stats.avgSpread.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <ComparatorChart
                    data={chartData}
                    series={series}
                    normalized={normalized}
                />
            </div>
        </div>
    );
}

// Helpers Mathematics
function calculateStats(rawData: RawSeries[], ids: string[]) {
    if (rawData.length < 2) return null;

    // Alinhar dados por data
    const mapA = new Map(rawData.find(r => r.id === ids[0])?.data.map(d => [d.date, d.value]));
    const mapB = new Map(rawData.find(r => r.id === ids[1])?.data.map(d => [d.date, d.value]));

    // Pegar apenas datas comuns
    const commonDates = Array.from(mapA.keys()).filter(date => mapB.has(date)).sort();

    if (commonDates.length === 0) return null;

    const valuesA = commonDates.map(d => mapA.get(d)!);
    const valuesB = commonDates.map(d => mapB.get(d)!);

    // Pearson Correlation
    const meanA = valuesA.reduce((sum, v) => sum + v, 0) / valuesA.length;
    const meanB = valuesB.reduce((sum, v) => sum + v, 0) / valuesB.length;

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < valuesA.length; i++) {
        const diffA = valuesA[i] - meanA;
        const diffB = valuesB[i] - meanB;
        numerator += diffA * diffB;
        denomA += diffA * diffA;
        denomB += diffB * diffB;
    }

    const correlation = numerator / Math.sqrt(denomA * denomB);

    // Spread
    const lastIdx = valuesA.length - 1;
    const spread = Math.abs(valuesA[lastIdx] - valuesB[lastIdx]);

    const spreads = valuesA.map((v, i) => Math.abs(v - valuesB[i]));
    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

    // Date formatting helper could be here or simple split
    const lastDate = new Date(commonDates[lastIdx]).toLocaleDateString('pt-BR');

    return {
        correlation: isNaN(correlation) ? 0 : correlation,
        spread,
        avgSpread,
        lastDate
    };
}
