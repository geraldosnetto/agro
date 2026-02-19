'use client';

import dynamic from 'next/dynamic';
import { PriceChartProps } from './PriceChart';

const PriceChart = dynamic(() => import('./PriceChart').then(mod => mod.PriceChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full animate-pulse bg-muted/20 rounded-lg" />
});

export function PriceChartWrapper(props: PriceChartProps) {
    return <PriceChart {...props} />;
}
