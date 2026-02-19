'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
}

interface Prediction {
  commoditySlug: string;
  commodityName: string;
  unit: string;
  currentPrice: number;
  predictedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
  confidence: number;
  horizon: number;
  targetDate: string;
  factors: PredictionFactor[];
  bounds: {
    lower: number;
    upper: number;
  };
  models: {
    sma: number;
    ema: number;
    linearRegression: number;
    arima: number;
    holtWinters: number;
    ensemble: number;
  };
  generatedAt: string;
  dataPointsUsed: number;
}

interface PredictionCardProps {
  slug: string;
  className?: string;
}

export function PredictionCard({ slug, className = '' }: PredictionCardProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<'7' | '14' | '30' | '60' | '90'>('7');
  const [showDetails, setShowDetails] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const loadPrediction = useCallback(async (selectedHorizon: string = horizon) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/predictions/${slug}?horizon=${selectedHorizon}`, {
        signal: controller.signal
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar previsão');
      }

      setPrediction(data.prediction);
      setRemaining(data.usage?.remaining ?? null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      // Only clear loading if this is the current request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [horizon, slug]);

  // Load on mount
  useEffect(() => {
    loadPrediction();
  }, [loadPrediction]);

  const handleHorizonChange = (newHorizon: '7' | '14' | '30' | '60' | '90') => {
    setHorizon(newHorizon);
    loadPrediction(newHorizon);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getDirectionIcon = (direction: 'UP' | 'DOWN' | 'STABLE') => {
    switch (direction) {
      case 'UP':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'DOWN':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (direction: 'UP' | 'DOWN' | 'STABLE') => {
    switch (direction) {
      case 'UP':
        return 'text-green-500';
      case 'DOWN':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500/10 text-green-600 border-green-500/30';
    if (confidence >= 50) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    return 'bg-red-500/10 text-red-600 border-red-500/30';
  };

  const getImpactBadge = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Alta</Badge>;
      case 'negative':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">Neutro</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Previsão de Preço</CardTitle>
          </div>
          {remaining !== null && remaining !== Infinity && (
            <Badge variant="secondary" className="text-xs">
              {remaining} restantes
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Modelo ensemble com 5 algoritmos: SMA, EMA, Regressão Linear, ARIMA e Holt-Winters
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Horizon Selector */}
        <Tabs value={horizon} onValueChange={(v) => handleHorizonChange(v as '7' | '14' | '30' | '60' | '90')}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="7" disabled={isLoading} className="text-xs">7d</TabsTrigger>
            <TabsTrigger value="14" disabled={isLoading} className="text-xs">14d</TabsTrigger>
            <TabsTrigger value="30" disabled={isLoading} className="text-xs">30d</TabsTrigger>
            <TabsTrigger value="60" disabled={isLoading} className="text-xs">60d</TabsTrigger>
            <TabsTrigger value="90" disabled={isLoading} className="text-xs">90d</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Calculando previsão...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-destructive/10 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-medium">Erro na previsão</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => loadPrediction()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Result */}
        {prediction && !isLoading && !error && (
          <>
            {/* Main Prediction */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  Preço em {formatDate(prediction.targetDate)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className={getConfidenceColor(prediction.confidence)}
                      >
                        {prediction.confidence}% confiança
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Baseado na concordância entre modelos e volatilidade histórica
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-3">
                {getDirectionIcon(prediction.direction)}
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(prediction.predictedPrice)}
                  </p>
                  <p className={`text-sm font-medium ${getDirectionColor(prediction.direction)}`}>
                    {prediction.priceChange >= 0 ? '+' : ''}
                    {formatCurrency(prediction.priceChange)} ({prediction.priceChangePercent >= 0 ? '+' : ''}
                    {prediction.priceChangePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              {/* Price Range */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Intervalo esperado (95%)</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-500">{formatCurrency(prediction.bounds.lower)}</span>
                  <div className="flex-1 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                  <span className="text-green-500">{formatCurrency(prediction.bounds.upper)}</span>
                </div>
              </div>
            </div>

            {/* Current Price Reference */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Preço atual</span>
              <span className="font-medium">{formatCurrency(prediction.currentPrice)}</span>
            </div>

            {/* Details Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span className="text-xs text-muted-foreground">
                {showDetails ? 'Ocultar detalhes' : 'Ver detalhes do modelo'}
              </span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Expanded Details */}
            {showDetails && (
              <div className="space-y-4 pt-2 border-t">
                {/* Factors */}
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Fatores considerados
                  </p>
                  <div className="space-y-2">
                    {prediction.factors.map((factor, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{factor.name}</span>
                        {getImpactBadge(factor.impact)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Predictions */}
                <div>
                  <p className="text-xs font-medium mb-2">Previsão por modelo</p>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <p className="text-muted-foreground">SMA</p>
                      <p className="font-medium">{formatCurrency(prediction.models.sma)}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <p className="text-muted-foreground">EMA</p>
                      <p className="font-medium">{formatCurrency(prediction.models.ema)}</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <p className="text-muted-foreground">Regressão</p>
                      <p className="font-medium">{formatCurrency(prediction.models.linearRegression)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-primary/5 rounded p-2 text-center border border-primary/20">
                      <p className="text-primary font-medium">ARIMA</p>
                      <p className="font-medium">{formatCurrency(prediction.models.arima)}</p>
                    </div>
                    <div className="bg-primary/5 rounded p-2 text-center border border-primary/20">
                      <p className="text-primary font-medium">Holt-Winters</p>
                      <p className="font-medium">{formatCurrency(prediction.models.holtWinters)}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{prediction.dataPointsUsed} dias de dados</span>
                  <span>
                    Atualizado{' '}
                    {new Date(prediction.generatedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Previsão estatística baseada em dados históricos. Não é recomendação de investimento.
                  Consulte um especialista antes de tomar decisões financeiras.
                </span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
