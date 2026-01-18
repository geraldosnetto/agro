
"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
    slug: string;
    isPositive: boolean;
}

export function SparklineChart({ slug, isPositive }: SparklineProps) {
    const [data, setData] = useState<{ valor: number }[]>([]);

    useEffect(() => {
        // Fetch apenas 7 dias para o sparkline
        fetch(`/api/cotacoes/${slug}/historico?days=7`)
            .then(res => res.json())
            .then(setData)
            .catch((err) => {
                console.error(`[Sparkline] Erro ao buscar ${slug}:`, err);
                setData([]);
            });
    }, [slug]);

    if (!data.length) return (
        <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/30 bg-muted/5">
            -
        </div>
    );

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <Line
                    type="monotone"
                    dataKey="valor"
                    stroke={isPositive ? "var(--positive)" : "var(--negative)"}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false} // Performance
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
