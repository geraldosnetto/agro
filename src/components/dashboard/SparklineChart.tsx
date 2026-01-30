"use client";

import { memo, useMemo } from "react";
import useSWR from "swr";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
    slug: string;
    isPositive: boolean;
}

interface ChartData {
    valor: number;
}

const fetcher = async (url: string): Promise<ChartData[]> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

export const SparklineChart = memo(function SparklineChart({ slug, isPositive }: SparklineProps) {
    const { data, error, isLoading } = useSWR<ChartData[]>(
        `/api/cotacoes/${slug}/historico?days=14`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
            errorRetryCount: 2
        }
    );

    // Calculate domain to amplify variations
    const domain = useMemo(() => {
        if (!data?.length) return [0, 100];
        const values = data.map(d => d.valor);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        // Add 10% padding, but ensure we show some variation even if flat
        const padding = range > 0 ? range * 0.1 : min * 0.02;
        return [min - padding, max + padding];
    }, [data]);

    // Generate unique gradient ID per chart instance
    const gradientId = useMemo(() => `sparkline-${slug}-${isPositive ? 'pos' : 'neg'}`, [slug, isPositive]);

    if (isLoading || error || !data?.length) {
        return (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/30 bg-muted/5">
                {isLoading ? "..." : "-"}
            </div>
        );
    }

    const strokeColor = isPositive ? "var(--positive)" : "var(--negative)";
    const fillColor = isPositive ? "#22c55e" : "#ef4444"; // emerald-500 / red-500

    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={fillColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={fillColor} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <YAxis domain={domain} hide />
                <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={strokeColor}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
});
