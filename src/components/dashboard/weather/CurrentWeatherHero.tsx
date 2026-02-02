'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherData, getWeatherDescription } from '@/lib/data-sources/weather';
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, Wind, Droplets, Thermometer, ArrowDown, ArrowUp } from 'lucide-react';

interface CurrentWeatherHeroProps {
    weather: WeatherData;
    cityName: string;
    className?: string;
}

export function CurrentWeatherHero({ weather, cityName, className }: CurrentWeatherHeroProps) {
    const { current, daily } = weather;
    const conditionDescription = getWeatherDescription(current.conditionCode);

    // Ícone baseado na descrição do tempo
    const getWeatherIcon = () => {
        const desc = conditionDescription.label.toLowerCase();
        const iconClass = "h-12 w-12 text-primary";

        if (desc.includes('chuva') || desc.includes('rain')) {
            return <CloudRain className={iconClass} />;
        }
        if (desc.includes('neve') || desc.includes('snow')) {
            return <CloudSnow className={iconClass} />;
        }
        if (desc.includes('nublado') || desc.includes('cloud') || desc.includes('encoberto')) {
            return <Cloud className={iconClass} />;
        }
        if (desc.includes('parcialmente') || desc.includes('partly')) {
            return <CloudSun className={iconClass} />;
        }
        return <Sun className={`${iconClass} text-yellow-500`} />;
    };

    // Cor da temperatura baseado no valor
    const getTempColor = (temp: number) => {
        if (temp >= 35) return 'text-red-500';
        if (temp >= 30) return 'text-orange-500';
        if (temp >= 20) return 'text-green-600';
        if (temp >= 10) return 'text-blue-500';
        return 'text-cyan-500';
    };

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{cityName}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                            {conditionDescription.label}
                        </p>
                    </div>
                    {getWeatherIcon()}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Temperatura principal */}
                <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${getTempColor(current.temperature)}`}>
                        {current.temperature.toFixed(0)}
                    </span>
                    <span className="text-2xl text-muted-foreground">°C</span>
                </div>

                {/* Min/Max */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1 text-blue-500">
                        <ArrowDown className="h-4 w-4" />
                        <span className="font-medium">{daily.tempMin[0].toFixed(0)}°</span>
                        <span className="text-muted-foreground">mín</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                        <ArrowUp className="h-4 w-4" />
                        <span className="font-medium">{daily.tempMax[0].toFixed(0)}°</span>
                        <span className="text-muted-foreground">máx</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <Droplets className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{current.humidity}%</p>
                        <p className="text-xs text-muted-foreground">Umidade</p>
                    </div>
                    <div className="text-center">
                        <Wind className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{current.windSpeed}</p>
                        <p className="text-xs text-muted-foreground">km/h</p>
                    </div>
                    <div className="text-center">
                        <CloudRain className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{daily.precipitationProb[0]}%</p>
                        <p className="text-xs text-muted-foreground">Chuva</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
