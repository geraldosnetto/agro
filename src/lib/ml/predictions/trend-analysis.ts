/**
 * Trend Analysis using Linear Regression
 *
 * Calculates best-fit line through price data to identify
 * long-term trends and project future prices.
 */

export interface DataPoint {
  date: Date;
  value: number;
}

export interface LinearRegressionResult {
  slope: number;           // Rate of change per day
  intercept: number;       // Y-intercept
  rSquared: number;        // Coefficient of determination (0-1)
  trend: 'UP' | 'DOWN' | 'STABLE';
  predictedPrice: number;  // Price at last data point according to model
}

export interface TrendAnalysis {
  shortTerm: LinearRegressionResult;  // 7-14 days
  mediumTerm: LinearRegressionResult; // 30 days
  longTerm: LinearRegressionResult;   // 90+ days
  overallTrend: 'UP' | 'DOWN' | 'STABLE';
  confidence: number;
}

/**
 * Calculate linear regression using least squares method
 * y = mx + b where m is slope and b is intercept
 */
export function linearRegression(
  values: number[]
): { slope: number; intercept: number; rSquared: number } {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] || 0, rSquared: 0 };
  }

  // Use index as x (days from start)
  const x = Array.from({ length: n }, (_, i) => i);

  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  // Calculate slope (m) and intercept (b)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (values[i] - yMean);
    denominator += (x[i] - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - (slope * xMean);

  // Calculate R-squared (coefficient of determination)
  let ssRes = 0; // Residual sum of squares
  let ssTot = 0; // Total sum of squares

  for (let i = 0; i < n; i++) {
    const predicted = slope * x[i] + intercept;
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }

  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, intercept, rSquared: Math.max(0, Math.min(1, rSquared)) };
}

/**
 * Project future price using linear regression
 */
export function projectPrice(
  values: number[],
  daysAhead: number
): number {
  const { slope, intercept } = linearRegression(values);
  const projectedDay = values.length - 1 + daysAhead;
  const projectedPrice = slope * projectedDay + intercept;

  // Don't allow price to go negative or unreasonably low
  const currentPrice = values[values.length - 1];
  const minPrice = currentPrice * 0.5; // Max 50% drop
  const maxPrice = currentPrice * 2;   // Max 100% rise

  return Math.max(minPrice, Math.min(maxPrice, projectedPrice));
}

/**
 * Determine trend direction from slope
 */
export function determineTrendFromSlope(
  slope: number,
  currentPrice: number,
  threshold: number = 0.001 // 0.1% of price per day
): 'UP' | 'DOWN' | 'STABLE' {
  const relativeSlope = slope / currentPrice;

  if (Math.abs(relativeSlope) < threshold) {
    return 'STABLE';
  }

  return slope > 0 ? 'UP' : 'DOWN';
}

/**
 * Analyze trend for a specific period
 */
export function analyzePeriod(values: number[]): LinearRegressionResult {
  if (values.length === 0) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      trend: 'STABLE',
      predictedPrice: 0,
    };
  }

  const { slope, intercept, rSquared } = linearRegression(values);
  const currentPrice = values[values.length - 1];
  const trend = determineTrendFromSlope(slope, currentPrice);

  // Predicted price at the last data point
  const predictedPrice = slope * (values.length - 1) + intercept;

  return {
    slope,
    intercept,
    rSquared,
    trend,
    predictedPrice,
  };
}

/**
 * Full trend analysis across multiple time periods
 */
export function analyzeTrends(data: DataPoint[]): TrendAnalysis {
  const values = data.map(d => d.value);

  // Short-term: last 7-14 days
  const shortTermValues = values.slice(-14);
  const shortTerm = analyzePeriod(shortTermValues);

  // Medium-term: last 30 days
  const mediumTermValues = values.slice(-30);
  const mediumTerm = analyzePeriod(mediumTermValues);

  // Long-term: all available data (up to 90 days)
  const longTermValues = values.slice(-90);
  const longTerm = analyzePeriod(longTermValues);

  // Determine overall trend (weighted by R-squared)
  const trends = [
    { trend: shortTerm.trend, weight: shortTerm.rSquared * 0.5 },
    { trend: mediumTerm.trend, weight: mediumTerm.rSquared * 0.3 },
    { trend: longTerm.trend, weight: longTerm.rSquared * 0.2 },
  ];

  const trendScores = { UP: 0, DOWN: 0, STABLE: 0 };
  for (const t of trends) {
    trendScores[t.trend] += t.weight;
  }

  const overallTrend = Object.entries(trendScores)
    .sort((a, b) => b[1] - a[1])[0][0] as 'UP' | 'DOWN' | 'STABLE';

  // Confidence based on agreement between time periods and R-squared values
  const agreement = trends.filter(t => t.trend === overallTrend).length / 3;
  const avgRSquared = (shortTerm.rSquared + mediumTerm.rSquared + longTerm.rSquared) / 3;
  const confidence = (agreement * 50) + (avgRSquared * 50);

  return {
    shortTerm,
    mediumTerm,
    longTerm,
    overallTrend,
    confidence: Math.min(100, Math.max(0, confidence)),
  };
}

/**
 * Calculate rate of change (momentum)
 */
export function calculateROC(
  values: number[],
  period: number = 14
): number {
  if (values.length < period) {
    return 0;
  }

  const current = values[values.length - 1];
  const previous = values[values.length - period];

  if (previous === 0) return 0;

  return ((current - previous) / previous) * 100;
}
