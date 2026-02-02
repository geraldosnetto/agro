/**
 * Price Predictor - Advanced Ensemble Model
 *
 * Combines 5 models for robust price predictions:
 * - SMA (Simple Moving Average)
 * - EMA (Exponential Moving Average)
 * - Linear Regression
 * - ARIMA (Autoregressive Integrated Moving Average)
 * - Holt-Winters (Triple Exponential Smoothing)
 */

import { projectPriceWithEMA } from './moving-average';
import { linearRegression, projectPrice, analyzeTrends, calculateROC } from './trend-analysis';
import {
  analyzeVolatility,
  calculateConfidenceAdjustment,
  calculatePredictionBounds,
} from './volatility';
import { predictARIMA } from './arima';
import { predictHoltWinters } from './holt-winters';
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
    arima: number;
    holtWinters: number;
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
 * Calculate model weights based on recent accuracy, volatility, and horizon
 * Longer horizons favor ARIMA and Holt-Winters over moving averages
 */
function calculateAdvancedModelWeights(
  values: number[],
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  horizon: number
): { sma: number; ema: number; lr: number; arima: number; hw: number } {
  const { rSquared } = linearRegression(values.slice(-30));

  // Base weights - 5 models
  let smaWeight = 0.15;
  let emaWeight = 0.20;
  let lrWeight = 0.25;
  let arimaWeight = 0.20;
  let hwWeight = 0.20;

  // Adjust based on R-squared (linear regression reliability)
  if (rSquared > 0.7) {
    // Strong linear trend - trust regression and ARIMA more
    lrWeight = 0.30;
    arimaWeight = 0.25;
    emaWeight = 0.15;
    smaWeight = 0.10;
    hwWeight = 0.20;
  } else if (rSquared < 0.3) {
    // Weak linear trend - trust moving averages and Holt-Winters more
    lrWeight = 0.15;
    arimaWeight = 0.20;
    emaWeight = 0.25;
    smaWeight = 0.15;
    hwWeight = 0.25;
  }

  // Adjust based on volatility
  if (volatilityLevel === 'HIGH') {
    // High volatility - favor EMA (more responsive) and reduce long-term models
    emaWeight += 0.05;
    arimaWeight -= 0.05;
  } else if (volatilityLevel === 'LOW') {
    // Low volatility - linear regression and ARIMA more reliable
    lrWeight += 0.05;
    arimaWeight += 0.05;
    smaWeight -= 0.05;
    emaWeight -= 0.05;
  }

  // Adjust based on horizon
  // Longer horizons favor ARIMA and Holt-Winters
  if (horizon >= 60) {
    // Long-term: ARIMA and Holt-Winters are better
    arimaWeight += 0.10;
    hwWeight += 0.10;
    smaWeight -= 0.10;
    emaWeight -= 0.10;
  } else if (horizon >= 30) {
    // Medium-term: balanced approach with slight favor to statistical models
    arimaWeight += 0.05;
    hwWeight += 0.05;
    smaWeight -= 0.05;
    emaWeight -= 0.05;
  }

  // Normalize weights to sum to 1
  const total = smaWeight + emaWeight + lrWeight + arimaWeight + hwWeight;
  return {
    sma: Math.max(0.05, smaWeight / total),
    ema: Math.max(0.05, emaWeight / total),
    lr: Math.max(0.05, lrWeight / total),
    arima: Math.max(0.05, arimaWeight / total),
    hw: Math.max(0.05, hwWeight / total),
  };
}

/**
 * Generate prediction factors (explanatory variables)
 */
function generateFactors(
  values: number[],
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  trendDirection: 'UP' | 'DOWN' | 'STABLE',
  horizon: number
): PredictionFactor[] {
  const factors: PredictionFactor[] = [];

  // Short-term momentum
  const roc7 = calculateROC(values, 7);
  factors.push({
    name: 'Momentum curto prazo (7d)',
    impact: roc7 > 1 ? 'positive' : roc7 < -1 ? 'negative' : 'neutral',
    weight: horizon <= 14 ? 0.35 : 0.25,
  });

  // Medium-term trend
  factors.push({
    name: 'Tendência médio prazo (30d)',
    impact: trendDirection === 'UP' ? 'positive' : trendDirection === 'DOWN' ? 'negative' : 'neutral',
    weight: 0.30,
  });

  // Volatility
  factors.push({
    name: 'Volatilidade',
    impact: volatilityLevel === 'HIGH' ? 'negative' : volatilityLevel === 'LOW' ? 'positive' : 'neutral',
    weight: 0.20,
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

  // Seasonality factor for longer horizons
  if (horizon >= 30) {
    factors.push({
      name: 'Sazonalidade detectada',
      impact: 'neutral',
      weight: 0.10,
    });
  }

  return factors;
}

/**
 * Main prediction function - Advanced Ensemble Model
 * Now includes ARIMA and Holt-Winters
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

  // Calculate model weights based on data characteristics and horizon
  const weights = calculateAdvancedModelWeights(values, volatility.volatilityLevel, daysAhead);

  // Individual model predictions
  const smaPrediction = predictWithSMA(values, daysAhead);
  const emaPrediction = projectPriceWithEMA(values, daysAhead);
  const lrPrediction = projectPrice(values, daysAhead);

  // Advanced model predictions
  let arimaPrediction: number;
  let hwPrediction: number;

  try {
    arimaPrediction = predictARIMA(data, daysAhead);
  } catch {
    // Fallback to linear regression if ARIMA fails
    arimaPrediction = lrPrediction;
  }

  try {
    hwPrediction = predictHoltWinters(data, daysAhead);
  } catch {
    // Fallback to EMA if Holt-Winters fails
    hwPrediction = emaPrediction;
  }

  // Ensemble prediction (weighted average of all 5 models)
  const ensemblePrediction =
    smaPrediction * weights.sma +
    emaPrediction * weights.ema +
    lrPrediction * weights.lr +
    arimaPrediction * weights.arima +
    hwPrediction * weights.hw;

  // Calculate price change
  const priceChange = ensemblePrediction - currentPrice;
  const priceChangePercent = (priceChange / currentPrice) * 100;

  // Determine direction
  let direction: PredictionDirection = 'STABLE';
  if (priceChangePercent > 1) direction = 'UP';
  else if (priceChangePercent < -1) direction = 'DOWN';

  // Calculate base confidence
  // Higher agreement between models = higher confidence
  const predictions = [smaPrediction, emaPrediction, lrPrediction, arimaPrediction, hwPrediction];
  const predictionStdDev = Math.sqrt(
    predictions.reduce((sum, p) => sum + (p - ensemblePrediction) ** 2, 0) / 5
  );
  const predictionCV = (predictionStdDev / ensemblePrediction) * 100;

  // Base confidence from model agreement (lower CV = higher confidence)
  let confidence = Math.max(30, 100 - predictionCV * 8);

  // Adjust for trend strength
  confidence *= (0.7 + (trends.confidence / 100) * 0.3);

  // Adjust for volatility
  confidence *= confidenceAdjustment;

  // Adjust for data quality (more data = higher confidence)
  const dataQualityMultiplier = Math.min(1, data.length / 90);
  confidence *= (0.75 + dataQualityMultiplier * 0.25);

  // Adjust confidence based on horizon (longer = less confident)
  if (daysAhead > 30) {
    confidence *= (1 - (daysAhead - 30) / 200);
  }

  // Cap confidence
  confidence = Math.min(85, Math.max(20, confidence));

  // Calculate prediction bounds (wider for advanced models and longer horizons)
  const bounds = calculatePredictionBounds(ensemblePrediction, volatility, daysAhead);

  // Generate factors
  const factors = generateFactors(values, volatility.volatilityLevel, trends.overallTrend, daysAhead);

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
      arima: Math.round(arimaPrediction * 100) / 100,
      holtWinters: Math.round(hwPrediction * 100) / 100,
      ensemble: Math.round(ensemblePrediction * 100) / 100,
    },
  };
}

/**
 * Generate predictions for multiple horizons
 * Now supports up to 90 days
 */
export function predictMultipleHorizons(
  data: DataPoint[],
  horizons: number[] = [7, 14, 30, 60, 90]
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
