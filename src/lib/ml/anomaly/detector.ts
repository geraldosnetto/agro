/**
 * Detector de Anomalias de Preço
 *
 * Detecta movimentos atípicos usando estatísticas:
 * - Desvio padrão (Z-score)
 * - Variação percentual extrema
 * - Volatilidade anormal
 * - Máximos/mínimos históricos
 */

export type AnomalyType = 'PRICE_SPIKE' | 'PRICE_DROP' | 'HIGH_VOLATILITY' | 'HISTORICAL_HIGH' | 'HISTORICAL_LOW';
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PriceDataPoint {
  date: Date;
  value: number;
}

export interface DetectedAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  detectedValue: number;
  expectedRange: { min: number; max: number };
  deviationPercent: number;
}

interface AnomalyDetectorConfig {
  // Limiares de Z-score para cada severidade
  zScoreThresholds: {
    low: number;      // > 1.5σ
    medium: number;   // > 2.0σ
    high: number;     // > 2.5σ
  };
  // Limiar de variação diária (%)
  dailyChangeThresholds: {
    low: number;      // > 3%
    medium: number;   // > 5%
    high: number;     // > 8%
  };
  // Limiar de volatilidade (desvio padrão relativo)
  volatilityThresholds: {
    low: number;      // > 0.03 (3%)
    medium: number;   // > 0.05 (5%)
    high: number;     // > 0.08 (8%)
  };
  // Mínimo de pontos para análise
  minDataPoints: number;
}

const DEFAULT_CONFIG: AnomalyDetectorConfig = {
  zScoreThresholds: { low: 1.5, medium: 2.0, high: 2.5 },
  dailyChangeThresholds: { low: 3, medium: 5, high: 8 },
  volatilityThresholds: { low: 0.03, medium: 0.05, high: 0.08 },
  minDataPoints: 14,
};

/**
 * Calcula média de um array de números
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calcula desvio padrão
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calcula Z-score (quantos desvios padrão do valor está da média)
 */
function zScore(value: number, values: number[]): number {
  const avg = mean(values);
  const std = standardDeviation(values);
  if (std === 0) return 0;
  return (value - avg) / std;
}

/**
 * Determina severidade baseado no valor e limiares
 */
function getSeverity(
  value: number,
  thresholds: { low: number; medium: number; high: number }
): AnomalySeverity | null {
  const absValue = Math.abs(value);
  if (absValue >= thresholds.high) return 'HIGH';
  if (absValue >= thresholds.medium) return 'MEDIUM';
  if (absValue >= thresholds.low) return 'LOW';
  return null;
}

/**
 * Detecta anomalias em uma série de preços
 */
export function detectAnomalies(
  data: PriceDataPoint[],
  config: Partial<AnomalyDetectorConfig> = {}
): DetectedAnomaly[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const anomalies: DetectedAnomaly[] = [];

  if (data.length < cfg.minDataPoints) {
    return anomalies;
  }

  // Ordenar por data (mais antigo primeiro)
  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map(d => d.value);
  const latestValue = values[values.length - 1];
  const previousValue = values[values.length - 2];

  // 1. Detectar spike/drop por Z-score
  const z = zScore(latestValue, values);
  const zSeverity = getSeverity(z, cfg.zScoreThresholds);

  if (zSeverity) {
    const avg = mean(values);
    const std = standardDeviation(values);

    anomalies.push({
      type: z > 0 ? 'PRICE_SPIKE' : 'PRICE_DROP',
      severity: zSeverity,
      description: z > 0
        ? `Preço ${zSeverity === 'HIGH' ? 'muito ' : ''}acima da média histórica`
        : `Preço ${zSeverity === 'HIGH' ? 'muito ' : ''}abaixo da média histórica`,
      detectedValue: latestValue,
      expectedRange: {
        min: avg - std,
        max: avg + std,
      },
      deviationPercent: ((latestValue - avg) / avg) * 100,
    });
  }

  // 2. Detectar variação diária extrema
  if (previousValue > 0) {
    const dailyChange = ((latestValue - previousValue) / previousValue) * 100;
    const changeSeverity = getSeverity(dailyChange, cfg.dailyChangeThresholds);

    if (changeSeverity) {
      anomalies.push({
        type: dailyChange > 0 ? 'PRICE_SPIKE' : 'PRICE_DROP',
        severity: changeSeverity,
        description: dailyChange > 0
          ? `Alta ${changeSeverity === 'HIGH' ? 'acentuada ' : ''}de ${Math.abs(dailyChange).toFixed(1)}% em um dia`
          : `Queda ${changeSeverity === 'HIGH' ? 'acentuada ' : ''}de ${Math.abs(dailyChange).toFixed(1)}% em um dia`,
        detectedValue: latestValue,
        expectedRange: {
          min: previousValue * 0.97,
          max: previousValue * 1.03,
        },
        deviationPercent: dailyChange,
      });
    }
  }

  // 3. Detectar volatilidade anormal (últimos 7 dias vs histórico)
  if (values.length >= 30) {
    const recent = values.slice(-7);
    const historical = values.slice(0, -7);

    const recentVolatility = standardDeviation(recent) / mean(recent);
    const historicalVolatility = standardDeviation(historical) / mean(historical);

    if (historicalVolatility > 0) {
      const volatilityRatio = recentVolatility / historicalVolatility;

      if (volatilityRatio > 2) {
        const volSeverity: AnomalySeverity = volatilityRatio > 3 ? 'HIGH' : volatilityRatio > 2.5 ? 'MEDIUM' : 'LOW';

        anomalies.push({
          type: 'HIGH_VOLATILITY',
          severity: volSeverity,
          description: `Volatilidade ${volSeverity === 'HIGH' ? 'muito ' : ''}acima do normal (${volatilityRatio.toFixed(1)}x)`,
          detectedValue: recentVolatility * 100,
          expectedRange: {
            min: 0,
            max: historicalVolatility * 100,
          },
          deviationPercent: (volatilityRatio - 1) * 100,
        });
      }
    }
  }

  // 4. Detectar máximos/mínimos históricos
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  if (latestValue >= maxValue) {
    anomalies.push({
      type: 'HISTORICAL_HIGH',
      severity: 'MEDIUM',
      description: `Preço atingiu máxima histórica do período`,
      detectedValue: latestValue,
      expectedRange: {
        min: minValue,
        max: maxValue,
      },
      deviationPercent: ((latestValue - mean(values)) / mean(values)) * 100,
    });
  } else if (latestValue <= minValue) {
    anomalies.push({
      type: 'HISTORICAL_LOW',
      severity: 'MEDIUM',
      description: `Preço atingiu mínima histórica do período`,
      detectedValue: latestValue,
      expectedRange: {
        min: minValue,
        max: maxValue,
      },
      deviationPercent: ((latestValue - mean(values)) / mean(values)) * 100,
    });
  }

  // Remover duplicatas (manter a de maior severidade por tipo)
  const severityOrder: Record<AnomalySeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const uniqueByType = new Map<AnomalyType, DetectedAnomaly>();

  for (const anomaly of anomalies) {
    const existing = uniqueByType.get(anomaly.type);
    if (!existing || severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
      uniqueByType.set(anomaly.type, anomaly);
    }
  }

  return Array.from(uniqueByType.values());
}

/**
 * Formata o range esperado como string
 */
export function formatExpectedRange(range: { min: number; max: number }): string {
  return `R$ ${range.min.toFixed(2)} - R$ ${range.max.toFixed(2)}`;
}
