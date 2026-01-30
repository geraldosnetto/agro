import { describe, it, expect } from 'vitest';
import {
  calculateSMA,
  calculateEMA,
  determineTrend,
  projectPriceWithEMA,
  analyzeMovingAverages,
  type DataPoint,
} from './moving-average';

describe('calculateSMA', () => {
  it('calcula média simples corretamente', () => {
    const values = [100, 102, 104, 106, 108];
    const sma = calculateSMA(values, 5);
    expect(sma).toBe(104); // (100+102+104+106+108)/5
  });

  it('usa apenas últimos N valores quando período é menor que array', () => {
    const values = [90, 92, 100, 102, 104, 106, 108];
    const sma = calculateSMA(values, 5);
    expect(sma).toBe(104); // Últimos 5: (100+102+104+106+108)/5
  });

  it('usa dados disponíveis quando menos que período', () => {
    const values = [100, 110, 120];
    const sma = calculateSMA(values, 10);
    expect(sma).toBe(110); // (100+110+120)/3
  });

  it('retorna valor único quando array tem um elemento', () => {
    const values = [50];
    const sma = calculateSMA(values, 5);
    expect(sma).toBe(50);
  });
});

describe('calculateEMA', () => {
  it('retorna 0 para array vazio', () => {
    expect(calculateEMA([], 5)).toBe(0);
  });

  it('retorna valor único para array de um elemento', () => {
    expect(calculateEMA([100], 5)).toBe(100);
  });

  it('calcula EMA com peso exponencial', () => {
    // EMA dá mais peso aos valores recentes
    // Usamos mais dados que o período para ver a diferença
    const values = [100, 100, 100, 100, 100, 100, 100, 150]; // 8 valores, spike no final
    const ema = calculateEMA(values, 5);

    // EMA começa como SMA dos primeiros 5, depois aplica peso exponencial
    // Valor deve estar entre 100 (média inicial) e 150 (último valor)
    expect(ema).toBeGreaterThan(100);
    expect(ema).toBeLessThan(150);
  });

  it('responde mais rápido a mudanças que SMA', () => {
    const values = [100, 100, 100, 100, 100, 110, 120, 130];
    const ema = calculateEMA(values, 5);
    const sma = calculateSMA(values, 5);

    // Com tendência de alta no final, EMA deve ser maior
    expect(ema).toBeGreaterThan(sma);
  });
});

describe('determineTrend', () => {
  it('retorna UP quando MA curta > MA longa', () => {
    const result = determineTrend(110, 100, 0.02);
    expect(result.trend).toBe('UP');
  });

  it('retorna DOWN quando MA curta < MA longa', () => {
    const result = determineTrend(90, 100, 0.02);
    expect(result.trend).toBe('DOWN');
  });

  it('retorna STABLE quando diferença está dentro do limiar', () => {
    const result = determineTrend(101, 100, 0.02);
    expect(result.trend).toBe('STABLE');
  });

  it('retorna STABLE quando MA longa é 0', () => {
    const result = determineTrend(100, 0, 0.02);
    expect(result.trend).toBe('STABLE');
    expect(result.strength).toBe(0);
  });

  it('calcula força da tendência corretamente', () => {
    // Diferença de 10% deve ter força alta
    const result = determineTrend(110, 100, 0.02);
    expect(result.strength).toBeGreaterThan(0);
    expect(result.strength).toBeLessThanOrEqual(100);
  });
});

describe('projectPriceWithEMA', () => {
  it('projeta preço para o futuro usando momentum', () => {
    // Tendência de alta
    const values = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120];
    const projected = projectPriceWithEMA(values, 7);

    // Projeção deve ser maior que preço atual
    expect(projected).toBeGreaterThan(120);
  });

  it('projeta queda para tendência negativa', () => {
    const values = [120, 118, 116, 114, 112, 110, 108, 106, 104, 102, 100];
    const projected = projectPriceWithEMA(values, 7);

    // Projeção deve ser menor que preço atual
    expect(projected).toBeLessThan(100);
  });

  it('não permite preço menor que 50% do atual', () => {
    // Queda muito acentuada
    const values = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5];
    const projected = projectPriceWithEMA(values, 30);

    // Mínimo é 50% do valor atual
    expect(projected).toBeGreaterThanOrEqual(5 * 0.5);
  });

  it('retorna último valor quando array tem menos de 2 elementos', () => {
    expect(projectPriceWithEMA([100], 7)).toBe(100);
    expect(projectPriceWithEMA([], 7)).toBe(0);
  });
});

describe('analyzeMovingAverages', () => {
  it('retorna análise completa de médias móveis', () => {
    const data: DataPoint[] = [];
    const startDate = new Date('2024-01-01');

    // Tendência de alta
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({ date, value: 100 + i });
    }

    const result = analyzeMovingAverages(data);

    expect(result).toHaveProperty('sma');
    expect(result).toHaveProperty('ema');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('trendStrength');
    expect(result.trend).toBe('UP');
  });

  it('detecta tendência de baixa', () => {
    const data: DataPoint[] = [];
    const startDate = new Date('2024-01-01');

    // Tendência de baixa
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({ date, value: 130 - i });
    }

    const result = analyzeMovingAverages(data);
    expect(result.trend).toBe('DOWN');
  });

  it('detecta mercado estável', () => {
    const data: DataPoint[] = [];
    const startDate = new Date('2024-01-01');

    // Preços estáveis
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({ date, value: 100 + (Math.random() - 0.5) });
    }

    const result = analyzeMovingAverages(data);
    expect(result.trend).toBe('STABLE');
  });
});
