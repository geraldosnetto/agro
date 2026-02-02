'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useWeather } from '@/contexts/WeatherContext';
import { Map, Play, Pause, RefreshCw, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Coordenadas centrais do Brasil
const BRAZIL_CENTER: [number, number] = [-15.77, -47.92];
const DEFAULT_ZOOM = 4;
const CITY_ZOOM = 7;

interface RainViewerFrame {
    time: number;
    path: string;
}

interface WeatherRadarMapContentProps {
    className?: string;
}

// Legenda de intensidade do RainViewer
const RADAR_LEGEND = [
    { color: '#00000000', label: 'Sem chuva' },
    { color: '#88c8f7', label: 'Fraca' },
    { color: '#3399ff', label: 'Leve' },
    { color: '#00cc00', label: 'Moderada' },
    { color: '#ffff00', label: 'Forte' },
    { color: '#ff9900', label: 'Muito forte' },
    { color: '#ff0000', label: 'Intensa' },
    { color: '#cc00cc', label: 'Extrema' },
];

// Componente para centralizar o mapa
function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);

    return null;
}

// Componente interno para controlar a camada de radar
function RadarLayer({ framePath }: { framePath: string | null }) {
    const map = useMap();
    const layerRef = useRef<L.TileLayer | null>(null);

    useEffect(() => {
        if (!framePath) return;

        // Remove a camada anterior
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
        }

        // Adiciona nova camada
        const newLayer = L.tileLayer(
            `https://tilecache.rainviewer.com${framePath}/256/{z}/{x}/{y}/2/1_1.png`,
            {
                opacity: 0.7,
                attribution: '&copy; <a href="https://rainviewer.com/">RainViewer</a>',
            }
        );

        newLayer.addTo(map);
        layerRef.current = newLayer;

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
            }
        };
    }, [framePath, map]);

    return null;
}

// Formata timestamp para exibição com data quando necessário
function formatFrameTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (isToday) {
        return `Hoje ${time}`;
    } else if (isYesterday) {
        return `Ontem ${time}`;
    } else {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        }) + ` ${time}`;
    }
}

export function WeatherRadarMapContent({ className }: WeatherRadarMapContentProps) {
    const { selectedCity } = useWeather();
    const [frames, setFrames] = useState<RainViewerFrame[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCenteredOnCity, setIsCenteredOnCity] = useState(false);

    // Centro do mapa: cidade selecionada ou Brasil
    const mapCenter: [number, number] = isCenteredOnCity
        ? [selectedCity.lat, selectedCity.lon]
        : BRAZIL_CENTER;
    const mapZoom = isCenteredOnCity ? CITY_ZOOM : DEFAULT_ZOOM;

    // Buscar frames do RainViewer
    const fetchRadarData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await res.json();

            // Combinar frames passados + nowcast (previsão)
            const radarFrames = [
                ...data.radar.past.map((f: { time: number; path: string }) => ({
                    time: f.time,
                    path: f.path,
                })),
                ...data.radar.nowcast.map((f: { time: number; path: string }) => ({
                    time: f.time,
                    path: f.path,
                })),
            ];

            setFrames(radarFrames);
            setCurrentFrame(data.radar.past.length - 1); // Último frame real
        } catch (err) {
            console.error('Erro ao buscar dados RainViewer:', err);
            setError('Não foi possível carregar o radar');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRadarData();
    }, [fetchRadarData]);

    // Animação
    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;

        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % frames.length);
        }, 500);

        return () => clearInterval(interval);
    }, [isPlaying, frames.length]);

    const currentFrameData = frames[currentFrame];
    const frameTime = currentFrameData
        ? formatFrameTime(currentFrameData.time)
        : '--:--';

    // Determina se o frame atual é passado, presente ou futuro
    const nowIndex = frames.findIndex((f, i, arr) => {
        const next = arr[i + 1];
        if (!next) return true;
        const now = Date.now() / 1000;
        return f.time <= now && next.time > now;
    });
    const frameType = currentFrame < nowIndex ? 'past' : currentFrame === nowIndex ? 'now' : 'forecast';

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Radar de Chuva
                </CardTitle>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        frameType === 'past' ? 'bg-muted text-muted-foreground' :
                        frameType === 'now' ? 'bg-primary/20 text-primary' :
                        'bg-blue-500/20 text-blue-600'
                    }`}>
                        {frameTime}
                        {frameType === 'forecast' && ' (prev.)'}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={loading || frames.length === 0}
                        title={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant={isCenteredOnCity ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsCenteredOnCity(!isCenteredOnCity)}
                        title={isCenteredOnCity ? 'Ver Brasil' : `Focar em ${selectedCity.name}`}
                    >
                        <Crosshair className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchRadarData}
                        disabled={loading}
                        title="Atualizar"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">{error}</p>
                    </div>
                ) : (
                    <div className="h-[400px] rounded-lg overflow-hidden border relative">
                        <MapContainer
                            center={BRAZIL_CENTER}
                            zoom={DEFAULT_ZOOM}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            {/* Mapa base escuro - CartoDB Dark Matter */}
                            <TileLayer
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />

                            {/* Controlador de centro */}
                            <MapCenterController center={mapCenter} zoom={mapZoom} />

                            {/* Radar Layer - atualizado via ref para evitar flicker */}
                            <RadarLayer framePath={currentFrameData?.path || null} />
                        </MapContainer>

                        {/* Legenda de intensidade */}
                        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 z-[1000] text-xs">
                            <div className="font-medium mb-1 text-center">Intensidade</div>
                            <div className="space-y-0.5">
                                {RADAR_LEGEND.slice(1).map((item) => (
                                    <div key={item.label} className="flex items-center gap-1.5">
                                        <div
                                            className="w-3 h-3 rounded-sm border border-white/20"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-muted-foreground">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline slider */}
                        {frames.length > 0 && (
                            <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 z-[1000]">
                                <Slider
                                    value={[currentFrame]}
                                    onValueChange={(value) => {
                                        setIsPlaying(false);
                                        setCurrentFrame(value[0]);
                                    }}
                                    max={frames.length - 1}
                                    step={1}
                                    className="cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>Passado</span>
                                    <span className="text-primary font-medium">Agora</span>
                                    <span className="text-blue-500">Previsão</span>
                                </div>
                            </div>
                        )}

                        {/* Indicador de cidade (quando focado) */}
                        {isCenteredOnCity && (
                            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 z-[1000] text-sm font-medium">
                                {selectedCity.name}, {selectedCity.state}
                            </div>
                        )}
                    </div>
                )}
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Radar de precipitação em tempo real | Dados: RainViewer.com | Atualizado a cada 10 min
                </p>
            </CardContent>
        </Card>
    );
}
