"use client";

import { useEffect, useState } from "react";
import { ComparatorControls } from "./ComparatorControls";
import { ComparatorChart } from "./ComparatorChart";
import { Loader2 } from "lucide-react";

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
