'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CloudRain, RefreshCw, Calendar, Play, Pause } from 'lucide-react';
import { type PrecipitationForecast, getPrecipitationColor, getPrecipitationDescription } from '@/lib/data-sources/precipitation';

const geoUrl = '/brazil-states.json';

interface PrecipitationMapContentProps {
    className?: string;
}

// Legenda de cores
const LEGEND_ITEMS = [
    { color: '#f5f5dc', label: '0-1 mm' },
    { color: '#90EE90', label: '1-10 mm' },
    { color: '#32CD32', label: '10-30 mm' },
    { color: '#FFD700', label: '30-50 mm' },
    { color: '#FFA500', label: '50-70 mm' },
    { color: '#FF4500', label: '70-100 mm' },
    { color: '#FF0000', label: '100-150 mm' },
    { color: '#800080', label: '200+ mm' },
];

export function PrecipitationMapContent({ className }: PrecipitationMapContentProps) {
    const [data, setData] = useState<PrecipitationForecast | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState(0); // 0 = acumulado 7 dias, 1-7 = dia específico
    const [isPlaying, setIsPlaying] = useState(false);
    const [viewMode, setViewMode] = useState<'accumulated' | 'daily'>('accumulated');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/weather/precipitation');
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                throw new Error(json.error || 'Failed to fetch');
            }
        } catch (err) {
            console.error('Error fetching precipitation:', err);
            setError('Não foi possível carregar os dados de precipitação');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Animação automática
    useEffect(() => {
        if (!isPlaying || viewMode !== 'daily' || !data) return;

        const interval = setInterval(() => {
            setSelectedDay((prev) => (prev >= 6 ? 0 : prev + 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, viewMode, data]);

    // Obtém o valor de precipitação para um estado em um dia específico
    const getPrecipitationValue = useCallback((uf: string): number => {
        if (!data) return 0;
        const region = data.regions.find(r => r.uf === uf);
        if (!region) return 0;

        if (viewMode === 'accumulated') {
            return region.accumulated7Days;
        } else {
            return region.daily.precipitation[selectedDay] || 0;
        }
    }, [data, viewMode, selectedDay]);

    // Formata a data para exibição
    const formatDate = (index: number): string => {
        if (!data || !data.regions[0]) return '';
        const dateStr = data.regions[0].daily.time[index];
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-blue-500" />
                        Mapa de Precipitação
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] bg-muted animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-blue-500" />
                        Mapa de Precipitação
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] flex items-center justify-center bg-muted/50 rounded-lg">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <Button onClick={fetchData} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Tentar Novamente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-blue-500" />
                        Mapa de Precipitação
                    </CardTitle>
                    <CardDescription>
                        {viewMode === 'accumulated'
                            ? 'Previsão de chuva acumulada nos próximos 7 dias'
                            : `Previsão para ${formatDate(selectedDay)}`
                        }
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'accumulated' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setViewMode('accumulated'); setIsPlaying(false); }}
                    >
                        7 dias
                    </Button>
                    <Button
                        variant={viewMode === 'daily' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('daily')}
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        Por dia
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                <div className="relative">
                    {/* Mapa */}
                    <div className="h-[500px] bg-card rounded-xl border overflow-hidden">
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{
                                scale: 750,
                                center: [-54, -15]
                            }}
                            className="w-full h-full"
                        >
                            <ZoomableGroup>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
                                            const uf = geo.properties.sigla || geo.properties.name;
                                            const value = getPrecipitationValue(uf);
                                            const color = getPrecipitationColor(value);
                                            const regionData = data?.regions.find(r => r.uf === uf);

                                            return (
                                                <TooltipProvider key={geo.rsmKey}>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Geography
                                                                geography={geo}
                                                                fill={color}
                                                                stroke="#ffffff"
                                                                strokeWidth={0.5}
                                                                style={{
                                                                    default: { outline: 'none' },
                                                                    hover: { fill: '#60a5fa', outline: 'none', cursor: 'pointer' },
                                                                    pressed: { outline: 'none' },
                                                                }}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="p-3">
                                                            <div className="font-bold text-lg">{geo.properties.name}</div>
                                                            {regionData ? (
                                                                <>
                                                                    <div className="text-2xl font-bold my-1 text-blue-600">
                                                                        {value.toFixed(1)} mm
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {getPrecipitationDescription(value)}
                                                                    </div>
                                                                    {viewMode === 'accumulated' && (
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            Ref: {regionData.name}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="text-sm text-muted-foreground">Sem dados</div>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })
                                    }
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                    </div>

                    {/* Legenda */}
                    <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-lg border text-xs shadow-sm backdrop-blur z-10">
                        <div className="font-medium mb-2">Precipitação (mm)</div>
                        <div className="grid grid-cols-2 gap-1">
                            {LEGEND_ITEMS.map((item) => (
                                <div key={item.label} className="flex items-center gap-1">
                                    <div
                                        className="w-3 h-3 rounded-sm border border-gray-300"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sumário */}
                    {data && viewMode === 'accumulated' && (
                        <div className="absolute top-4 right-4 bg-background/90 p-3 rounded-lg border text-xs shadow-sm backdrop-blur z-10">
                            <div className="font-medium mb-2">Resumo 7 dias</div>
                            <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Maior acúmulo:</span>
                                    <span className="font-medium text-blue-600">
                                        {data.summary.highestAccumulation.uf} ({data.summary.highestAccumulation.value}mm)
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Menor acúmulo:</span>
                                    <span className="font-medium text-orange-600">
                                        {data.summary.lowestAccumulation.uf} ({data.summary.lowestAccumulation.value}mm)
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Média nacional:</span>
                                    <span className="font-medium">{data.summary.nationalAverage}mm</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controles de timeline (modo diário) */}
                {viewMode === 'daily' && data && (
                    <div className="mt-4 bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-3">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <div className="flex-1">
                                <Slider
                                    value={[selectedDay]}
                                    onValueChange={(value) => {
                                        setSelectedDay(value[0]);
                                        setIsPlaying(false);
                                    }}
                                    max={6}
                                    step={1}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <button
                                    key={i}
                                    onClick={() => { setSelectedDay(i); setIsPlaying(false); }}
                                    className={`px-2 py-1 rounded transition-colors ${
                                        i === selectedDay ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                    }`}
                                >
                                    {formatDate(i)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground mt-4">
                    Dados: Open-Meteo.com | Atualizado: {data ? new Date(data.generatedAt).toLocaleString('pt-BR') : '-'}
                </p>
            </CardContent>
        </Card>
    );
}

export default memo(PrecipitationMapContent);
