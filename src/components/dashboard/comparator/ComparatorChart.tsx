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
    ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
    date: string;
    [key: string]: number | string;
}

interface CommoditySeries {
    id: string;
    name: string;
    color: string;
}

export // Interface auxiliar para os dados do tooltip do Recharts
    interface TooltipPayload {
    name: string;
    value: number;
    color: string;
    payload?: any; // Dados originais
}

// Interface separada para o payload da legenda
interface LegendItemPayload {
    value: any;
    id?: string;
    type?: any;
    color?: string;
    payload?: any;
}

export interface ComparatorChartProps {
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
            <div className="flex h-[450px] w-full items-center justify-center rounded-xl border border-dashed bg-muted/5">
                <div className="text-center">
                    <p className="text-muted-foreground font-medium">
                        Selecione commodities para comparar
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                        Escolha até 5 itens para visualizar o gráfico
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[450px] w-full rounded-xl border bg-card/50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg leading-none tracking-tight">Comparativo de Performance</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {normalized ? "Variação percentual no período" : "Valores nominais (R$)"}
                    </p>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="90%" minWidth={0} minHeight={0}>
                <LineChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.4}
                    />

                    {normalized && (
                        <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeOpacity={0.2} />
                    )}

                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                            format(parseISO(value), "dd MMM", { locale: ptBR }).toUpperCase()
                        }
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        dy={10}
                        minTickGap={30}
                    />

                    <YAxis
                        className="text-xs font-mono"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                            normalized
                                ? `${value > 0 ? "+" : ""}${value}%`
                                : `R$ ${value}`
                        }
                        width={normalized ? 50 : 60}
                    />

                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-popover/95 px-3 py-2.5 shadow-xl backdrop-blur-sm ring-1 ring-border/50">
                                        <p className="mb-2 text-xs font-semibold text-foreground/80 border-b pb-1">
                                            {format(parseISO(label as string), "EEEE, dd 'de' MMMM", {
                                                locale: ptBR,
                                            })}
                                        </p>
                                        <div className="flex flex-col gap-1.5">
                                            {payload.map((entry: TooltipPayload) => (
                                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-2 w-2 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {entry.name}
                                                        </span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-bold font-mono",
                                                        normalized
                                                            ? (entry.value > 0 ? "text-positive" : entry.value < 0 ? "text-negative" : "text-foreground")
                                                            : "text-foreground"
                                                    )}>
                                                        {normalized
                                                            ? `${entry.value > 0 ? "+" : ""}${Number(entry.value).toFixed(2)}%`
                                                            : `R$ ${Number(entry.value).toFixed(2)}`
                                                        }
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />

                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        content={({ payload }) => (
                            <div className="flex flex-wrap gap-4 justify-end mb-4">
                                {payload?.map((entry: LegendItemPayload, index: number) => (
                                    <div key={`item-${index}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/30 border border-transparent hover:border-border transition-colors cursor-pointer">
                                        <div
                                            className="h-2 w-2 rounded-full ring-2 ring-background"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-xs font-medium text-foreground">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    />

                    {series.map((s) => (
                        <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.id}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 6,
                                strokeWidth: 0,
                                fill: s.color,
                                className: "animate-pulse"
                            }}
                            animationDuration={1000}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
