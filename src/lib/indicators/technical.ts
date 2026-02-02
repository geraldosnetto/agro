/**
 * Funções para cálculo de indicadores técnicos
 */

export interface OHLC {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface ChartDataPoint {
    date: string;
    valor: number;
    sma20?: number;
    sma50?: number;
    ema12?: number;
    ema26?: number;
    bollingerUpper?: number;
    bollingerMiddle?: number;
    bollingerLower?: number;
    rsi?: number;
    macd?: number;
    macdSignal?: number;
    macdHistogram?: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }

    return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA for first value
    let ema: number | null = null;

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            // First EMA is SMA
            ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
            result.push(ema);
        } else {
            ema = (data[i] - ema!) * multiplier + ema!;
            result.push(ema);
        }
    }

    return result;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
    data: number[],
    period: number = 20,
    stdDev: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
    const middle = calculateSMA(data, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            upper.push(null);
            lower.push(null);
        } else {
            const slice = data.slice(i - period + 1, i + 1);
            const avg = middle[i]!;
            const variance = slice.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / period;
            const std = Math.sqrt(variance);

            upper.push(avg + stdDev * std);
            lower.push(avg - stdDev * std);
        }
    }

    return { upper, middle, lower };
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = [];
    const changes: number[] = [];

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
        changes.push(data[i] - data[i - 1]);
    }

    // Need at least 'period' changes
    for (let i = 0; i < period; i++) {
        result.push(null);
    }

    // Calculate initial average gain/loss
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) {
            avgGain += changes[i];
        } else {
            avgLoss += Math.abs(changes[i]);
        }
    }

    avgGain /= period;
    avgLoss /= period;

    // First RSI
    const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + firstRS));

    // Subsequent RSI values using smoothed averages
    for (let i = period; i < changes.length; i++) {
        const change = changes[i];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
    }

    return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
    data: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);

    // MACD line = Fast EMA - Slow EMA
    const macdLine: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (emaFast[i] === null || emaSlow[i] === null) {
            macdLine.push(null);
        } else {
            macdLine.push(emaFast[i]! - emaSlow[i]!);
        }
    }

    // Signal line = EMA of MACD
    const validMacd = macdLine.filter(v => v !== null) as number[];
    const signalEma = calculateEMA(validMacd, signalPeriod);

    // Map signal back to full array
    const signal: (number | null)[] = [];
    let signalIdx = 0;
    for (let i = 0; i < data.length; i++) {
        if (macdLine[i] === null) {
            signal.push(null);
        } else {
            signal.push(signalEma[signalIdx++] ?? null);
        }
    }

    // Histogram = MACD - Signal
    const histogram: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (macdLine[i] === null || signal[i] === null) {
            histogram.push(null);
        } else {
            histogram.push(macdLine[i]! - signal[i]!);
        }
    }

    return { macd: macdLine, signal, histogram };
}

/**
 * Apply all indicators to chart data
 */
export function applyIndicators(
    data: { date: string; valor: number }[],
    options: {
        sma20?: boolean;
        sma50?: boolean;
        ema12?: boolean;
        ema26?: boolean;
        bollinger?: boolean;
        rsi?: boolean;
        macd?: boolean;
    } = {}
): ChartDataPoint[] {
    const values = data.map(d => d.valor);

    const sma20 = options.sma20 ? calculateSMA(values, 20) : [];
    const sma50 = options.sma50 ? calculateSMA(values, 50) : [];
    const ema12 = options.ema12 ? calculateEMA(values, 12) : [];
    const ema26 = options.ema26 ? calculateEMA(values, 26) : [];
    const bollinger = options.bollinger ? calculateBollingerBands(values) : null;
    const rsi = options.rsi ? calculateRSI(values) : [];
    const macd = options.macd ? calculateMACD(values) : null;

    return data.map((d, i) => ({
        date: d.date,
        valor: d.valor,
        ...(options.sma20 && { sma20: sma20[i] ?? undefined }),
        ...(options.sma50 && { sma50: sma50[i] ?? undefined }),
        ...(options.ema12 && { ema12: ema12[i] ?? undefined }),
        ...(options.ema26 && { ema26: ema26[i] ?? undefined }),
        ...(options.bollinger && {
            bollingerUpper: bollinger?.upper[i] ?? undefined,
            bollingerMiddle: bollinger?.middle[i] ?? undefined,
            bollingerLower: bollinger?.lower[i] ?? undefined,
        }),
        ...(options.rsi && { rsi: rsi[i] ?? undefined }),
        ...(options.macd && {
            macd: macd?.macd[i] ?? undefined,
            macdSignal: macd?.signal[i] ?? undefined,
            macdHistogram: macd?.histogram[i] ?? undefined,
        }),
    }));
}

/**
 * Get RSI interpretation
 */
export function getRSIInterpretation(rsi: number): { label: string; color: string } {
    if (rsi >= 70) return { label: 'Sobrecomprado', color: 'text-red-500' };
    if (rsi <= 30) return { label: 'Sobrevendido', color: 'text-green-500' };
    return { label: 'Neutro', color: 'text-muted-foreground' };
}

/**
 * Get MACD interpretation
 */
export function getMACDInterpretation(macd: number, signal: number): { label: string; color: string } {
    if (macd > signal) return { label: 'Bullish', color: 'text-green-500' };
    if (macd < signal) return { label: 'Bearish', color: 'text-red-500' };
    return { label: 'Neutro', color: 'text-muted-foreground' };
}
