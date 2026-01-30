/**
 * Moving Average Calculations for Price Prediction
 *
 * SMA (Simple Moving Average) - Equal weight to all periods
 * EMA (Exponential Moving Average) - More weight to recent data
 */

export interface DataPoint {
  date: Date;
  value: number;
}

export interface MovingAverageResult {
  sma: number;
  ema: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendStrength: number; // 0-100%
}

/**
 * Calculate Simple Moving Average
 * @param values Array of numeric values
 * @param period Number of periods (days)
 */
export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) {
    // Use available data if less than period
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  const relevantValues = values.slice(-period);
  const sum = relevantValues.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average
 * EMA = (Price * k) + (Previous EMA * (1 - k))
 * where k = 2 / (period + 1)
 */
export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const k = 2 / (period + 1);

  // Start with SMA for first period
  let ema = values.slice(0, Math.min(period, values.length))
    .reduce((a, b) => a + b, 0) / Math.min(period, values.length);

  // Calculate EMA for remaining values
  for (let i = Math.min(period, values.length); i < values.length; i++) {
    ema = (values[i] * k) + (ema * (1 - k));
  }

  return ema;
}

/**
 * Calculate multiple SMAs for trend analysis
 */
export function calculateMultipleSMAs(
  values: number[],
  periods: number[] = [7, 14, 30]
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const period of periods) {
    result[period] = calculateSMA(values, period);
  }
  return result;
}

/**
 * Calculate multiple EMAs for trend analysis
 */
export function calculateMultipleEMAs(
  values: number[],
  periods: number[] = [7, 14, 30]
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const period of periods) {
    result[period] = calculateEMA(values, period);
  }
  return result;
}

/**
 * Determine trend based on moving averages
 * - Short MA > Long MA = Bullish (UP)
 * - Short MA < Long MA = Bearish (DOWN)
 * - Close to each other = STABLE
 */
export function determineTrend(
  shortMA: number,
  longMA: number,
  threshold: number = 0.02 // 2% threshold for STABLE
): { trend: 'UP' | 'DOWN' | 'STABLE'; strength: number } {
  if (longMA === 0) return { trend: 'STABLE', strength: 0 };

  const diff = (shortMA - longMA) / longMA;

  if (Math.abs(diff) < threshold) {
    return { trend: 'STABLE', strength: Math.abs(diff) * 100 / threshold };
  }

  return {
    trend: diff > 0 ? 'UP' : 'DOWN',
    strength: Math.min(Math.abs(diff) * 100, 100),
  };
}

/**
 * Project future price using EMA momentum
 * Uses the rate of change between EMAs to project
 */
export function projectPriceWithEMA(
  values: number[],
  daysAhead: number,
  shortPeriod: number = 7,
  longPeriod: number = 21
): number {
  if (values.length < 2) return values[values.length - 1] || 0;

  const currentPrice = values[values.length - 1];
  const shortEMA = calculateEMA(values, shortPeriod);
  const longEMA = calculateEMA(values, longPeriod);

  // Calculate daily momentum (rate of EMA crossover)
  const momentum = (shortEMA - longEMA) / longPeriod;

  // Project price
  const projectedPrice = currentPrice + (momentum * daysAhead);

  // Don't allow negative prices
  return Math.max(projectedPrice, currentPrice * 0.5);
}

/**
 * Calculate full moving average analysis
 */
export function analyzeMovingAverages(data: DataPoint[]): MovingAverageResult {
  const values = data.map(d => d.value);

  const sma7 = calculateSMA(values, 7);
  const ema7 = calculateEMA(values, 7);
  const ema21 = calculateEMA(values, 21);

  // Use EMA for trend determination (more responsive)
  const { trend, strength } = determineTrend(ema7, ema21);

  return {
    sma: sma7,
    ema: ema7,
    trend,
    trendStrength: strength,
  };
}
