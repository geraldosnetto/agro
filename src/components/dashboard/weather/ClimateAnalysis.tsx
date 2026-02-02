'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeather } from '@/contexts/WeatherContext';
import {
    Brain,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Wheat,
    Beef,
    Coffee,
    Droplets,
    Sun,
    CloudRain,
    ThermometerSun,
    Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClimateAnalysisData {
    content: string;
    generatedAt: string;
    cached?: boolean;
}

interface ClimateAnalysisProps {
    className?: string;
}

// Parser simples de markdown para JSX
function MarkdownContent({ content }: { content: string }) {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Título H2
        if (line.startsWith('## ')) {
            const text = line.slice(3).trim();
            const Icon = getSectionIcon(text);
            elements.push(
                <div key={key++} className="flex items-center gap-2 mt-6 mb-3 first:mt-0">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{text}</h3>
                </div>
            );
            continue;
        }

        // Título H3
        if (line.startsWith('### ')) {
            elements.push(
                <h4 key={key++} className="text-base font-medium mt-4 mb-2 text-foreground">
                    {line.slice(4).trim()}
                </h4>
            );
            continue;
        }

        // Lista com ícones de alerta (⚠️)
        if (line.trim().startsWith('⚠️') || line.trim().startsWith('- ⚠️')) {
            const text = line.replace(/^[-\s]*⚠️\s*/, '').trim();
            elements.push(
                <div key={key++} className="flex items-start gap-2 p-3 my-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="text-sm" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
                </div>
            );
            continue;
        }

        // Lista com ícones de check (✅)
        if (line.trim().startsWith('✅') || line.trim().startsWith('- ✅')) {
            const text = line.replace(/^[-\s]*✅\s*/, '').trim();
            elements.push(
                <div key={key++} className="flex items-start gap-2 p-3 my-2 rounded-lg bg-primary/10 border border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
                </div>
            );
            continue;
        }

        // Lista normal
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const text = line.replace(/^[-*\s]+/, '').trim();
            elements.push(
                <div key={key++} className="flex items-start gap-2 py-1 pl-2">
                    <span className="text-primary text-lg leading-none">•</span>
                    <span className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
                </div>
            );
            continue;
        }

        // Linha divisória
        if (line.trim() === '---') {
            elements.push(<hr key={key++} className="my-4 border-border" />);
            continue;
        }

        // Parágrafo vazio
        if (line.trim() === '') {
            continue;
        }

        // Parágrafo normal
        elements.push(
            <p key={key++} className="text-sm text-muted-foreground my-2 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
            />
        );
    }

    return <div className="space-y-1">{elements}</div>;
}

// Formata markdown inline (negrito, itálico)
function formatInlineMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Ícone baseado no título da seção
function getSectionIcon(title: string) {
    const lower = title.toLowerCase();
    if (lower.includes('panorama') || lower.includes('geral')) return Sun;
    if (lower.includes('impacto') || lower.includes('cultura')) return Wheat;
    if (lower.includes('alerta') || lower.includes('risco')) return AlertTriangle;
    if (lower.includes('recomenda')) return CheckCircle2;
    if (lower.includes('perspectiva') || lower.includes('tendência')) return CloudRain;
    if (lower.includes('soja') || lower.includes('milho')) return Wheat;
    if (lower.includes('pecuária') || lower.includes('boi')) return Beef;
    if (lower.includes('café')) return Coffee;
    if (lower.includes('chuva') || lower.includes('precipitação')) return Droplets;
    if (lower.includes('temperatura')) return ThermometerSun;
    if (lower.includes('vento')) return Wind;
    return Brain;
}

export function ClimateAnalysis({ className }: ClimateAnalysisProps) {
    const { selectedCity } = useWeather();
    const [data, setData] = useState<ClimateAnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                lat: selectedCity.lat.toString(),
                lon: selectedCity.lon.toString(),
                cityName: `${selectedCity.name}, ${selectedCity.state}`,
            });

            const res = await fetch(`/api/ai/climate-analysis?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
            } else {
                throw new Error(json.error || 'Falha ao gerar análise');
            }
        } catch (err) {
            console.error('Error fetching climate analysis:', err);
            setError('Não foi possível gerar a análise climática');
        } finally {
            setLoading(false);
        }
    }, [selectedCity]);

    // Auto-fetch quando a cidade muda
    useEffect(() => {
        // Não busca automaticamente para não gastar tokens
        // fetchAnalysis();
    }, [selectedCity]);

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Análise Climática com IA
                    </CardTitle>
                    <CardDescription>
                        Impacto do clima nas culturas agrícolas
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {data?.cached && (
                        <Badge variant="secondary" className="text-xs">
                            Cache
                        </Badge>
                    )}
                    <Button
                        onClick={fetchAnalysis}
                        disabled={loading}
                        size="sm"
                        variant={data ? 'outline' : 'default'}
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Analisando...
                            </>
                        ) : data ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Atualizar
                            </>
                        ) : (
                            <>
                                <Brain className="h-4 w-4 mr-2" />
                                Gerar Análise
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {loading && !data && (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-20 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-20 bg-muted rounded" />
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={fetchAnalysis} variant="outline" size="sm">
                            Tentar Novamente
                        </Button>
                    </div>
                )}

                {!data && !loading && !error && (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg border border-dashed">
                        <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h4 className="font-medium mb-2">Análise Inteligente do Clima</h4>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md">
                            Clique em "Gerar Análise" para receber insights personalizados sobre como
                            as condições climáticas afetam as principais culturas agrícolas da região.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            <Badge variant="outline" className="text-xs">
                                <Wheat className="h-3 w-3 mr-1" />
                                Soja/Milho
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                <Beef className="h-3 w-3 mr-1" />
                                Pecuária
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                <Coffee className="h-3 w-3 mr-1" />
                                Café/Cana
                            </Badge>
                        </div>
                    </div>
                )}

                {data && !loading && (
                    <div className="space-y-2">
                        <MarkdownContent content={data.content} />

                        <div className="flex items-center justify-between pt-4 mt-4 border-t text-xs text-muted-foreground">
                            <span>
                                Gerado em: {new Date(data.generatedAt).toLocaleString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Brain className="h-3 w-3" />
                                Powered by Claude
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
