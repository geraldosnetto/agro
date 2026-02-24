'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SentimentBadge, SentimentSummary } from './SentimentBadge';
import { SentimentGaugeWrapper as SentimentGauge } from './SentimentGaugeWrapper';
import { EmotionIndicator, EmotionBadge } from './EmotionIndicator';
import { MarketDrivers, DriverStats } from './MarketDrivers';
import { getTimeframeLabel, type Emotion, type MarketDriver } from '@/lib/ai/prompts/sentiment';
import { Brain, RefreshCw, ExternalLink, Clock, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SentimentData {
  url: string;
  title: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  impact: number;
  emotion?: Emotion;
  emotionIntensity?: number;
  drivers?: MarketDriver[];
  timeframe?: string;
  reasoning?: string;
  analyzedAt: string;
}

interface AggregateData {
  averageScore: number;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  totalAnalyzed: number;
  predominantEmotion?: Emotion;
  topDrivers?: MarketDriver[];
}

interface SentimentWidgetProps {
  commoditySlug: string;
  commodityName: string;
  className?: string;
}

export function SentimentWidget({ commoditySlug, commodityName, className }: SentimentWidgetProps) {
  const { data: session } = useSession();
  const isFreePlan = !session || session?.user?.plan === 'free';
  const [loading, setLoading] = useState(true);
  const [sentiments, setSentiments] = useState<SentimentData[]>([]);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchSentiment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai/sentiment?commodity=${commoditySlug}&limit=10`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao buscar sentimento');
      }

      setSentiments(data.sentiments || []);
      setAggregate(data.aggregate);
    } catch (err) {
      console.error('Erro ao buscar sentimento:', err);
      setError('Não foi possível carregar a análise');
    } finally {
      setLoading(false);
    }
  }, [commoditySlug]);

  useEffect(() => {
    fetchSentiment();
  }, [fetchSentiment]);

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Análise de Sentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !aggregate) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Análise de Sentimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {error || `Nenhuma análise disponível para ${commodityName}`}
          </p>
          <Button variant="outline" size="sm" className="w-full" onClick={fetchSentiment}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Sentimento do Mercado
            {isFreePlan && <Lock className="h-4 w-4 ml-2 text-muted-foreground" />}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSentiment}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center pb-4 border-b gap-4">
          {aggregate ? (
            <>
              <SentimentGauge score={aggregate.averageScore} size={280} />
              <div className="w-full px-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Distribuição (Comparativo):</p>
                <SentimentSummary aggregate={aggregate} />
              </div>
            </>
          ) : (
            <SentimentSummary aggregate={aggregate} />
          )}
        </div>

        <div className="relative">
          <div className={cn("space-y-4 transition-all duration-300", isFreePlan && "blur-sm opacity-50 select-none pointer-events-none")}>
            {/* Emoção predominante */}
            {aggregate.predominantEmotion && (
              <div className="p-3 rounded-lg bg-muted/30 border">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Emoção Predominante
                </h4>
                <EmotionIndicator
                  emotion={aggregate.predominantEmotion}
                  intensity={0.7}
                  size="md"
                />
              </div>
            )}

            {/* Drivers principais */}
            {aggregate.topDrivers && aggregate.topDrivers.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Fatores de Mercado
                </h4>
                <MarketDrivers drivers={aggregate.topDrivers as MarketDriver[]} />
              </div>
            )}

            {/* Últimas notícias analisadas */}
            {sentiments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Notícias Recentes
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Mais
                      </>
                    )}
                  </Button>
                </div>
                <div className={cn(
                  'space-y-2 overflow-hidden transition-all',
                  expanded ? 'max-h-96' : 'max-h-48'
                )}>
                  {sentiments.slice(0, expanded ? 10 : 3).map((item) => (
                    <NewsItem key={item.url} item={item} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2 border-t mt-4">
              Análise por IA baseada em {aggregate.totalAnalyzed} notícias recentes
            </p>
          </div>

          {isFreePlan && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-card via-card/60 to-transparent backdrop-blur-[1px]">
              <div className="bg-card/90 backdrop-blur-xl border border-border/50 p-5 rounded-xl shadow-xl text-center w-full max-w-sm space-y-3 transform translate-y-2">
                <Lock className="h-6 w-6 text-primary mx-auto mb-1" />
                <h4 className="font-semibold text-sm">IA Avançada</h4>
                <p className="text-xs text-muted-foreground">
                  Assine o plano <strong>Pro</strong> para ver as emoções predominantes, os principais motivadores do mercado e detalhes das notícias consolidadas.
                </p>
                <Link href="/planos" className="block w-full">
                  <Button size="sm" className="w-full text-xs">
                    Fazer Upgrade para Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para item de notícia com informações avançadas
function NewsItem({ item }: { item: SentimentData }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-md border bg-background/50 overflow-hidden">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 p-2 hover:bg-muted/50 transition-colors group"
      >
        <SentimentBadge sentiment={item.sentiment} size="sm" />
        <span className="text-sm flex-1 line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </span>
        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0 mt-1" />
      </a>

      {/* Detalhes expandidos */}
      {(item.emotion || (item.drivers && item.drivers.length > 0)) && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowDetails(!showDetails);
            }}
            className="w-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted/30 flex items-center justify-center gap-1 border-t"
          >
            {showDetails ? 'Menos detalhes' : 'Mais detalhes'}
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showDetails && (
            <div className="p-2 pt-0 space-y-2 border-t">
              <div className="flex flex-wrap items-center gap-2">
                {item.emotion && (
                  <EmotionBadge emotion={item.emotion} />
                )}
                {item.timeframe && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {getTimeframeLabel(item.timeframe as 'IMEDIATO' | 'CURTO_PRAZO' | 'MEDIO_PRAZO' | 'LONGO_PRAZO')}
                  </Badge>
                )}
              </div>
              {item.drivers && item.drivers.length > 0 && (
                <MarketDrivers drivers={item.drivers} showLabels={false} />
              )}
              {item.reasoning && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{item.reasoning}&rdquo;
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
