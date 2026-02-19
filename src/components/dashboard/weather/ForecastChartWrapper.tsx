'use client';

import dynamic from 'next/dynamic';
import { ForecastChartProps } from './ForecastChart';

const ForecastChart = dynamic(() => import('./ForecastChart').then(mod => mod.ForecastChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full animate-pulse bg-muted/20 rounded-lg" />
});

export function ForecastChartWrapper(props: ForecastChartProps) {
    return <ForecastChart {...props} />;
}
