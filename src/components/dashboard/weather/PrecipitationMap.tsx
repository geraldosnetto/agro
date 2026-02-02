'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CloudRain } from 'lucide-react';

// Dynamic import para evitar problemas de SSR com react-simple-maps
const PrecipitationMapContent = dynamic(
    () => import('./PrecipitationMapContent').then(mod => mod.PrecipitationMapContent),
    {
        ssr: false,
        loading: () => (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-blue-500" />
                        Mapa de Precipitação
                    </CardTitle>
                    <CardDescription>
                        Previsão de chuva acumulada para os próximos 7 dias
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        ),
    }
);

interface PrecipitationMapProps {
    className?: string;
}

export function PrecipitationMap({ className }: PrecipitationMapProps) {
    return <PrecipitationMapContent className={className} />;
}
