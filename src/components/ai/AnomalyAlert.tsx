'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AnomalyType = 'PRICE_SPIKE' | 'PRICE_DROP' | 'HIGH_VOLATILITY' | 'HISTORICAL_HIGH' | 'HISTORICAL_LOW';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

interface Anomaly {
  id: string;
  commodity: {
    id: string;
    name: string;
    slug: string;
  };
  type: AnomalyType;
  severity: Severity;
  description: string;
  detectedValue: number;
  expectedRange: string;
  deviationPercent: number;
  detectedAt: string;
  acknowledged: boolean;
}

interface AnomalyAlertProps {
  commoditySlug?: string;
  showAll?: boolean;
  limit?: number;
  className?: string;
}

const TYPE_CONFIG: Record<AnomalyType, { icon: typeof AlertTriangle; label: string }> = {
  PRICE_SPIKE: { icon: TrendingUp, label: 'Alta' },
  PRICE_DROP: { icon: TrendingDown, label: 'Queda' },
  HIGH_VOLATILITY: { icon: Activity, label: 'Volatilidade' },
  HISTORICAL_HIGH: { icon: ArrowUpRight, label: 'Máxima' },
  HISTORICAL_LOW: { icon: ArrowDownRight, label: 'Mínima' },
};

// Usando design system: destructive para alta, chart-2 (laranja) para média, chart-4 (azul) para baixa
const SEVERITY_CONFIG: Record<Severity, { color: string; bgColor: string; label: string }> = {
  HIGH: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/30',
    label: 'Alta',
  },
  MEDIUM: {
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10 border-chart-2/30',
    label: 'Média',
  },
  LOW: {
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10 border-chart-4/30',
    label: 'Baixa',
  },
};

export function AnomalyAlert({ commoditySlug, showAll = false, limit = 5, className }: AnomalyAlertProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (commoditySlug) params.set('commodity', commoditySlug);
      if (!showAll) params.set('acknowledged', 'false');
      params.set('limit', String(limit));

      const res = await fetch(`/api/ai/anomalies?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setAnomalies(data.anomalies || []);
    } catch (err) {
      console.error('Erro ao buscar anomalias:', err);
      setError('Não foi possível carregar');
    } finally {
      setLoading(false);
    }
  }, [commoditySlug, showAll, limit]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const acknowledgeAnomaly = async (id: string) => {
    try {
      await fetch('/api/ai/anomalies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acknowledged: true }),
      });
      setAnomalies(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erro ao reconhecer anomalia:', err);
    }
  };

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Anomalia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Anomalia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={fetchAnomalies}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (anomalies.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Nenhuma Anomalia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos os preços estão dentro do esperado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Alertas de Anomalia
            <Badge variant="secondary" className="ml-2">
              {anomalies.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchAnomalies}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((anomaly) => {
          const typeConfig = TYPE_CONFIG[anomaly.type];
          const severityConfig = SEVERITY_CONFIG[anomaly.severity];
          const Icon = typeConfig.icon;

          return (
            <div
              key={anomaly.id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                severityConfig.bgColor
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <Icon className={cn('h-5 w-5 mt-0.5', severityConfig.color)} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!commoditySlug && (
                        <Link
                          href={`/cotacoes/${anomaly.commodity.slug}`}
                          className="font-semibold hover:underline"
                        >
                          {anomaly.commodity.name}
                        </Link>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {typeConfig.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', severityConfig.color)}
                      >
                        {severityConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm">{anomaly.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        R$ {anomaly.detectedValue.toFixed(2)}
                      </span>
                      <span>
                        Desvio: {anomaly.deviationPercent > 0 ? '+' : ''}
                        {anomaly.deviationPercent.toFixed(1)}%
                      </span>
                      <span>
                        {new Date(anomaly.detectedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => acknowledgeAnomaly(anomaly.id)}
                  title="Dispensar alerta"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Anomalias detectadas por análise estatística
        </p>
      </CardContent>
    </Card>
  );
}

// Componente compacto para exibir no header ou sidebar
export function AnomalyBadge({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/ai/anomalies?acknowledged=false&limit=50');
        const data = await res.json();
        setCount(data.stats?.unacknowledged || 0);
      } catch {
        // Silently fail
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5 * 60 * 1000); // A cada 5 min
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <Link href="/cotacoes" className={cn('relative', className)}>
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
        {count > 9 ? '9+' : count}
      </span>
    </Link>
  );
}
