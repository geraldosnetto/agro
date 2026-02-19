
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeather } from '@/contexts/WeatherContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wind, Droplets, Thermometer, Calendar } from 'lucide-react';
import { type WeatherData, getWeatherDescription } from '@/lib/data-sources/weather';
import { ForecastChartWrapper as ForecastChart } from './ForecastChartWrapper';
import { CitySearch } from './CitySearch';
import { Button } from '@/components/ui/button';
import { analyzeWeatherConditions } from '@/lib/agro-analyzers';
import { AgroInsights } from './AgroInsights';
import { WeatherRadarMap } from './WeatherRadarMap';
import { CurrentWeatherHero } from './CurrentWeatherHero';
import { RainfallAccumulation } from './RainfallAccumulation';
import { RegionalComparison } from './RegionalComparison';
import { PrecipitationMap } from './PrecipitationMap';
import { ClimateAnalysis } from './ClimateAnalysis';

export function WeatherDashboard() {
    // Agora usa o Contexto Global em vez de estado local
    const { selectedCity, setCity } = useWeather();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWeatherData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/weather?lat=${selectedCity.lat}&lon=${selectedCity.lon}`);
            const data = await res.json();
            if (data.success) {
                setWeather(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar clima:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCity.lat, selectedCity.lon]);

    useEffect(() => {
        fetchWeatherData();
    }, [fetchWeatherData]);

    if (!weather && !loading) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Não foi possível carregar os dados do clima.</p>
                <Button onClick={fetchWeatherData} variant="outline" className="mt-4">Tentar Novamente</Button>
            </div>
        );
    }

    const currentCondition = weather ? getWeatherDescription(weather.current.conditionCode) : { label: '...', icon: '' };
    const insights = weather ? analyzeWeatherConditions(weather) : [];

    return (
        <div className="space-y-6">
            {/* Seletor de Cidade (Agora com Busca) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Previsão do Tempo</h2>
                    <p className="text-muted-foreground">Condições climáticas nas principais regiões produtoras.</p>
                </div>
                <div className="w-full sm:w-[320px]">
                    <CitySearch
                        value={selectedCity}
                        onSelect={setCity}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted rounded-xl" />
                    ))}
                    <div className="h-96 bg-muted rounded-xl col-span-full" />
                </div>
            ) : weather && (
                <>
                    {/* Hero Card - Temperatura Principal */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <CurrentWeatherHero
                            weather={weather}
                            cityName={`${selectedCity.name}, ${selectedCity.state}`}
                            className="lg:col-span-1"
                        />

                        {/* Cards Secundários */}
                        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                            <RainfallAccumulation weather={weather} />
                            <RegionalComparison />
                        </div>
                    </div>

                    {/* Insights Inteligentes (Pulverização, Doenças, Geada, Seca, etc) */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">🧠 Inteligência Agronômica</h3>
                        <AgroInsights insights={insights} />
                    </div>

                    {/* Gráfico de Previsão */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Previsão 7 Dias</CardTitle>
                            <CardDescription>
                                Temperatura máxima, mínima e volume de chuvas para {selectedCity.name} - {selectedCity.state}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ForecastChart data={weather.daily} />
                        </CardContent>
                    </Card>

                    {/* Mapa de Precipitação + Análise IA */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <PrecipitationMap />
                        <ClimateAnalysis />
                    </div>

                    {/* Radar Meteorológico */}
                    <WeatherRadarMap />

                    <p className="text-center text-xs text-muted-foreground opacity-50">
                        Dados fornecidos por OpenMeteo.com, RainViewer.com e Claude AI
                    </p>
                </>
            )}
        </div>
    );
}
