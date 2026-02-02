/**
 * Price Prediction Module
 *
 * Provides statistical price predictions for agricultural commodities
 * using Moving Averages, Linear Regression, ARIMA, and Holt-Winters methods.
 */

export { predictPrice, predictMultipleHorizons } from './price-predictor';
export type { PredictionResult, DataPoint } from './price-predictor';

export {
  calculateSMA,
  calculateEMA,
  analyzeMovingAverages,
  projectPriceWithEMA,
} from './moving-average';

export {
  linearRegression,
  projectPrice,
  analyzeTrends,
  calculateROC,
} from './trend-analysis';

export {
  analyzeVolatility,
  calculateStandardDeviation,
  calculateCoefficientOfVariation,
  calculatePredictionBounds,
} from './volatility';

export {
  predictARIMA,
  predictWithARIMA,
  autoARIMA,
  difference,
  inverseDifference,
  autocorrelation,
} from './arima';

export {
  predictHoltWinters,
  predictWithHoltWinters,
  fitHoltWinters,
  optimizeHoltWinters,
  autoHoltWinters,
} from './holt-winters';
