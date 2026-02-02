/**
 * Holt-Winters Exponential Smoothing (ETS)
 *
 * Triple exponential smoothing with:
 * - Level (α)
 * - Trend (β)
 * - Seasonality (γ) - Weekly cycle for commodity prices
 */

export interface DataPoint {
    date: Date;
    value: number;
}

export interface HoltWintersParams {
    alpha: number;  // Level smoothing (0-1)
    beta: number;   // Trend smoothing (0-1)
    gamma: number;  // Seasonal smoothing (0-1)
    seasonalPeriod: number; // e.g., 7 for weekly
}

export interface HoltWintersResult {
    level: number;
    trend: number;
    seasonal: number[];
    fitted: number[];
    params: HoltWintersParams;
    mse: number;
}

const DEFAULT_PARAMS: HoltWintersParams = {
    alpha: 0.3,
    beta: 0.1,
    gamma: 0.2,
    seasonalPeriod: 7, // Weekly seasonality
};

/**
 * Initialize seasonal factors using ratio-to-trend method
 */
function initializeSeasonalFactors(
    values: number[],
    period: number
): number[] {
    if (values.length < period * 2) {
        // Not enough data, return neutral factors
        return Array(period).fill(1);
    }

    const seasonal: number[] = [];
    const nPeriods = Math.floor(values.length / period);

    // Calculate seasonal indices for each position
    for (let i = 0; i < period; i++) {
        let sum = 0;
        let count = 0;

        for (let j = 0; j < nPeriods; j++) {
            const idx = j * period + i;
            if (idx < values.length) {
                // Calculate average for this period
                const periodStart = j * period;
                const periodEnd = Math.min(periodStart + period, values.length);
                const periodAvg = values.slice(periodStart, periodEnd)
                    .reduce((a, b) => a + b, 0) / (periodEnd - periodStart);

                if (periodAvg > 0) {
                    sum += values[idx] / periodAvg;
                    count++;
                }
            }
        }

        seasonal.push(count > 0 ? sum / count : 1);
    }

    // Normalize so seasonal factors sum to period
    const seasonalSum = seasonal.reduce((a, b) => a + b, 0);
    return seasonal.map(s => (s / seasonalSum) * period);
}

/**
 * Fit Holt-Winters model to data
 */
export function fitHoltWinters(
    values: number[],
    params: HoltWintersParams = DEFAULT_PARAMS
): HoltWintersResult {
    const { alpha, beta, gamma, seasonalPeriod } = params;
    const n = values.length;

    if (n < seasonalPeriod) {
        // Not enough data, use simple average
        const avg = values.reduce((a, b) => a + b, 0) / n;
        return {
            level: avg,
            trend: 0,
            seasonal: Array(seasonalPeriod).fill(1),
            fitted: Array(n).fill(avg),
            params,
            mse: 0,
        };
    }

    // Initialize components
    // Level: average of first period
    let level = values.slice(0, seasonalPeriod).reduce((a, b) => a + b, 0) / seasonalPeriod;

    // Trend: average difference of first two periods
    let trend = 0;
    if (n >= seasonalPeriod * 2) {
        const firstPeriodAvg = values.slice(0, seasonalPeriod).reduce((a, b) => a + b, 0) / seasonalPeriod;
        const secondPeriodAvg = values.slice(seasonalPeriod, seasonalPeriod * 2).reduce((a, b) => a + b, 0) / seasonalPeriod;
        trend = (secondPeriodAvg - firstPeriodAvg) / seasonalPeriod;
    }

    // Initialize seasonal factors
    const seasonal = initializeSeasonalFactors(values, seasonalPeriod);

    // Fitted values and running calculations
    const fitted: number[] = [];
    let sse = 0;

    for (let i = 0; i < n; i++) {
        const seasonIdx = i % seasonalPeriod;
        const seasonalFactor = seasonal[seasonIdx];

        // One-step forecast
        const forecast = (level + trend) * seasonalFactor;
        fitted.push(forecast);

        if (i >= seasonalPeriod) {
            sse += (values[i] - forecast) ** 2;
        }

        // Update level
        const prevLevel = level;
        level = alpha * (values[i] / seasonalFactor) + (1 - alpha) * (level + trend);

        // Update trend
        trend = beta * (level - prevLevel) + (1 - beta) * trend;

        // Update seasonal factor
        seasonal[seasonIdx] = gamma * (values[i] / level) + (1 - gamma) * seasonalFactor;
    }

    const mse = n > seasonalPeriod ? sse / (n - seasonalPeriod) : 0;

    return {
        level,
        trend,
        seasonal: [...seasonal],
        fitted,
        params,
        mse,
    };
}

/**
 * Generate multi-step forecast using Holt-Winters
 */
export function predictWithHoltWinters(
    data: DataPoint[],
    daysAhead: number,
    params: HoltWintersParams = DEFAULT_PARAMS
): number[] {
    const values = data.map(d => d.value);

    if (values.length < 3) {
        const lastValue = values[values.length - 1] || 0;
        return Array(daysAhead).fill(lastValue);
    }

    // Use additive seasonality for commodity prices (simpler, more stable)
    const result = fitHoltWinters(values, params);

    const predictions: number[] = [];
    let { level, trend, seasonal } = result;
    const { seasonalPeriod } = params;

    const lastIndex = values.length - 1;

    for (let i = 1; i <= daysAhead; i++) {
        const seasonIdx = (lastIndex + i) % seasonalPeriod;
        const seasonalFactor = seasonal[seasonIdx];

        // Forecast
        const forecast = (level + trend * i) * seasonalFactor;

        // Bound prediction to reasonable range
        const currentPrice = values[values.length - 1];
        const boundedForecast = Math.max(
            currentPrice * 0.5,
            Math.min(currentPrice * 1.5, forecast)
        );

        predictions.push(boundedForecast);
    }

    return predictions;
}

/**
 * Get single-point Holt-Winters prediction for specific horizon
 */
export function predictHoltWinters(
    data: DataPoint[],
    daysAhead: number,
    params: HoltWintersParams = DEFAULT_PARAMS
): number {
    const predictions = predictWithHoltWinters(data, daysAhead, params);
    return predictions[predictions.length - 1] || data[data.length - 1]?.value || 0;
}

/**
 * Optimize Holt-Winters parameters using grid search
 */
export function optimizeHoltWinters(
    values: number[],
    seasonalPeriod: number = 7
): HoltWintersParams {
    let bestMSE = Infinity;
    let bestParams: HoltWintersParams = { ...DEFAULT_PARAMS, seasonalPeriod };

    // Grid search over parameter space
    const alphaRange = [0.1, 0.2, 0.3, 0.4, 0.5];
    const betaRange = [0.05, 0.1, 0.15, 0.2];
    const gammaRange = [0.1, 0.2, 0.3];

    for (const alpha of alphaRange) {
        for (const beta of betaRange) {
            for (const gamma of gammaRange) {
                const params: HoltWintersParams = { alpha, beta, gamma, seasonalPeriod };
                const result = fitHoltWinters(values, params);

                if (result.mse < bestMSE && isFinite(result.mse)) {
                    bestMSE = result.mse;
                    bestParams = params;
                }
            }
        }
    }

    return bestParams;
}

/**
 * Holt-Winters with automatic parameter optimization
 */
export function autoHoltWinters(
    data: DataPoint[],
    daysAhead: number
): number[] {
    const values = data.map(d => d.value);

    if (values.length < 14) {
        // Not enough data for optimization, use defaults
        return predictWithHoltWinters(data, daysAhead, DEFAULT_PARAMS);
    }

    // Optimize parameters
    const optimalParams = optimizeHoltWinters(values);

    return predictWithHoltWinters(data, daysAhead, optimalParams);
}
