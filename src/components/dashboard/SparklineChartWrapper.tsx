'use client';

import dynamic from 'next/dynamic';
import { SparklineProps } from './SparklineChart';

const SparklineChart = dynamic(() => import('./SparklineChart').then(mod => mod.SparklineChart), {
    ssr: false,
    loading: () => <div className="w-full h-full animate-pulse bg-muted/20" />
});

export function SparklineChartWrapper(props: SparklineProps) {
    return <SparklineChart {...props} />;
}
