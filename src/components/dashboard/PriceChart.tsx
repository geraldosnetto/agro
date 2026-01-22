"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

const periods = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1a", days: 365 }
];

interface ChartData {
    date: string;
    valor: number;
}

interface PriceChartProps {
    commoditySlug?: string;
    commodityName?: string;
}

export function PriceChart({ commoditySlug = "soja", commodityName = "Soja" }: PriceChartProps) {
    const [period, setPeriod] = useState("30"); // Default 30 dias
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/cotacoes/${commoditySlug}/historico?days=${period}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch {
                // Erro silencioso - componente mostra "Sem dados" como fallback
            } finally {
                setLoading(false);
            }
        }

        if (commoditySlug) {
            fetchData();
        }
    }, [commoditySlug, period]);

    // Calculate min/max for Y axis domain using reduce (evita stack overflow com arrays grandes)
    const { min, max } = data.length > 0
        ? data.reduce(
            (acc, d) => ({
                min: Math.min(acc.min, d.valor),
                max: Math.max(acc.max, d.valor)
            }),
            { min: data[0].valor, max: data[0].valor }
        )
        : { min: 0, max: 100 };

    const yMin = min * 0.98;
    const yMax = max * 1.02;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-normal">Histórico de Preços</CardTitle>
                    <CardDescription>{commodityName}</CardDescription>
                </div>
                <Tabs value={period} onValueChange={setPeriod} className="w-auto">
                    <TabsList className="h-8">
                        {periods.map((p) => (
                            <TabsTrigger key={p.label} value={p.days.toString()} className="h-6 text-xs px-2">
                                {p.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    {loading ? (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                            Carregando...
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                            Sem dados para o período
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    className="text-xs text-muted-foreground"
                                    minTickGap={30}
                                />
                                <YAxis
                                    hide={false}
                                    domain={[yMin, yMax]}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value.toFixed(0)}`}
                                    className="text-xs text-muted-foreground"
                                    width={60}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Data
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {label}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Valor
                                                            </span>
                                                            <span className="font-bold text-foreground">
                                                                R$ {Number(payload[0].value).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="valor"
                                    stroke="var(--chart-1)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorValor)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
