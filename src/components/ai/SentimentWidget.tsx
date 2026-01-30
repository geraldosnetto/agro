'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SentimentBadge, SentimentSummary } from './SentimentBadge';
import { Brain, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentData {
  url: string;
  title: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  impact: number;
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
}

interface SentimentWidgetProps {
  commoditySlug: string;
  commodityName: string;
  className?: string;
}

export function SentimentWidget({ commoditySlug, commodityName, className }: SentimentWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [sentiments, setSentiments] = useState<SentimentData[]>([]);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            Sentimento do Mercado
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSentiment}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SentimentSummary aggregate={aggregate} />

        {/* Últimas notícias analisadas */}
        {sentiments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Notícias Recentes</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sentiments.slice(0, 5).map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <SentimentBadge sentiment={item.sentiment} size="sm" />
                  <span className="text-sm flex-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Análise por IA baseada em notícias recentes
        </p>
      </CardContent>
    </Card>
  );
}
