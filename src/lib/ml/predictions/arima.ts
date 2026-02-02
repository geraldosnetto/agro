/**
 * ARIMA (Autoregressive Integrated Moving Average) Implementation
 *
 * Simplified ARIMA for commodity price prediction.
 * Uses AR(p), I(d), MA(q) components.
 */

export interface DataPoint {
    date: Date;
    value: number;
}

export interface ARIMAResult {
    predictions: number[];
    residuals: number[];
    params: {
        p: number; // AR order
        d: number; // Differencing order
        q: number; // MA order
    };
    aic: number; // Akaike Information Criterion (lower is better)
}

/**
 * Calculate differences of a series
 * Makes non-stationary data stationary
 */
export function difference(values: number[], order: number = 1): number[] {
    if (order === 0 || values.length < 2) return [...values];

    let result = [...values];
    for (let d = 0; d < order; d++) {
        const diffed: number[] = [];
        for (let i = 1; i < result.length; i++) {
            diffed.push(result[i] - result[i - 1]);
        }
        result = diffed;
    }
    return result;
}

/**
 * Reverse differencing to get back to original scale
 */
export function inverseDifference(
    predictions: number[],
    lastValues: number[],
    order: number = 1
): number[] {
    if (order === 0) return predictions;

    let result = [...predictions];

    for (let d = order - 1; d >= 0; d--) {
        const lastValue = lastValues[d];
        const undiffed: number[] = [];
        let cumulative = lastValue;

        for (const pred of result) {
            cumulative = cumulative + pred;
            undiffed.push(cumulative);
        }
        result = undiffed;
    }

    return result;
}

/**
 * Calculate autocorrelation at lag k
 */
export function autocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        denominator += (values[i] - mean) ** 2;
        if (i >= lag) {
            numerator += (values[i] - mean) * (values[i - lag] - mean);
        }
    }

    return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Estimate AR coefficients using Yule-Walker equations (simplified)
 */
function estimateARCoefficients(values: number[], p: number): number[] {
    if (p === 0 || values.length < p + 1) return [];

    // Simplified: use autocorrelations as coefficients (Yule-Walker approximation)
    const coeffs: number[] = [];
    for (let i = 1; i <= p; i++) {
        const acf = autocorrelation(values, i);
        // Dampen coefficients for stability
        coeffs.push(acf * Math.pow(0.9, i));
    }

    // Normalize to ensure stability (sum of abs coeffs < 1)
    const absSum = coeffs.reduce((sum, c) => sum + Math.abs(c), 0);
    if (absSum >= 1) {
        return coeffs.map(c => (c / absSum) * 0.9);
    }

    return coeffs;
}

/**
 * Calculate residuals for MA estimation
 */
function calculateResiduals(
    values: number[],
    arCoeffs: number[]
): number[] {
    const residuals: number[] = [];
    const p = arCoeffs.length;

    for (let i = 0; i < values.length; i++) {
        if (i < p) {
            residuals.push(0);
            continue;
        }

        let predicted = 0;
        for (let j = 0; j < p; j++) {
            predicted += arCoeffs[j] * values[i - j - 1];
        }
        residuals.push(values[i] - predicted);
    }

    return residuals;
}

/**
 * Estimate MA coefficients from residuals (simplified)
 */
function estimateMACoefficients(residuals: number[], q: number): number[] {
    if (q === 0 || residuals.length < q + 1) return [];

    const coeffs: number[] = [];
    for (let i = 1; i <= q; i++) {
        const acf = autocorrelation(residuals, i);
        coeffs.push(acf * Math.pow(0.8, i));
    }

    return coeffs;
}

/**
 * Determine optimal differencing order using ADF-like test
 */
export function findOptimalDifferencing(values: number[], maxD: number = 2): number {
    // Simple stationarity check: variance of differences should be smaller
    for (let d = 0; d <= maxD; d++) {
        const diffed = difference(values, d);
        if (diffed.length < 10) return d;

        // Check if variance is relatively stable
        const firstHalf = diffed.slice(0, Math.floor(diffed.length / 2));
        const secondHalf = diffed.slice(Math.floor(diffed.length / 2));

        const var1 = calculateVariance(firstHalf);
        const var2 = calculateVariance(secondHalf);

        // If variances are similar, data is likely stationary
        if (var1 > 0 && var2 > 0) {
            const ratio = Math.max(var1, var2) / Math.min(var1, var2);
            if (ratio < 2) return d;
        }
    }

    return 1; // Default to first differencing
}

function calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

/**
 * Calculate AIC for model selection
 */
function calculateAIC(residuals: number[], numParams: number): number {
    const n = residuals.length;
    if (n === 0) return Infinity;

    const sse = residuals.reduce((sum, r) => sum + r ** 2, 0);
    const sigma2 = sse / n;

    if (sigma2 <= 0) return Infinity;

    return n * Math.log(sigma2) + 2 * numParams;
}

/**
 * Fit ARIMA model and generate predictions
 */
export function fitARIMA(
    values: number[],
    p: number = 2,
    d: number = 1,
    q: number = 1
): ARIMAResult {
    // Apply differencing
    const diffed = difference(values, d);

    if (diffed.length < Math.max(p, q) + 2) {
        // Not enough data, return simple prediction
        return {
            predictions: [],
            residuals: [],
            params: { p, d, q },
            aic: Infinity,
        };
    }

    // Estimate AR coefficients
    const arCoeffs = estimateARCoefficients(diffed, p);

    // Calculate residuals
    const residuals = calculateResiduals(diffed, arCoeffs);

    // Estimate MA coefficients
    const maCoeffs = estimateMACoefficients(residuals, q);

    // Calculate AIC
    const aic = calculateAIC(residuals, p + q + 1);

    return {
        predictions: [],
        residuals,
        params: { p, d, q },
        aic,
    };
}

/**
 * Generate multi-step forecast using ARIMA
 */
export function predictWithARIMA(
    data: DataPoint[],
    daysAhead: number,
    p: number = 2,
    d: number = 1,
    q: number = 1
): number[] {
    const values = data.map(d => d.value);

    if (values.length < 10) {
        // Not enough data, repeat last value
        return Array(daysAhead).fill(values[values.length - 1] || 0);
    }

    // Find optimal differencing if not specified
    const optimalD = d < 0 ? findOptimalDifferencing(values) : d;

    // Apply differencing
    const diffed = difference(values, optimalD);

    // Estimate AR coefficients
    const arCoeffs = estimateARCoefficients(diffed, p);

    // Calculate residuals for MA
    const residuals = calculateResiduals(diffed, arCoeffs);
    const maCoeffs = estimateMACoefficients(residuals, q);

    // Generate predictions in differenced space
    const predictions: number[] = [];
    const extendedDiffed = [...diffed];
    const extendedResiduals = [...residuals];

    for (let i = 0; i < daysAhead; i++) {
        let pred = 0;

        // AR component
        for (let j = 0; j < arCoeffs.length; j++) {
            const idx = extendedDiffed.length - j - 1;
            if (idx >= 0) {
                pred += arCoeffs[j] * extendedDiffed[idx];
            }
        }

        // MA component
        for (let j = 0; j < maCoeffs.length; j++) {
            const idx = extendedResiduals.length - j - 1;
            if (idx >= 0) {
                pred += maCoeffs[j] * extendedResiduals[idx];
            }
        }

        predictions.push(pred);
        extendedDiffed.push(pred);
        extendedResiduals.push(0); // Future residuals are assumed to be 0
    }

    // Inverse differencing to get back to price levels
    const lastValues: number[] = [];
    let tempValues = [...values];
    for (let i = 0; i < optimalD; i++) {
        lastValues.push(tempValues[tempValues.length - 1]);
        tempValues = difference(tempValues, 1);
    }
    lastValues.reverse();

    const finalPredictions = inverseDifference(predictions, [values[values.length - 1]], optimalD);

    // Bound predictions to reasonable range
    const currentPrice = values[values.length - 1];
    return finalPredictions.map(p =>
        Math.max(currentPrice * 0.5, Math.min(currentPrice * 1.5, p))
    );
}

/**
 * Get single-point ARIMA prediction for specific horizon
 */
export function predictARIMA(
    data: DataPoint[],
    daysAhead: number
): number {
    const predictions = predictWithARIMA(data, daysAhead);
    return predictions[predictions.length - 1] || data[data.length - 1]?.value || 0;
}

/**
 * Auto-select best ARIMA parameters based on AIC
 */
export function autoARIMA(
    values: number[],
    maxP: number = 3,
    maxD: number = 2,
    maxQ: number = 2
): { p: number; d: number; q: number; aic: number } {
    let bestAIC = Infinity;
    let bestParams = { p: 1, d: 1, q: 1 };

    // Find optimal d first
    const optimalD = findOptimalDifferencing(values, maxD);

    // Grid search for p and q
    for (let p = 0; p <= maxP; p++) {
        for (let q = 0; q <= maxQ; q++) {
            if (p === 0 && q === 0) continue;

            const result = fitARIMA(values, p, optimalD, q);

            if (result.aic < bestAIC) {
                bestAIC = result.aic;
                bestParams = { p, d: optimalD, q };
            }
        }
    }

    return { ...bestParams, aic: bestAIC };
}
