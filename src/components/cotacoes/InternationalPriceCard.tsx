'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Globe,
    RefreshCw,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface InternationalPrice {
    slug: string;
    ticker: string;
    name: string;
    exchange: string;
    price: number;
    currency: string;
    change: number;
    changePercent: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    lastUpdated: string;
}

interface InternationalPriceCardProps {
    slug: string;
    cepeaPrice?: number;
    cepeaUnit?: string;
    className?: string;
}

export function InternationalPriceCard({
    slug,
    cepeaPrice,
    cepeaUnit,
    className = '',
}: InternationalPriceCardProps) {
    const [price, setPrice] = useState<InternationalPrice | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPrice = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/cotacoes/internacional?slug=${slug}`);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    setError('not-available');
                } else {
                    setError(data.error || 'Erro ao carregar');
                }
                return;
            }

            setPrice(data.price);
        } catch {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    // Não mostrar card se commodity não tem preço internacional
    if (error === 'not-available') {
        return null;
    }

    const formatPrice = (value: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-500';
        if (change < 0) return 'text-red-500';
        return 'text-muted-foreground';
    };

    const getExchangeColor = (exchange: string) => {
        switch (exchange) {
            case 'CBOT':
                return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
            case 'CME':
                return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
            case 'ICE':
                return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30';
            default:
                return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
        }
    };

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-medium">Cotação Internacional</CardTitle>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={fetchPrice}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Atualizar cotação</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {loading && (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                )}

                {error && error !== 'not-available' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                {price && !loading && !error && (
                    <>
                        {/* Exchange Badge */}
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getExchangeColor(price.exchange)}>
                                {price.exchange}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{price.ticker}</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">
                                {formatPrice(price.price, price.currency)}
                            </span>
                            <div className={`flex items-center gap-1 text-sm ${getChangeColor(price.change)}`}>
                                {getChangeIcon(price.change)}
                                <span>
                                    {price.change >= 0 ? '+' : ''}
                                    {price.change.toFixed(2)} ({price.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-muted-foreground">Abertura:</span>{' '}
                                <span className="font-medium">{formatPrice(price.open, price.currency)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Fech. Anterior:</span>{' '}
                                <span className="font-medium">{formatPrice(price.previousClose, price.currency)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Mín. Dia:</span>{' '}
                                <span className="font-medium">{formatPrice(price.dayLow, price.currency)}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Máx. Dia:</span>{' '}
                                <span className="font-medium">{formatPrice(price.dayHigh, price.currency)}</span>
                            </div>
                        </div>

                        {/* Volume */}
                        <div className="text-xs text-muted-foreground">
                            Volume: {formatNumber(price.volume)} contratos
                        </div>

                        {/* CEPEA Comparison */}
                        {cepeaPrice && (
                            <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-1">
                                    Comparação com CEPEA
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>
                                        Brasil: R$ {cepeaPrice.toFixed(2)}/{cepeaUnit}
                                    </span>
                                    <a
                                        href={`https://finance.yahoo.com/quote/${price.ticker}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        Ver no Yahoo <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="text-[10px] text-muted-foreground/70 pt-1">
                            Dados com delay de 15-20 min. Atualizado:{' '}
                            {new Date(price.lastUpdated).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
