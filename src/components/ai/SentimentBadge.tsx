'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  score?: number;
  loading?: boolean;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SENTIMENT_CONFIG: Record<Sentiment, {
  label: string;
  icon: typeof TrendingUp;
  colors: string;
  bgColors: string;
}> = {
  POSITIVE: {
    label: 'Positivo',
    icon: TrendingUp,
    colors: 'text-positive',
    bgColors: 'bg-positive-muted border-positive-subtle',
  },
  NEGATIVE: {
    label: 'Negativo',
    icon: TrendingDown,
    colors: 'text-negative',
    bgColors: 'bg-negative-muted border-negative-subtle',
  },
  NEUTRAL: {
    label: 'Neutro',
    icon: Minus,
    colors: 'text-slate-600 dark:text-slate-400',
    bgColors: 'bg-slate-100 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700',
  },
};

const SIZE_CONFIG = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

export function SentimentBadge({
  sentiment,
  score,
  loading = false,
  showScore = false,
  size = 'md',
  className,
}: SentimentBadgeProps) {
  if (loading) {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full border',
        'bg-muted/50 border-muted-foreground/20',
        SIZE_CONFIG[size].badge,
        className
      )}>
        <Loader2 className={cn(SIZE_CONFIG[size].icon, 'animate-spin text-muted-foreground')} />
        <span className="text-muted-foreground">Analisando...</span>
      </span>
    );
  }

  const config = SENTIMENT_CONFIG[sentiment];
  const Icon = config.icon;
  const sizeConfig = SIZE_CONFIG[size];

  const badge = (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      config.bgColors,
      config.colors,
      sizeConfig.badge,
      className
    )}>
      <Icon className={sizeConfig.icon} />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-70">
          ({score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%)
        </span>
      )}
    </span>
  );

  if (!showScore && score !== undefined) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>Score: {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

// Componente para exibir agregado de sentimento
interface SentimentSummaryProps {
  aggregate: {
    averageScore: number;
    sentiment: Sentiment;
    distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    totalAnalyzed: number;
  };
  className?: string;
}

export function SentimentSummary({ aggregate, className }: SentimentSummaryProps) {
  const total = aggregate.totalAnalyzed;
  const { positive, negative, neutral } = aggregate.distribution;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <SentimentBadge
          sentiment={aggregate.sentiment}
          score={aggregate.averageScore}
          showScore
        />
        <span className="text-sm text-muted-foreground">
          ({total} notícia{total !== 1 ? 's' : ''} analisada{total !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Barra de distribuição */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
        {positive > 0 && (
          <div
            className="h-full bg-positive"
            style={{ width: `${(positive / total) * 100}%` }}
          />
        )}
        {neutral > 0 && (
          <div
            className="h-full bg-slate-400"
            style={{ width: `${(neutral / total) * 100}%` }}
          />
        )}
        {negative > 0 && (
          <div
            className="h-full bg-negative"
            style={{ width: `${(negative / total) * 100}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-positive">{positive} positiva{positive !== 1 ? 's' : ''}</span>
        <span>{neutral} neutra{neutral !== 1 ? 's' : ''}</span>
        <span className="text-negative">{negative} negativa{negative !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
