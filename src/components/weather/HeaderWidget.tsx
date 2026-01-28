
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeather } from '@/contexts/WeatherContext';
import { fetchWeather, getWeatherDescription } from '@/lib/data-sources/weather';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sun, CloudSun, Cloud, AlignJustify, CloudDrizzle, CloudRain, Snowflake, CloudLightning, HelpCircle, Loader2 } from 'lucide-react';

// Mapa de Componentes de Ícones para renderização
const IconMap: Record<string, any> = {
    Sun, CloudSun, Cloud, AlignJustify, CloudDrizzle, CloudRain, Snowflake, CloudLightning, HelpCircle
};

export function HeaderWidget() {
    const { selectedCity } = useWeather();
    const router = useRouter();
    const [temp, setTemp] = useState<number | null>(null);
    const [conditionCode, setConditionCode] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            setLoading(true);
            try {
                // Widget usa uma requisição leve ou cacheada
                const weather = await fetchWeather(selectedCity.lat, selectedCity.lon);
                if (mounted && weather) {
                    setTemp(weather.current.temperature);
                    setConditionCode(weather.current.conditionCode);
                }
            } catch (err) {
                console.error('Widget error:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadData();

        // Atualizar cada 30 min
        const interval = setInterval(loadData, 30 * 60 * 1000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [selectedCity]);

    const weatherDesc = getWeatherDescription(conditionCode);
    const IconComponent = IconMap[weatherDesc.icon] || HelpCircle;

    // Cores personalizadas para "ilustração"
    const getIconColor = (iconName: string) => {
        if (iconName === 'Sun') return 'text-amber-600 fill-amber-500/20';
        if (iconName === 'CloudSun') return 'text-amber-500';
        if (iconName === 'Cloud') return 'text-slate-500 fill-slate-200/50';
        if (iconName.includes('Rain') || iconName.includes('Drizzle')) return 'text-blue-600';
        if (iconName.includes('Lightning')) return 'text-purple-600';
        return 'text-muted-foreground';
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 animate-pulse">
                <div className="h-4 w-4 rounded-full bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 h-auto rounded-full hover:bg-muted/50 transition-colors"
                        onClick={() => router.push('/clima')}
                    >
                        <div className="relative">
                            <IconComponent className={`h-5 w-5 ${getIconColor(weatherDesc.icon)}`} />
                        </div>
                        <div className="flex flex-col items-start ml-1 leading-none">
                            <span className="font-bold text-sm text-foreground">
                                {temp?.toFixed(0)}°C
                            </span>
                            <span className="text-[10px] text-muted-foreground max-w-[80px] truncate">
                                {selectedCity.name}
                            </span>
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="flex flex-col items-center gap-1 p-3">
                    <p className="font-medium text-sm">{weatherDesc.label}</p>
                    <p className="text-xs text-muted-foreground">Clique para previsão completa</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
