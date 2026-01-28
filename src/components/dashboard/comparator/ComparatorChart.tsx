"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartDataPoint {
    date: string;
    [key: string]: number | string;
}

interface CommoditySeries {
    id: string;
    name: string;
    color: string;
}

interface ComparatorChartProps {
    data: ChartDataPoint[];
    series: CommoditySeries[];
    normalized?: boolean;
}

export function ComparatorChart({
    data,
    series,
    normalized = false,
}: ComparatorChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center rounded-lg border bg-muted/10">
                <p className="text-muted-foreground">
                    Selecione commodities para comparar
                </p>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-lg border bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                            format(parseISO(value), "dd/MM", { locale: ptBR })
                        }
                        className="text-xs text-muted-foreground"
                        tick={{ fill: "currentColor" }}
                        stroke="none"
                    />
                    <YAxis
                        className="text-xs text-muted-foreground"
                        tick={{ fill: "currentColor" }}
                        stroke="none"
                        unit={normalized ? "%" : ""}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        labelFormatter={(value) =>
                            format(parseISO(value as string), "dd 'de' MMMM, yyyy", {
                                locale: ptBR,
                            })
                        }
                        formatter={(value: number | string) => {
                            const val = Number(value);
                            return [
                                normalized
                                    ? `${val > 0 ? "+" : ""}${val.toFixed(2)}%`
                                    : `R$ ${val.toFixed(2)}`,
                                undefined,
                            ];
                        }}
                    />
                    <Legend />
                    {series.map((s) => (
                        <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.id}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
