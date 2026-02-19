'use client';

import dynamic from 'next/dynamic';
import { SentimentGaugeProps } from './SentimentGauge';

const SentimentGauge = dynamic(() => import('./SentimentGauge').then(mod => mod.SentimentGauge), {
    ssr: false,
    loading: () => <div className="h-[280px] w-full animate-pulse bg-muted/20 rounded-full" />
});

export function SentimentGaugeWrapper(props: SentimentGaugeProps) {
    return <SentimentGauge {...props} />;
}
