import { describe, it, expect } from 'vitest';
import {
  calculateStandardDeviation,
  calculateCoefficientOfVariation,
  calculateDailyReturns,
  calculateReturnsVolatility,
  calculateATR,
  determineVolatilityLevel,
  calculatePriceRange,
  calculateConfidenceAdjustment,
  analyzeVolatility,
  calculatePredictionBounds,
  type DataPoint,
} from './volatility';

describe('calculateStandardDeviation', () => {
  it('calcula desvio padrão corretamente', () => {
    // Valores com média 10 e desvio padrão conhecido
    const values = [8, 9, 10, 11, 12];
    const stdDev = calculateStandardDeviation(values);

    // Desvio padrão amostral para [8,9,10,11,12] = sqrt(2.5) ≈ 1.58
    expect(stdDev).toBeCloseTo(1.58, 1);
  });

  it('retorna 0 para array com menos de 2 elementos', () => {
    expect(calculateStandardDeviation([100])).toBe(0);
    expect(calculateStandardDeviation([])).toBe(0);
  });

  it('retorna 0 para valores idênticos', () => {
    const values = [100, 100, 100, 100];
    expect(calculateStandardDeviation(values)).toBe(0);
  });

  it('aumenta com maior dispersão', () => {
    const lowVar = [98, 99, 100, 101, 102];
    const highVar = [80, 90, 100, 110, 120];

    const stdLow = calculateStandardDeviation(lowVar);
    const stdHigh = calculateStandardDeviation(highVar);

    expect(stdHigh).toBeGreaterThan(stdLow);
  });
});

describe('calculateCoefficientOfVariation', () => {
  it('calcula CV como percentual', () => {
    // CV = (StdDev / Mean) * 100
    const values = [100, 100, 100, 100, 100]; // Mean = 100, StdDev = 0
    expect(calculateCoefficientOfVariation(values)).toBe(0);
  });

  it('retorna 0 para array vazio', () => {
    expect(calculateCoefficientOfVariation([])).toBe(0);
  });

  it('retorna 0 quando média é 0', () => {
    const values = [-50, 50]; // Média = 0
    expect(calculateCoefficientOfVariation(values)).toBe(0);
  });

  it('é útil para comparar volatilidade entre preços diferentes', () => {
    // Mesmo CV para escalas diferentes
    const lowPrice = [10, 10.5, 9.5, 10.2, 9.8];
    const highPrice = [100, 105, 95, 102, 98];

    const cvLow = calculateCoefficientOfVariation(lowPrice);
    const cvHigh = calculateCoefficientOfVariation(highPrice);

    // CVs devem ser similares pois a variação relativa é similar
    expect(Math.abs(cvLow - cvHigh)).toBeLessThan(1);
  });
});

describe('calculateDailyReturns', () => {
  it('calcula retornos diários em percentual', () => {
    const values = [100, 105, 110]; // +5%, +4.76%
    const returns = calculateDailyReturns(values);

    expect(returns).toHaveLength(2);
    expect(returns[0]).toBeCloseTo(5, 1);
    expect(returns[1]).toBeCloseTo(4.76, 1);
  });

  it('calcula retornos negativos', () => {
    const values = [100, 95, 90];
    const returns = calculateDailyReturns(values);

    expect(returns[0]).toBeCloseTo(-5, 1);
    expect(returns[1]).toBeCloseTo(-5.26, 1);
  });

  it('retorna array vazio para menos de 2 valores', () => {
    expect(calculateDailyReturns([100])).toHaveLength(0);
    expect(calculateDailyReturns([])).toHaveLength(0);
  });

  it('ignora divisão por zero', () => {
    const values = [0, 100, 110];
    const returns = calculateDailyReturns(values);

    // Primeiro retorno é ignorado (divisão por 0)
    expect(returns).toHaveLength(1);
    expect(returns[0]).toBeCloseTo(10, 1);
  });
});

describe('calculateReturnsVolatility', () => {
  it('calcula volatilidade dos retornos', () => {
    const values = [100, 105, 100, 105, 100]; // Oscilação regular
    const volatility = calculateReturnsVolatility(values);

    expect(volatility).toBeGreaterThan(0);
  });

  it('retorna 0 para retornos constantes', () => {
    const values = [100, 110, 121, 133.1]; // Sempre +10%
    const volatility = calculateReturnsVolatility(values);

    // Pequena variação devido a arredondamento
    expect(volatility).toBeLessThan(1);
  });
});

describe('calculateATR', () => {
  it('calcula Average True Range', () => {
    const values = [100, 105, 103, 108, 106];
    const atr = calculateATR(values, 4);

    expect(atr).toBeGreaterThan(0);
  });

  it('retorna 0 para menos de 2 valores', () => {
    expect(calculateATR([100], 5)).toBe(0);
  });

  it('ATR maior para preços mais voláteis', () => {
    const stable = [100, 101, 100, 101, 100];
    const volatile = [100, 110, 95, 115, 90];

    const atrStable = calculateATR(stable, 4);
    const atrVolatile = calculateATR(volatile, 4);

    expect(atrVolatile).toBeGreaterThan(atrStable);
  });
});

describe('determineVolatilityLevel', () => {
  it('classifica LOW para CV < 3', () => {
    expect(determineVolatilityLevel(2)).toBe('LOW');
    expect(determineVolatilityLevel(0)).toBe('LOW');
  });

  it('classifica MEDIUM para 3 <= CV < 8', () => {
    expect(determineVolatilityLevel(3)).toBe('MEDIUM');
    expect(determineVolatilityLevel(5)).toBe('MEDIUM');
    expect(determineVolatilityLevel(7.9)).toBe('MEDIUM');
  });

  it('classifica HIGH para CV >= 8', () => {
    expect(determineVolatilityLevel(8)).toBe('HIGH');
    expect(determineVolatilityLevel(15)).toBe('HIGH');
  });
});

describe('calculatePriceRange', () => {
  it('calcula min, max e range', () => {
    const values = [100, 120, 80, 110, 90];
    const result = calculatePriceRange(values);

    expect(result.min).toBe(80);
    expect(result.max).toBe(120);
    expect(result.range).toBe(40);
  });

  it('calcula range percentual baseado na média', () => {
    const values = [100, 120, 80, 110, 90]; // Média = 100
    const result = calculatePriceRange(values);

    // Range 40, Média 100 = 40%
    expect(result.rangePercent).toBeCloseTo(40, 1);
  });

  it('retorna zeros para array vazio', () => {
    const result = calculatePriceRange([]);

    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.range).toBe(0);
    expect(result.rangePercent).toBe(0);
  });
});

describe('calculateConfidenceAdjustment', () => {
  it('retorna 1.0 para volatilidade LOW', () => {
    expect(calculateConfidenceAdjustment('LOW')).toBe(1.0);
  });

  it('retorna 0.85 para volatilidade MEDIUM', () => {
    expect(calculateConfidenceAdjustment('MEDIUM')).toBe(0.85);
  });

  it('retorna 0.65 para volatilidade HIGH', () => {
    expect(calculateConfidenceAdjustment('HIGH')).toBe(0.65);
  });
});

describe('analyzeVolatility', () => {
  it('retorna análise completa de volatilidade', () => {
    const data: DataPoint[] = [
      { date: new Date('2024-01-01'), value: 100 },
      { date: new Date('2024-01-02'), value: 102 },
      { date: new Date('2024-01-03'), value: 98 },
      { date: new Date('2024-01-04'), value: 101 },
      { date: new Date('2024-01-05'), value: 99 },
    ];

    const result = analyzeVolatility(data);

    expect(result).toHaveProperty('standardDeviation');
    expect(result).toHaveProperty('coefficientOfVariation');
    expect(result).toHaveProperty('averageTrueRange');
    expect(result).toHaveProperty('volatilityLevel');
    expect(result).toHaveProperty('priceRange');
  });

  it('classifica volatilidade corretamente', () => {
    // Dados estáveis
    const stableData: DataPoint[] = [];
    for (let i = 0; i < 30; i++) {
      stableData.push({
        date: new Date(2024, 0, i + 1),
        value: 100 + Math.random() * 2 - 1, // 99-101
      });
    }

    const result = analyzeVolatility(stableData);
    expect(result.volatilityLevel).toBe('LOW');
  });
});

describe('calculatePredictionBounds', () => {
  it('calcula limites de confiança para previsão', () => {
    const volatility = {
      standardDeviation: 5,
      coefficientOfVariation: 5,
      averageTrueRange: 3,
      volatilityLevel: 'MEDIUM' as const,
      priceRange: { min: 90, max: 110, range: 20, rangePercent: 20 },
    };

    const bounds = calculatePredictionBounds(100, volatility, 7, 0.95);

    expect(bounds.lower).toBeLessThan(100);
    expect(bounds.upper).toBeGreaterThan(100);
  });

  it('aumenta intervalo para horizonte maior', () => {
    const volatility = {
      standardDeviation: 5,
      coefficientOfVariation: 5,
      averageTrueRange: 3,
      volatilityLevel: 'MEDIUM' as const,
      priceRange: { min: 90, max: 110, range: 20, rangePercent: 20 },
    };

    const bounds7 = calculatePredictionBounds(100, volatility, 7, 0.95);
    const bounds30 = calculatePredictionBounds(100, volatility, 30, 0.95);

    const interval7 = bounds7.upper - bounds7.lower;
    const interval30 = bounds30.upper - bounds30.lower;

    expect(interval30).toBeGreaterThan(interval7);
  });

  it('não permite limite inferior negativo', () => {
    const volatility = {
      standardDeviation: 100, // Volatilidade muito alta
      coefficientOfVariation: 50,
      averageTrueRange: 50,
      volatilityLevel: 'HIGH' as const,
      priceRange: { min: 50, max: 150, range: 100, rangePercent: 100 },
    };

    const bounds = calculatePredictionBounds(50, volatility, 30, 0.95);

    expect(bounds.lower).toBeGreaterThanOrEqual(0);
  });
});
