import { describe, it, expect } from 'vitest';
import {
  linearRegression,
  projectPrice,
  determineTrendFromSlope,
  analyzePeriod,
  analyzeTrends,
  calculateROC,
  type DataPoint,
} from './trend-analysis';

describe('linearRegression', () => {
  it('calcula regressão linear para tendência de alta perfeita', () => {
    // y = 2x + 100 (aumento de 2 por dia)
    const values = [100, 102, 104, 106, 108];
    const result = linearRegression(values);

    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(100, 5);
    expect(result.rSquared).toBeCloseTo(1, 5); // R² = 1 para linha perfeita
  });

  it('calcula regressão linear para tendência de baixa', () => {
    const values = [110, 108, 106, 104, 102];
    const result = linearRegression(values);

    expect(result.slope).toBeCloseTo(-2, 5);
    expect(result.rSquared).toBeCloseTo(1, 5);
  });

  it('retorna R² baixo para dados com muito ruído', () => {
    const values = [100, 150, 90, 140, 95, 130, 85];
    const result = linearRegression(values);

    // R² deve ser baixo pois dados são aleatórios
    expect(result.rSquared).toBeLessThan(0.5);
  });

  it('lida com array de um elemento', () => {
    const result = linearRegression([100]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(100);
    expect(result.rSquared).toBe(0);
  });

  it('lida com array vazio', () => {
    const result = linearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.rSquared).toBe(0);
  });

  it('mantém R² entre 0 e 1', () => {
    const values = [100, 105, 103, 108, 106, 110];
    const result = linearRegression(values);

    expect(result.rSquared).toBeGreaterThanOrEqual(0);
    expect(result.rSquared).toBeLessThanOrEqual(1);
  });
});

describe('projectPrice', () => {
  it('projeta preço futuro usando regressão linear', () => {
    // Tendência de alta: +2 por dia
    const values = [100, 102, 104, 106, 108];
    const projected = projectPrice(values, 5);

    // Dia 4 = 108, projeção para dia 9 = 108 + 5*2 = 118
    expect(projected).toBeCloseTo(118, 0);
  });

  it('limita projeção a 50% de queda máxima', () => {
    const values = [100, 90, 80, 70, 60]; // Queda de 10 por dia
    const projected = projectPrice(values, 10);

    // Não deve cair mais que 50% do preço atual (60)
    expect(projected).toBeGreaterThanOrEqual(30);
  });

  it('limita projeção a 100% de alta máxima', () => {
    const values = [100, 110, 120, 130, 140]; // Alta de 10 por dia
    const projected = projectPrice(values, 20);

    // Não deve subir mais que 100% do preço atual (140)
    expect(projected).toBeLessThanOrEqual(280);
  });
});

describe('determineTrendFromSlope', () => {
  it('retorna UP para inclinação positiva significativa', () => {
    // 0.5% do preço por dia = significativo
    const trend = determineTrendFromSlope(0.5, 100, 0.001);
    expect(trend).toBe('UP');
  });

  it('retorna DOWN para inclinação negativa significativa', () => {
    const trend = determineTrendFromSlope(-0.5, 100, 0.001);
    expect(trend).toBe('DOWN');
  });

  it('retorna STABLE para inclinação pequena', () => {
    const trend = determineTrendFromSlope(0.05, 100, 0.001);
    expect(trend).toBe('STABLE');
  });
});

describe('analyzePeriod', () => {
  it('analisa período com tendência de alta', () => {
    const values = [100, 102, 104, 106, 108, 110, 112];
    const result = analyzePeriod(values);

    expect(result.trend).toBe('UP');
    expect(result.slope).toBeGreaterThan(0);
    expect(result.rSquared).toBeGreaterThan(0.9);
  });

  it('analisa período com tendência de baixa', () => {
    const values = [112, 110, 108, 106, 104, 102, 100];
    const result = analyzePeriod(values);

    expect(result.trend).toBe('DOWN');
    expect(result.slope).toBeLessThan(0);
  });

  it('retorna valores padrão para array vazio', () => {
    const result = analyzePeriod([]);

    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.rSquared).toBe(0);
    expect(result.trend).toBe('STABLE');
    expect(result.predictedPrice).toBe(0);
  });
});

describe('analyzeTrends', () => {
  it('analisa tendências em múltiplos períodos', () => {
    const data: DataPoint[] = [];
    const startDate = new Date('2024-01-01');

    // 90 dias de tendência de alta
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({ date, value: 100 + i * 0.5 });
    }

    const result = analyzeTrends(data);

    expect(result.shortTerm.trend).toBe('UP');
    expect(result.mediumTerm.trend).toBe('UP');
    expect(result.longTerm.trend).toBe('UP');
    expect(result.overallTrend).toBe('UP');
    expect(result.confidence).toBeGreaterThan(50);
  });

  it('calcula confiança baseada em acordo entre períodos', () => {
    const data: DataPoint[] = [];
    const startDate = new Date('2024-01-01');

    // Dados com alta confiança (tendência clara)
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({ date, value: 100 + i }); // Tendência perfeita
    }

    const result = analyzeTrends(data);

    // Deve ter alta confiança quando todos os períodos concordam
    expect(result.confidence).toBeGreaterThan(70);
  });
});

describe('calculateROC', () => {
  it('calcula taxa de mudança percentual', () => {
    // Com 5 valores e período 4: compara values[4] com values[1]
    // 120 vs 105 = ((120-105)/105)*100 = 14.28%
    const values = [100, 105, 110, 115, 120];
    const roc = calculateROC(values, 4);

    expect(roc).toBeCloseTo(14.28, 1);
  });

  it('calcula ROC negativo para quedas', () => {
    // Com 5 valores e período 4: compara values[4] com values[1]
    // 100 vs 115 = ((100-115)/115)*100 = -13.04%
    const values = [120, 115, 110, 105, 100];
    const roc = calculateROC(values, 4);

    expect(roc).toBeCloseTo(-13.04, 1);
  });

  it('retorna 0 quando período maior que dados', () => {
    const values = [100, 110, 120];
    const roc = calculateROC(values, 10);

    expect(roc).toBe(0);
  });

  it('lida com valor anterior igual a 0', () => {
    // Para previous = 0, precisamos values[length - period] = 0
    // Com values = [0, 100] e period = 2: previous = values[2-2] = values[0] = 0
    const values = [0, 100];
    const roc = calculateROC(values, 2);

    // A implementação retorna 0 quando previous === 0 (evita divisão por 0)
    expect(roc).toBe(0);
  });
});
