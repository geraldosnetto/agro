'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, TrendingDown, TrendingUp } from 'lucide-react';
import { WeatherData } from '@/lib/data-sources/weather';
import { calculateRainfallAccumulation } from '@/lib/agro-analyzers';

interface RainfallAccumulationProps {
    weather: WeatherData;
    className?: string;
}

export function RainfallAccumulation({ weather, className }: RainfallAccumulationProps) {
    const rainfall = calculateRainfallAccumulation(weather);

    // Média histórica aproximada para o Brasil (referência)
    const avgMonthlyMM = 120; // ~120mm/mês = ~30mm/semana
    const expectedWeekly = avgMonthlyMM / 4;

    const percentOfAvg = Math.round((rainfall.next7Days / expectedWeekly) * 100);
    const isAboveAvg = percentOfAvg > 100;
    const isBelowAvg = percentOfAvg < 80;

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Acúmulo de Chuva
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Próximos 7 dias */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Próximos 7 dias</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {rainfall.next7Days.toFixed(1)} mm
                            </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isAboveAvg
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : isBelowAvg
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                            {isAboveAvg ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : isBelowAvg ? (
                                <TrendingDown className="h-4 w-4" />
                            ) : null}
                            <span>{percentOfAvg}% da média</span>
                        </div>
                    </div>

                    {/* Barra de progresso visual */}
                    <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isAboveAvg ? 'bg-blue-500' : isBelowAvg ? 'bg-amber-500' : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(percentOfAvg, 200)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0mm</span>
                            <span className="text-center">Média: {expectedWeekly.toFixed(0)}mm</span>
                            <span>{(expectedWeekly * 2).toFixed(0)}mm+</span>
                        </div>
                    </div>

                    {/* Interpretação */}
                    <p className="text-sm text-muted-foreground">
                        {isBelowAvg
                            ? '⚠️ Precipitação abaixo da média. Monitore a irrigação.'
                            : isAboveAvg
                                ? '💧 Precipitação acima da média. Bom para culturas em crescimento.'
                                : '✅ Precipitação dentro da normalidade.'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
