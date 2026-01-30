'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from 'lucide-react';

// Dynamic import com SSR desabilitado - Leaflet precisa de window
const WeatherRadarMapContent = dynamic(
    () => import('./WeatherRadarMapContent').then(mod => mod.WeatherRadarMapContent),
    {
        ssr: false,
        loading: () => (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Map className="h-5 w-5 text-primary" />
                        Radar de Chuva
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        ),
    }
);

interface WeatherRadarMapProps {
    className?: string;
}

export function WeatherRadarMap({ className }: WeatherRadarMapProps) {
    return <WeatherRadarMapContent className={className} />;
}
