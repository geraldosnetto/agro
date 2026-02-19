'use client';

import dynamic from 'next/dynamic';
import type { TradingChartProps } from './TradingChart';

const TradingChart = dynamic(
    () => import("./TradingChart").then(mod => mod.TradingChart),
    {
        ssr: false,
        loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm">Carregando gráfico...</div>
    }
);

export function TradingChartWrapper(props: TradingChartProps) {
    return <TradingChart {...props} />;
}
