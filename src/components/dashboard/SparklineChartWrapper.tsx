'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { SparklineProps } from './SparklineChart';

const SparklineChart = dynamic(() => import('./SparklineChart').then(mod => mod.SparklineChart), {
    ssr: false,
    loading: () => <div className="h-full w-full min-h-[60px] min-w-[100px] animate-pulse bg-muted/20 rounded" />
});

export function SparklineChartWrapper({ className, ...props }: SparklineProps & { className?: string }) {
    // Force a minimum container size to prevent Recharts width(-1) error using Tailwind classes
    return (
        <div className={cn("w-full h-full min-h-[60px] min-w-[100px]", className)}>
            <SparklineChart {...props} />
        </div>
    );
}
