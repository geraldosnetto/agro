/**
 * Volatility Calculations for Price Prediction
 *
 * Measures price variability to assess prediction confidence
 * and identify potential risk levels.
 */

export interface DataPoint {
  date: Date;
  value: number;
}

export interface VolatilityResult {
  standardDeviation: number;
  coefficientOfVariation: number; // CV = (StdDev / Mean) * 100
  averageTrueRange: number;       // ATR-like measure
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priceRange: {
    min: number;
    max: number;
    range: number;
    rangePercent: number;
  };
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculate coefficient of variation (CV)
 * CV = (Standard Deviation / Mean) * 100
 * Useful for comparing volatility across different price levels
 */
export function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;

  const stdDev = calculateStandardDeviation(values);
  return (stdDev / mean) * 100;
}

/**
 * Calculate daily returns (percentage changes)
 */
export function calculateDailyReturns(values: number[]): number[] {
  if (values.length < 2) return [];

  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1] * 100);
    }
  }

  return returns;
}

/**
 * Calculate volatility of returns (more accurate for financial data)
 */
export function calculateReturnsVolatility(values: number[]): number {
  const returns = calculateDailyReturns(values);
  if (returns.length === 0) return 0;

  return calculateStandardDeviation(returns);
}

/**
 * Calculate Average True Range (simplified for daily data)
 * In absence of high/low/close, we use daily price changes
 */
export function calculateATR(values: number[], period: number = 14): number {
  if (values.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < values.length; i++) {
    // True range approximation using daily change
    trueRanges.push(Math.abs(values[i] - values[i - 1]));
  }

  // Calculate average of last 'period' true ranges
  const relevantTR = trueRanges.slice(-period);
  return relevantTR.reduce((a, b) => a + b, 0) / relevantTR.length;
}

/**
 * Determine volatility level based on coefficient of variation
 * Thresholds calibrated for agricultural commodities
 */
export function determineVolatilityLevel(
  cv: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  // Agricultural commodities typically have CV between 2-15%
  if (cv < 3) return 'LOW';
  if (cv < 8) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Calculate price range statistics
 */
export function calculatePriceRange(values: number[]): {
  min: number;
  max: number;
  range: number;
  rangePercent: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, range: 0, rangePercent: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const rangePercent = mean !== 0 ? (range / mean) * 100 : 0;

  return { min, max, range, rangePercent };
}

/**
 * Calculate confidence adjustment based on volatility
 * Higher volatility = lower confidence in predictions
 */
export function calculateConfidenceAdjustment(
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): number {
  switch (volatilityLevel) {
    case 'LOW':
      return 1.0; // Full confidence
    case 'MEDIUM':
      return 0.85; // 15% reduction
    case 'HIGH':
      return 0.65; // 35% reduction
  }
}

/**
 * Full volatility analysis
 */
export function analyzeVolatility(data: DataPoint[]): VolatilityResult {
  const values = data.map(d => d.value);

  const standardDeviation = calculateStandardDeviation(values);
  const coefficientOfVariation = calculateCoefficientOfVariation(values);
  const averageTrueRange = calculateATR(values);
  const volatilityLevel = determineVolatilityLevel(coefficientOfVariation);
  const priceRange = calculatePriceRange(values);

  return {
    standardDeviation,
    coefficientOfVariation,
    averageTrueRange,
    volatilityLevel,
    priceRange,
  };
}

/**
 * Calculate prediction bounds based on volatility
 * Returns upper and lower bounds for predicted price
 */
export function calculatePredictionBounds(
  predictedPrice: number,
  volatility: VolatilityResult,
  daysAhead: number,
  confidenceLevel: number = 0.95 // 95% confidence interval
): { lower: number; upper: number } {
  // Z-score for 95% confidence = 1.96
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645; // 90% = 1.645

  // Adjust standard deviation for time horizon
  // Volatility increases with sqrt of time
  const adjustedStdDev = volatility.standardDeviation * Math.sqrt(daysAhead);

  const margin = zScore * adjustedStdDev;

  return {
    lower: Math.max(0, predictedPrice - margin),
    upper: predictedPrice + margin,
  };
}
