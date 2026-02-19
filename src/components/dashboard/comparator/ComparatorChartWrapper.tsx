'use client';

import dynamic from 'next/dynamic';
import { ComparatorChartProps } from './ComparatorChart';

const ComparatorChart = dynamic(() => import('./ComparatorChart').then(mod => mod.ComparatorChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full animate-pulse bg-muted/20 rounded-lg" />
});

export function ComparatorChartWrapper(props: ComparatorChartProps) {
    return <ComparatorChart {...props} />;
}
