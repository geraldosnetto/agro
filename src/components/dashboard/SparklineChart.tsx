"use client";

import useSWR from "swr";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
    slug: string;
    isPositive: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export function SparklineChart({ slug, isPositive }: SparklineProps) {
    const { data, error, isLoading } = useSWR<{ valor: number }[]>(
        `/api/cotacoes/${slug}/historico?days=7`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // Cache por 1 minuto
            errorRetryCount: 2
        }
    );

    if (isLoading || error || !data?.length) {
        return (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/30 bg-muted/5">
                {isLoading ? "..." : "-"}
            </div>
        );
    }

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
