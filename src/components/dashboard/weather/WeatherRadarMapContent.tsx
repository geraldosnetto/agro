'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Play, Pause, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Coordenadas centrais do Brasil
const BRAZIL_CENTER: [number, number] = [-15.77, -47.92];
const DEFAULT_ZOOM = 4;

interface RainViewerFrame {
    time: number;
    path: string;
}

interface WeatherRadarMapContentProps {
    className?: string;
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
                opacity: 0.6,
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

export function WeatherRadarMapContent({ className }: WeatherRadarMapContentProps) {
    const [frames, setFrames] = useState<RainViewerFrame[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        ? new Date(currentFrameData.time * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        : '--:--';

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Radar de Chuva
                </CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{frameTime}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={loading || frames.length === 0}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={fetchRadarData}
                        disabled={loading}
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
                            {/* Base Map - OpenStreetMap (estável, não re-renderiza) */}
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Radar Layer - atualizado via ref para evitar flicker */}
                            <RadarLayer framePath={currentFrameData?.path || null} />
                        </MapContainer>

                        {/* Timeline slider */}
                        {frames.length > 0 && (
                            <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 z-[1000]">
                                <input
                                    type="range"
                                    min={0}
                                    max={frames.length - 1}
                                    value={currentFrame}
                                    onChange={(e) => {
                                        setIsPlaying(false);
                                        setCurrentFrame(Number(e.target.value));
                                    }}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Passado</span>
                                    <span>Agora</span>
                                    <span>Previsão</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Radar de precipitação | Dados: RainViewer.com | Atualizado a cada 10 min
                </p>
            </CardContent>
        </Card>
    );
}
