/**
 * Price Predictor - Ensemble Model
 *
 * Combines SMA, EMA, and Linear Regression to generate
 * price predictions with confidence scores.
 */

import { projectPriceWithEMA } from './moving-average';
import { linearRegression, projectPrice, analyzeTrends, calculateROC } from './trend-analysis';
import {
  analyzeVolatility,
  calculateConfidenceAdjustment,
  calculatePredictionBounds,
} from './volatility';
import type { PredictionDirection, PredictionFactor } from '@/lib/schemas/ai';

export interface DataPoint {
  date: Date;
  value: number;
}

export interface PredictionResult {
  currentPrice: number;
  predictedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  direction: PredictionDirection;
  confidence: number;
  horizon: number;
  targetDate: Date;
  factors: PredictionFactor[];
  bounds: {
    lower: number;
    upper: number;
  };
  models: {
    sma: number;
    ema: number;
    linearRegression: number;
    ensemble: number;
  };
}

/**
 * Calculate SMA-based prediction
 * Projects using the trend from short vs long SMA
 */
function predictWithSMA(values: number[], daysAhead: number): number {
  const currentPrice = values[values.length - 1];
  const sma7 = values.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, values.length);
  const sma21 = values.slice(-21).reduce((a, b) => a + b, 0) / Math.min(21, values.length);

  // Daily momentum based on SMA crossover
  const momentum = (sma7 - sma21) / 21;
  const predicted = currentPrice + (momentum * daysAhead);

  // Bound the prediction
  return Math.max(currentPrice * 0.7, Math.min(currentPrice * 1.3, predicted));
}

/**
 * Calculate model weights based on recent accuracy
 * Uses R-squared and volatility to determine reliability
 */
function calculateModelWeights(
  values: number[],
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): { sma: number; ema: number; lr: number } {
  const { rSquared } = linearRegression(values.slice(-30));

  // Base weights
  let smaWeight = 0.25;
  let emaWeight = 0.35;
  let lrWeight = 0.40;

  // Adjust based on R-squared (linear regression reliability)
  if (rSquared > 0.7) {
    // Strong linear trend - trust regression more
    lrWeight = 0.50;
    emaWeight = 0.30;
    smaWeight = 0.20;
  } else if (rSquared < 0.3) {
    // Weak linear trend - trust moving averages more
    lrWeight = 0.20;
    emaWeight = 0.45;
    smaWeight = 0.35;
  }

  // Adjust based on volatility
  if (volatilityLevel === 'HIGH') {
    // High volatility - favor EMA (more responsive)
    emaWeight += 0.10;
    lrWeight -= 0.10;
  } else if (volatilityLevel === 'LOW') {
    // Low volatility - linear regression more reliable
    lrWeight += 0.05;
    smaWeight -= 0.05;
  }

  // Normalize weights to sum to 1
  const total = smaWeight + emaWeight + lrWeight;
  return {
    sma: smaWeight / total,
    ema: emaWeight / total,
    lr: lrWeight / total,
  };
}

/**
 * Generate prediction factors (explanatory variables)
 */
function generateFactors(
  values: number[],
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  trendDirection: 'UP' | 'DOWN' | 'STABLE'
): PredictionFactor[] {
  const factors: PredictionFactor[] = [];

  // Short-term momentum
  const roc7 = calculateROC(values, 7);
  factors.push({
    name: 'Momentum curto prazo (7d)',
    impact: roc7 > 1 ? 'positive' : roc7 < -1 ? 'negative' : 'neutral',
    weight: 0.3,
  });

  // Medium-term trend
  factors.push({
    name: 'Tendência médio prazo (30d)',
    impact: trendDirection === 'UP' ? 'positive' : trendDirection === 'DOWN' ? 'negative' : 'neutral',
    weight: 0.35,
  });

  // Volatility
  factors.push({
    name: 'Volatilidade',
    impact: volatilityLevel === 'HIGH' ? 'negative' : volatilityLevel === 'LOW' ? 'positive' : 'neutral',
    weight: 0.2,
  });

  // Price position relative to recent range
  const min30 = Math.min(...values.slice(-30));
  const max30 = Math.max(...values.slice(-30));
  const currentPrice = values[values.length - 1];
  const position = (currentPrice - min30) / (max30 - min30 || 1);

  factors.push({
    name: 'Posição no range (30d)',
    impact: position > 0.7 ? 'negative' : position < 0.3 ? 'positive' : 'neutral',
    weight: 0.15,
  });

  return factors;
}

/**
 * Main prediction function - Ensemble Model
 */
export function predictPrice(
  data: DataPoint[],
  daysAhead: number = 7
): PredictionResult {
  if (data.length < 7) {
    throw new Error('Dados insuficientes para previsão. Mínimo de 7 pontos necessários.');
  }

  const values = data.map(d => d.value);
  const currentPrice = values[values.length - 1];

  // Analyze volatility
  const volatility = analyzeVolatility(data);
  const confidenceAdjustment = calculateConfidenceAdjustment(volatility.volatilityLevel);

  // Analyze trends
  const trends = analyzeTrends(data);

  // Calculate model weights
  const weights = calculateModelWeights(values, volatility.volatilityLevel);

  // Individual model predictions
  const smaPrediction = predictWithSMA(values, daysAhead);
  const emaPrediction = projectPriceWithEMA(values, daysAhead);
  const lrPrediction = projectPrice(values, daysAhead);

  // Ensemble prediction (weighted average)
  const ensemblePrediction =
    smaPrediction * weights.sma +
    emaPrediction * weights.ema +
    lrPrediction * weights.lr;

  // Calculate price change
  const priceChange = ensemblePrediction - currentPrice;
  const priceChangePercent = (priceChange / currentPrice) * 100;

  // Determine direction
  let direction: PredictionDirection = 'STABLE';
  if (priceChangePercent > 1) direction = 'UP';
  else if (priceChangePercent < -1) direction = 'DOWN';

  // Calculate base confidence
  // Higher agreement between models = higher confidence
  const predictions = [smaPrediction, emaPrediction, lrPrediction];
  const predictionStdDev = Math.sqrt(
    predictions.reduce((sum, p) => sum + (p - ensemblePrediction) ** 2, 0) / 3
  );
  const predictionCV = (predictionStdDev / ensemblePrediction) * 100;

  // Base confidence from model agreement (lower CV = higher confidence)
  let confidence = Math.max(30, 100 - predictionCV * 10);

  // Adjust for trend strength
  confidence *= (0.7 + (trends.confidence / 100) * 0.3);

  // Adjust for volatility
  confidence *= confidenceAdjustment;

  // Adjust for data quality (more data = higher confidence)
  const dataQualityMultiplier = Math.min(1, data.length / 60);
  confidence *= (0.8 + dataQualityMultiplier * 0.2);

  // Cap confidence
  confidence = Math.min(85, Math.max(25, confidence));

  // Calculate prediction bounds
  const bounds = calculatePredictionBounds(ensemblePrediction, volatility, daysAhead);

  // Generate factors
  const factors = generateFactors(values, volatility.volatilityLevel, trends.overallTrend);

  // Target date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);

  return {
    currentPrice,
    predictedPrice: Math.round(ensemblePrediction * 100) / 100,
    priceChange: Math.round(priceChange * 100) / 100,
    priceChangePercent: Math.round(priceChangePercent * 100) / 100,
    direction,
    confidence: Math.round(confidence),
    horizon: daysAhead,
    targetDate,
    factors,
    bounds: {
      lower: Math.round(bounds.lower * 100) / 100,
      upper: Math.round(bounds.upper * 100) / 100,
    },
    models: {
      sma: Math.round(smaPrediction * 100) / 100,
      ema: Math.round(emaPrediction * 100) / 100,
      linearRegression: Math.round(lrPrediction * 100) / 100,
      ensemble: Math.round(ensemblePrediction * 100) / 100,
    },
  };
}

/**
 * Generate predictions for multiple horizons
 */
export function predictMultipleHorizons(
  data: DataPoint[],
  horizons: number[] = [7, 14, 30]
): Map<number, PredictionResult> {
  const results = new Map<number, PredictionResult>();

  for (const horizon of horizons) {
    try {
      results.set(horizon, predictPrice(data, horizon));
    } catch (error) {
      console.error(`Error predicting for horizon ${horizon}:`, error);
    }
  }

  return results;
}

/**
 * Export index file content
 */
export * from './moving-average';
export * from './trend-analysis';
export * from './volatility';
