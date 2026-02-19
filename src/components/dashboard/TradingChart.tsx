"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    applyIndicators,
    getRSIInterpretation,
    getMACDInterpretation,
    type ChartDataPoint,
} from "@/lib/indicators/technical";

const periods = [
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
    { label: "1a", days: 365 },
];

export interface TradingChartProps {
    commoditySlug: string;
    commodityName: string;
    praca?: number;
    className?: string;
}

interface IndicatorState {
    sma20: boolean;
    sma50: boolean;
    ema12: boolean;
    ema26: boolean;
    bollinger: boolean;
    rsi: boolean;
    macd: boolean;
}

export function TradingChart({
    commoditySlug,
    commodityName,
    praca,
    className,
}: TradingChartProps) {
    const [period, setPeriod] = useState("90");
    const [rawData, setRawData] = useState<{ date: string; valor: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [indicators, setIndicators] = useState<IndicatorState>({
        sma20: true,
        sma50: false,
        ema12: false,
        ema26: false,
        bollinger: false,
        rsi: false,
        macd: false,
    });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const pracaParam = praca !== undefined ? `&praca=${praca}` : "";
                const res = await fetch(
                    `/api/cotacoes/${commoditySlug}/historico?days=${period}${pracaParam}`
                );
                if (res.ok) {
                    const json = await res.json();
                    setRawData(json);
                }
            } catch {
                // Erro silencioso
            } finally {
                setLoading(false);
            }
        }

        if (commoditySlug) {
            fetchData();
        }
    }, [commoditySlug, period, praca]);

    // Apply indicators to data
    const data = useMemo(() => {
        if (rawData.length === 0) return [];
        return applyIndicators(rawData, indicators);
    }, [rawData, indicators]);

    // Calculate Y axis domain
    const { yMin, yMax, currentValue, change, changePercent } = useMemo(() => {
        if (data.length === 0) return { yMin: 0, yMax: 100, currentValue: 0, change: 0, changePercent: 0 };

        const values = data.map((d) => d.valor);
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Include Bollinger bands in range if active
        let rangeMin = min;
        let rangeMax = max;
        if (indicators.bollinger) {
            const bollingerLows = data.map((d) => d.bollingerLower).filter((v): v is number => v !== undefined);
            const bollingerHighs = data.map((d) => d.bollingerUpper).filter((v): v is number => v !== undefined);
            if (bollingerLows.length) rangeMin = Math.min(rangeMin, ...bollingerLows);
            if (bollingerHighs.length) rangeMax = Math.max(rangeMax, ...bollingerHighs);
        }

        const current = data[data.length - 1]?.valor ?? 0;
        const first = data[0]?.valor ?? current;
        const chg = current - first;
        const chgPct = first > 0 ? (chg / first) * 100 : 0;

        return {
            yMin: rangeMin * 0.98,
            yMax: rangeMax * 1.02,
            currentValue: current,
            change: chg,
            changePercent: chgPct,
        };
    }, [data, indicators.bollinger]);

    // Get latest RSI and MACD values
    const latestRsi = data.length > 0 ? data[data.length - 1].rsi : undefined;
    const latestMacd = data.length > 0 ? data[data.length - 1].macd : undefined;
    const latestMacdSignal = data.length > 0 ? data[data.length - 1].macdSignal : undefined;

    const toggleIndicator = (key: keyof IndicatorState) => {
        setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const activeIndicatorCount = Object.values(indicators).filter(Boolean).length;

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                {commodityName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl font-bold">
                                    R$ {currentValue.toFixed(2)}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "flex items-center gap-1",
                                        change >= 0
                                            ? "text-positive border-positive-subtle bg-positive-muted"
                                            : "text-negative border-negative-subtle bg-negative-muted"
                                    )}
                                >
                                    {change >= 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    {change >= 0 ? "+" : ""}
                                    {changePercent.toFixed(2)}%
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Period Selector */}
                        <Tabs value={period} onValueChange={setPeriod}>
                            <TabsList className="h-8">
                                {periods.map((p) => (
                                    <TabsTrigger
                                        key={p.label}
                                        value={p.days.toString()}
                                        className="h-6 text-xs px-2"
                                    >
                                        {p.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        {/* Indicators Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    <Settings2 className="h-4 w-4 mr-1" />
                                    Indicadores
                                    {activeIndicatorCount > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                                            {activeIndicatorCount}
                                        </Badge>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Médias Móveis</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.sma20}
                                    onCheckedChange={() => toggleIndicator("sma20")}
                                >
                                    SMA 20 (curto)
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.sma50}
                                    onCheckedChange={() => toggleIndicator("sma50")}
                                >
                                    SMA 50 (longo)
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.ema12}
                                    onCheckedChange={() => toggleIndicator("ema12")}
                                >
                                    EMA 12
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.ema26}
                                    onCheckedChange={() => toggleIndicator("ema26")}
                                >
                                    EMA 26
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Volatilidade</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.bollinger}
                                    onCheckedChange={() => toggleIndicator("bollinger")}
                                >
                                    Bandas de Bollinger
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Osciladores</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.rsi}
                                    onCheckedChange={() => toggleIndicator("rsi")}
                                >
                                    RSI (14)
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={indicators.macd}
                                    onCheckedChange={() => toggleIndicator("macd")}
                                >
                                    MACD
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Indicator Status Badges */}
                {(latestRsi !== undefined || (latestMacd !== undefined && latestMacdSignal !== undefined)) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {indicators.rsi && latestRsi !== undefined && (
                            <Badge variant="outline" className={cn("text-xs", getRSIInterpretation(latestRsi).color)}>
                                RSI: {latestRsi.toFixed(1)} ({getRSIInterpretation(latestRsi).label})
                            </Badge>
                        )}
                        {indicators.macd && latestMacd !== undefined && latestMacdSignal !== undefined && (
                            <Badge variant="outline" className={cn("text-xs", getMACDInterpretation(latestMacd, latestMacdSignal).color)}>
                                MACD: {getMACDInterpretation(latestMacd, latestMacdSignal).label}
                            </Badge>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Main Price Chart */}
                <div className="h-[300px] w-full min-w-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Carregando...
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Sem dados para o período
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                            <ComposedChart data={data}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBollinger" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    className="text-xs"
                                    minTickGap={40}
                                />
                                <YAxis
                                    domain={[yMin, yMax]}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `R$${v.toFixed(0)}`}
                                    className="text-xs"
                                    width={55}
                                />
                                <Tooltip content={<ChartTooltip indicators={indicators} />} />

                                {/* Bollinger Bands */}
                                {indicators.bollinger && (
                                    <>
                                        <Area
                                            type="monotone"
                                            dataKey="bollingerUpper"
                                            stroke="#8b5cf6"
                                            strokeWidth={1}
                                            strokeDasharray="3 3"
                                            fill="none"
                                            dot={false}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="bollingerLower"
                                            stroke="#8b5cf6"
                                            strokeWidth={1}
                                            strokeDasharray="3 3"
                                            fill="url(#colorBollinger)"
                                            dot={false}
                                        />
                                    </>
                                )}

                                {/* Price Area */}
                                <Area
                                    type="monotone"
                                    dataKey="valor"
                                    stroke="var(--chart-1)"
                                    strokeWidth={2}
                                    fill="url(#colorPrice)"
                                    dot={false}
                                />

                                {/* Moving Averages */}
                                {indicators.sma20 && (
                                    <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                                )}
                                {indicators.sma50 && (
                                    <Line type="monotone" dataKey="sma50" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                                )}
                                {indicators.ema12 && (
                                    <Line type="monotone" dataKey="ema12" stroke="#10b981" strokeWidth={1.5} dot={false} />
                                )}
                                {indicators.ema26 && (
                                    <Line type="monotone" dataKey="ema26" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* RSI Chart */}
                {indicators.rsi && data.length > 0 && (
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">RSI (14)</span>
                        </div>
                        <div className="h-[100px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorRsi" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={30} className="text-xs" />
                                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                                    <Area type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#colorRsi)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* MACD Chart */}
                {indicators.macd && data.length > 0 && (
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">MACD (12, 26, 9)</span>
                        </div>
                        <div className="h-[100px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                                <ComposedChart data={data}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis tickLine={false} axisLine={false} width={30} className="text-xs" />
                                    <ReferenceLine y={0} stroke="#888" strokeWidth={1} />
                                    <Bar dataKey="macdHistogram" fill="#94a3b8" />
                                    <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                                    <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-3">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-[var(--chart-1)]" /> Preço
                    </span>
                    {indicators.sma20 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-amber-500" /> SMA 20
                        </span>
                    )}
                    {indicators.sma50 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-red-500" /> SMA 50
                        </span>
                    )}
                    {indicators.ema12 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-emerald-500" /> EMA 12
                        </span>
                    )}
                    {indicators.ema26 && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-blue-500" /> EMA 26
                        </span>
                    )}
                    {indicators.bollinger && (
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-purple-500 border-dashed" /> Bollinger
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Custom Tooltip Component
function ChartTooltip({
    active,
    payload,
    label,
    indicators,
}: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; payload: ChartDataPoint }>;
    label?: string;
    indicators: IndicatorState;
}) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as ChartDataPoint;

    return (
        <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
            <div className="font-medium mb-2">{label}</div>
            <div className="space-y-1">
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Preço:</span>
                    <span className="font-medium">R$ {data.valor.toFixed(2)}</span>
                </div>
                {indicators.sma20 && data.sma20 !== undefined && (
                    <div className="flex justify-between gap-4">
                        <span className="text-amber-500">SMA 20:</span>
                        <span>R$ {data.sma20.toFixed(2)}</span>
                    </div>
                )}
                {indicators.sma50 && data.sma50 !== undefined && (
                    <div className="flex justify-between gap-4">
                        <span className="text-red-500">SMA 50:</span>
                        <span>R$ {data.sma50.toFixed(2)}</span>
                    </div>
                )}
                {indicators.bollinger && data.bollingerUpper !== undefined && (
                    <div className="flex justify-between gap-4">
                        <span className="text-purple-500">Bollinger:</span>
                        <span>
                            {data.bollingerLower?.toFixed(0)} - {data.bollingerUpper?.toFixed(0)}
                        </span>
                    </div>
                )}
                {indicators.rsi && data.rsi !== undefined && (
                    <div className="flex justify-between gap-4">
                        <span className={getRSIInterpretation(data.rsi).color}>RSI:</span>
                        <span>{data.rsi.toFixed(1)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
