'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, Thermometer, Droplets, Wind } from 'lucide-react';

// Principais cidades agrícolas do Brasil
const AGRO_CITIES = [
    { name: 'Sorriso', state: 'MT', lat: -12.5424, lon: -55.7218 },
    { name: 'Rondonópolis', state: 'MT', lat: -16.4693, lon: -54.6356 },
    { name: 'Rio Verde', state: 'GO', lat: -17.7987, lon: -50.9239 },
    { name: 'Cascavel', state: 'PR', lat: -24.9578, lon: -53.4595 },
    { name: 'Dourados', state: 'MS', lat: -22.2234, lon: -54.8122 },
];

interface CityWeather {
    name: string;
    state: string;
    temp: number;
    rain: number;
    wind: number;
    condition: string;
}

interface RegionalComparisonProps {
    className?: string;
}

export function RegionalComparison({ className }: RegionalComparisonProps) {
    const [cities, setCities] = useState<CityWeather[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRegionalData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Buscar dados de todas as cidades em paralelo
            const promises = AGRO_CITIES.map(async (city) => {
                const res = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}`);
                if (!res.ok) throw new Error(`Erro ao buscar ${city.name}`);
                const json = await res.json();

                // API retorna { success: true, data: { current, daily } }
                const data = json.data;

                return {
                    name: city.name,
                    state: city.state,
                    temp: data?.current?.temperature ?? 0,
                    rain: data?.daily?.precipitationSum?.[0] ?? 0,
                    wind: data?.current?.windSpeed ?? 0,
                    condition: data?.current?.description ?? 'N/A',
                };
            });

            const results = await Promise.allSettled(promises);
            const successfulResults = results
                .filter((r): r is PromiseFulfilledResult<CityWeather> => r.status === 'fulfilled')
                .map(r => r.value);

            if (successfulResults.length === 0) {
                throw new Error('Não foi possível carregar dados regionais');
            }

            setCities(successfulResults);
        } catch (err) {
            console.error('Erro regional:', err);
            setError('Erro ao carregar comparação regional');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegionalData();
    }, [fetchRegionalData]);

    const getConditionColor = (temp: number) => {
        if (temp >= 35) return 'text-red-500';
        if (temp >= 30) return 'text-orange-500';
        if (temp >= 20) return 'text-green-500';
        if (temp >= 10) return 'text-blue-500';
        return 'text-cyan-500';
    };

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-primary" />
                    Comparação Regional
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={fetchRegionalData}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {error ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
                ) : loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Header */}
                        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium py-1 border-b">
                            <span>Cidade</span>
                            <span className="text-center">Temp</span>
                            <span className="text-center">Chuva</span>
                            <span className="text-center">Vento</span>
                        </div>

                        {/* Data rows */}
                        {cities.map((city) => (
                            <div
                                key={city.name}
                                className="grid grid-cols-4 gap-2 py-2 text-sm hover:bg-muted/50 rounded transition-colors"
                            >
                                <div className="font-medium truncate">
                                    {city.name}
                                    <span className="text-muted-foreground text-xs ml-1">
                                        {city.state}
                                    </span>
                                </div>
                                <div className={`text-center font-semibold ${getConditionColor(city.temp)}`}>
                                    {city.temp.toFixed(0)}°C
                                </div>
                                <div className="text-center text-blue-600">
                                    {city.rain > 0 ? `${city.rain.toFixed(1)}mm` : '-'}
                                </div>
                                <div className="text-center text-slate-500">
                                    {city.wind.toFixed(0)}km/h
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground text-center mt-3 pt-2 border-t">
                    Principais polos agrícolas do Brasil
                </p>
            </CardContent>
        </Card>
    );
}
