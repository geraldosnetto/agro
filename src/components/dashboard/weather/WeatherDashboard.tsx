
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wind, Droplets, Thermometer, Calendar } from 'lucide-react';
import { AGRICULTURAL_CITIES, type City, type WeatherData, getWeatherDescription } from '@/lib/data-sources/weather';
import { ForecastChart } from './ForecastChart';
import { Button } from '@/components/ui/button';

export function WeatherDashboard() {
    const [selectedCity, setSelectedCity] = useState<City>(AGRICULTURAL_CITIES[0]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWeatherData = async (city: City) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}`);
            const data = await res.json();
            if (data.success) {
                setWeather(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar clima:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeatherData(selectedCity);
    }, [selectedCity]);

    if (!weather && !loading) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Não foi possível carregar os dados do clima.</p>
                <Button onClick={() => fetchWeatherData(selectedCity)} variant="outline" className="mt-4">Tentar Novamente</Button>
            </div>
        );
    }

    const currentCondition = weather ? getWeatherDescription(weather.current.conditionCode) : { label: '...', icon: '' };

    return (
        <div className="space-y-6">
            {/* Seletor de Cidade */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Previsão do Tempo</h2>
                    <p className="text-muted-foreground">Condições climáticas nas principais regiões produtoras.</p>
                </div>
                <div className="w-[280px]">
                    <Select
                        value={selectedCity.id}
                        onValueChange={(val) => {
                            const city = AGRICULTURAL_CITIES.find(c => c.id === val);
                            if (city) setSelectedCity(city);
                        }}
                    >
                        <SelectTrigger>
                            <MapPin className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Selecione uma região" />
                        </SelectTrigger>
                        <SelectContent>
                            {AGRICULTURAL_CITIES.map(city => (
                                <SelectItem key={city.id} value={city.id}>
                                    {city.name} - {city.state}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    {/* Cards de Condição Atual */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
                                <Thermometer className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{weather.current.temperature}°C</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentCondition.label}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Umidade</CardTitle>
                                <Droplets className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{weather.current.humidity}%</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Relativa do ar
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Vento</CardTitle>
                                <Wind className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{weather.current.windSpeed} km/h</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Velocidade média
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Chuva Hoje</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {weather.daily.precipitationSum[0]} mm
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Probabilidade: {weather.daily.precipitationProb[0]}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráfico de Previsão */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Previsão 7 Dias</CardTitle>
                            <CardDescription>
                                Temperatura máxima, mínima e volume de chuvas para {selectedCity.name}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ForecastChart data={weather.daily} />
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-muted-foreground opacity-50">
                        Dados fornecidos por OpenMeteo.com
                    </p>
                </>
            )}
        </div>
    );
}
