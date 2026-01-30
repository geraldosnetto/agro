'use client';

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  Lightbulb,
  FileText,
  Wheat,
  Beef,
  Milk,
  Egg,
  Coffee,
  Leaf,
  Droplets,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReportRendererProps {
  content: string;
  title?: string;
}

interface ParsedSection {
  title: string;
  content: string;
  type: 'summary' | 'highlights' | 'dollar' | 'outlook' | 'analysis' | 'default';
}

interface PriceChange {
  commodity: string;
  change: string;
  direction: 'up' | 'down' | 'stable';
}

// Detecta o tipo de seção pelo título
function getSectionType(title: string): ParsedSection['type'] {
  const lower = title.toLowerCase();
  if (lower.includes('resumo') || lower.includes('executivo') || lower.includes('sumário')) return 'summary';
  if (lower.includes('destaque') || lower.includes('altas') || lower.includes('baixas')) return 'highlights';
  if (lower.includes('dólar') || lower.includes('dolar') || lower.includes('câmbio')) return 'dollar';
  if (lower.includes('perspectiva') || lower.includes('tendência') || lower.includes('previsão') || lower.includes('outlook')) return 'outlook';
  if (lower.includes('análise') || lower.includes('analise')) return 'analysis';
  return 'default';
}

// Ícone por tipo de seção
function getSectionIcon(type: ParsedSection['type']) {
  const icons = {
    summary: BarChart3,
    highlights: TrendingUp,
    dollar: DollarSign,
    outlook: Lightbulb,
    analysis: Target,
    default: FileText,
  };
  return icons[type];
}

// Estilos por tipo de seção usando design system (chart colors e semantic colors)
function getSectionStyles(type: ParsedSection['type']) {
  const styles = {
    // Resumo: usa primary (verde agro)
    summary: 'bg-primary/5 border-primary/20',
    // Destaques: usa chart-1 (verde grãos)
    highlights: 'bg-chart-1/5 border-chart-1/20',
    // Dólar: usa accent (dourado/amarelo)
    dollar: 'bg-accent/20 border-accent/40',
    // Perspectivas: usa chart-3 (roxo sucroenergetico)
    outlook: 'bg-chart-3/5 border-chart-3/20',
    // Análise: usa chart-2 (laranja pecuária)
    analysis: 'bg-chart-2/5 border-chart-2/20',
    // Default: usa secondary
    default: 'bg-secondary/50 border-border',
  };
  return styles[type];
}

// Cor do ícone por tipo de seção
function getIconColor(type: ParsedSection['type']) {
  const colors = {
    summary: 'text-primary',
    highlights: 'text-chart-1',
    dollar: 'text-chart-5',
    outlook: 'text-chart-3',
    analysis: 'text-chart-2',
    default: 'text-muted-foreground',
  };
  return colors[type];
}

// Ícone da commodity pelo nome
function getCommodityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('boi') || lower.includes('bezerro')) return Beef;
  if (lower.includes('soja')) return Leaf;
  if (lower.includes('milho') || lower.includes('trigo')) return Wheat;
  if (lower.includes('café') || lower.includes('cafe')) return Coffee;
  if (lower.includes('leite')) return Milk;
  if (lower.includes('ovo') || lower.includes('frango')) return Egg;
  if (lower.includes('algodão') || lower.includes('algodao')) return Droplets;
  return Wheat;
}

// Extrai mudanças de preço do texto
function extractPriceChanges(text: string): PriceChange[] {
  const changes: PriceChange[] = [];

  // Padrão: Nome da commodity seguido de variação percentual
  // Ex: "Boi Gordo: +1,65%" ou "Soja (-2,30%)" ou "Milho • +0,45%"
  const patterns = [
    /([A-Za-zÀ-ÿ\s]+)[\s:•-]+([+-]?\d+[,.]?\d*\s*%)/gi,
    /([A-Za-zÀ-ÿ\s]+)\s*\(([+-]?\d+[,.]?\d*\s*%)\)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const commodity = match[1].trim();
      const change = match[2].trim();

      // Ignorar strings muito curtas ou números
      if (commodity.length < 3 || /^\d+$/.test(commodity)) continue;

      // Determinar direção
      let direction: 'up' | 'down' | 'stable' = 'stable';
      if (change.includes('+') || (!change.includes('-') && parseFloat(change.replace(',', '.')) > 0)) {
        direction = 'up';
      } else if (change.includes('-') || parseFloat(change.replace(',', '.')) < 0) {
        direction = 'down';
      }

      changes.push({ commodity, change, direction });
    }
  }

  return changes;
}

// Componente para variação de preço - usando design system (primary para alta, destructive para baixa)
function PriceChangeDisplay({ change }: { change: PriceChange }) {
  const Icon = change.direction === 'up' ? TrendingUp : change.direction === 'down' ? TrendingDown : Minus;
  const CommodityIcon = getCommodityIcon(change.commodity);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02]',
        // Design system: primary (verde) para alta, destructive (vermelho) para baixa, muted para estável
        change.direction === 'up' && 'bg-primary/10 border-primary/30 text-primary',
        change.direction === 'down' && 'bg-destructive/10 border-destructive/30 text-destructive',
        change.direction === 'stable' && 'bg-muted border-border text-muted-foreground'
      )}
    >
      <CommodityIcon className="h-5 w-5 shrink-0 opacity-60" />
      <span className="font-medium flex-1 text-foreground">{change.commodity}</span>
      <div className="flex items-center gap-1 font-bold">
        <Icon className="h-4 w-4" />
        <span>{change.change}</span>
      </div>
    </div>
  );
}

// Parser de seções
function parseSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  // Remove o título principal se existir (linhas começando com #)
  const lines = content.split('\n');
  let currentSection: ParsedSection | null = null;
  let contentBuffer: string[] = [];

  for (const line of lines) {
    // Detecta cabeçalhos de seção (## ou **TÍTULO**)
    const h2Match = line.match(/^##\s*(.+)$/);
    const boldMatch = line.match(/^\*\*([A-ZÀ-Ÿ\s]+)\*\*$/);
    const capsMatch = line.match(/^([A-ZÀ-Ÿ]{2,}[\sA-ZÀ-Ÿ]*)$/);

    const headerText = h2Match?.[1] || boldMatch?.[1] || (capsMatch && capsMatch[1].length > 5 ? capsMatch[1] : null);

    if (headerText) {
      // Salva a seção anterior
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n').trim();
        if (currentSection.content) {
          sections.push(currentSection);
        }
      }

      // Inicia nova seção
      currentSection = {
        title: headerText.replace(/[#*]/g, '').trim(),
        content: '',
        type: getSectionType(headerText),
      };
      contentBuffer = [];
    } else {
      contentBuffer.push(line);
    }
  }

  // Salva a última seção
  if (currentSection) {
    currentSection.content = contentBuffer.join('\n').trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }

  // Se não conseguiu parsear seções, retorna o conteúdo como uma seção única
  if (sections.length === 0) {
    return [{
      title: 'Análise',
      content: content,
      type: 'default',
    }];
  }

  return sections;
}

// Renderiza parágrafo com formatação
function FormattedText({ text }: { text: string }) {
  // Processa negrito, itálico e lista
  const lines = text.split('\n').filter(line => line.trim());

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        // Lista com bullet
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          const content = line.replace(/^[-•]\s*/, '').trim();
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-primary mt-2 text-lg">•</span>
              <span className="flex-1" dangerouslySetInnerHTML={{
                __html: content
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
              }} />
            </div>
          );
        }

        // Lista numerada
        const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex items-start gap-3 pl-2">
              <Badge variant="outline" className="shrink-0 mt-0.5">{numberedMatch[1]}</Badge>
              <span className="flex-1" dangerouslySetInnerHTML={{
                __html: numberedMatch[2]
                  .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
              }} />
            </div>
          );
        }

        // Parágrafo normal
        return (
          <p key={i} className="leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
          }} />
        );
      })}
    </div>
  );
}

// Componente de seção
function ReportSection({ section }: { section: ParsedSection }) {
  const Icon = getSectionIcon(section.type);
  const sectionStyles = getSectionStyles(section.type);
  const iconColor = getIconColor(section.type);
  const priceChanges = extractPriceChanges(section.content);

  // Se tem mudanças de preço, renderiza em grid
  const hasPriceGrid = priceChanges.length >= 2 && section.type === 'highlights';

  return (
    <Card className={cn('overflow-hidden border', sectionStyles)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-background/80">
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasPriceGrid ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {priceChanges.map((change, i) => (
              <PriceChangeDisplay key={i} change={change} />
            ))}
          </div>
        ) : (
          <FormattedText text={section.content} />
        )}
      </CardContent>
    </Card>
  );
}

// Componente principal
export function ReportRenderer({ content, title }: ReportRendererProps) {
  const sections = useMemo(() => parseSections(content), [content]);

  // Extrai todas as mudanças de preço para resumo
  const allPriceChanges = useMemo(() => {
    const changes: PriceChange[] = [];
    for (const section of sections) {
      changes.push(...extractPriceChanges(section.content));
    }
    return changes;
  }, [sections]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const ups = allPriceChanges.filter(c => c.direction === 'up').length;
    const downs = allPriceChanges.filter(c => c.direction === 'down').length;
    return { ups, downs, total: allPriceChanges.length };
  }, [allPriceChanges]);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas - usando design system */}
      {stats.total > 0 && (
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10 px-3 py-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {stats.ups} em alta
          </Badge>
          <Badge variant="outline" className="text-destructive border-destructive/50 bg-destructive/10 px-3 py-1">
            <TrendingDown className="h-3 w-3 mr-1" />
            {stats.downs} em baixa
          </Badge>
        </div>
      )}

      {/* Seções do relatório */}
      <div className="grid gap-6">
        {sections.map((section, i) => (
          <ReportSection key={i} section={section} />
        ))}
      </div>

      {/* Footer com disclaimer */}
      <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border border-dashed text-xs text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Este relatório foi gerado por inteligência artificial com base em dados de mercado.
          As informações são de caráter informativo e não constituem recomendação de investimento.
        </p>
      </div>
    </div>
  );
}
