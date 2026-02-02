"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, BarChart3, Activity } from "lucide-react";

interface StatsData {
    min52Semanas: number;
    max52Semanas: number;
    media30Dias: number;
    volatilidade: number;
    dataMin: string;
    dataMax: string;
}

interface CommodityStatsProps {
    slug: string;
    layout?: 'horizontal' | 'grid';
}

export function CommodityStats({ slug, layout = 'horizontal' }: CommodityStatsProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const res = await fetch(`/api/cotacoes/${slug}/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch {
                // Silently fail - will show loading or empty state
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [slug]);

    // Grid 2x2 para layout 'grid', horizontal 4 colunas para 'horizontal'
    const gridClass = layout === 'grid'
        ? "grid grid-cols-2 gap-3 h-full"
        : "grid grid-cols-2 md:grid-cols-4 gap-4";

    if (loading) {
        return (
            <div className={gridClass}>
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="h-4 bg-muted rounded w-20 mb-2" />
                            <div className="h-7 bg-muted rounded w-24 mb-1" />
                            <div className="h-3 bg-muted rounded w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={gridClass}>
                <StatCard
                    icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
                    label="Min 52 semanas"
                    value="--"
                    subtext="Sem dados"
                />
                <StatCard
                    icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                    label="Max 52 semanas"
                    value="--"
                    subtext="Sem dados"
                />
                <StatCard
                    icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
                    label="Média 30 dias"
                    value="--"
                    subtext="Sem dados"
                />
                <StatCard
                    icon={<Activity className="h-4 w-4 text-amber-500" />}
                    label="Volatilidade"
                    value="--"
                    subtext="Sem dados"
                />
            </div>
        );
    }

    return (
        <div className={gridClass}>
            <StatCard
                icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
                label="Min 52 semanas"
                value={`R$ ${stats.min52Semanas.toFixed(2)}`}
                subtext={stats.dataMin}
            />
            <StatCard
                icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                label="Max 52 semanas"
                value={`R$ ${stats.max52Semanas.toFixed(2)}`}
                subtext={stats.dataMax}
            />
            <StatCard
                icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
                label="Média 30 dias"
                value={`R$ ${stats.media30Dias.toFixed(2)}`}
                subtext="Último mês"
            />
            <StatCard
                icon={<Activity className="h-4 w-4 text-amber-500" />}
                label="Volatilidade"
                value={`${stats.volatilidade.toFixed(2)}%`}
                subtext="Desvio padrão"
            />
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtext: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
    return (
        <Card className="h-full">
            <CardContent className="p-4 h-full flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );
}
