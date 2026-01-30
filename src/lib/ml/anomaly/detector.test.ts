import { describe, it, expect } from 'vitest';
import { detectAnomalies, formatExpectedRange, type PriceDataPoint } from './detector';

/**
 * Helper para gerar série de preços com tendência estável
 */
function generateStableData(basePrice: number, days: number, variance = 0.02): PriceDataPoint[] {
  const data: PriceDataPoint[] = [];
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    // Variação aleatória de +/- variance%
    const randomFactor = 1 + (Math.random() - 0.5) * variance;
    data.push({
      date,
      value: basePrice * randomFactor,
    });
  }

  return data;
}

describe('detectAnomalies', () => {
  describe('com dados insuficientes', () => {
    it('retorna array vazio quando há menos de 14 pontos', () => {
      const data = generateStableData(100, 10);
      const anomalies = detectAnomalies(data);
      expect(anomalies).toHaveLength(0);
    });

    it('retorna array vazio com array vazio', () => {
      const anomalies = detectAnomalies([]);
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('detecção de Z-score', () => {
    it('detecta PRICE_SPIKE quando preço está muito acima da média', () => {
      // 20 dias de preço estável em 100, depois spike para 130
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 + Math.random() * 2 }); // 100-102
      }

      // Spike no último dia
      const spikeDate = new Date(startDate);
      spikeDate.setDate(spikeDate.getDate() + 20);
      data.push({ date: spikeDate, value: 130 });

      const anomalies = detectAnomalies(data);
      const spike = anomalies.find(a => a.type === 'PRICE_SPIKE');

      expect(spike).toBeDefined();
      expect(spike?.severity).toBe('HIGH');
      expect(spike?.deviationPercent).toBeGreaterThan(0);
    });

    it('detecta PRICE_DROP quando preço está muito abaixo da média', () => {
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 + Math.random() * 2 });
      }

      // Drop no último dia
      const dropDate = new Date(startDate);
      dropDate.setDate(dropDate.getDate() + 20);
      data.push({ date: dropDate, value: 70 });

      const anomalies = detectAnomalies(data);
      const drop = anomalies.find(a => a.type === 'PRICE_DROP');

      expect(drop).toBeDefined();
      expect(drop?.severity).toBe('HIGH');
      expect(drop?.deviationPercent).toBeLessThan(0);
    });
  });

  describe('detecção de variação diária', () => {
    it('detecta variação diária extrema (>8%)', () => {
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      // 14 dias estáveis
      for (let i = 0; i < 14; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 });
      }

      // Dia com variação de 10%
      const lastDate = new Date(startDate);
      lastDate.setDate(lastDate.getDate() + 14);
      data.push({ date: lastDate, value: 110 });

      const anomalies = detectAnomalies(data);
      const spike = anomalies.find(a => a.type === 'PRICE_SPIKE');

      expect(spike).toBeDefined();
      // O algoritmo detecta por Z-score ou por variação diária
      // A descrição pode variar dependendo de qual método detectou
      expect(spike?.severity).toBe('HIGH');
    });
  });

  describe('detecção de máximos/mínimos históricos', () => {
    it('detecta HISTORICAL_HIGH quando preço é o maior do período', () => {
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 + i * 0.1 }); // Ligeira tendência de alta
      }

      // Último dia é a máxima
      const anomalies = detectAnomalies(data);
      const high = anomalies.find(a => a.type === 'HISTORICAL_HIGH');

      expect(high).toBeDefined();
      expect(high?.severity).toBe('MEDIUM');
      expect(high?.description).toContain('máxima histórica');
    });

    it('detecta HISTORICAL_LOW quando preço é o menor do período', () => {
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 - i * 0.1 }); // Ligeira tendência de baixa
      }

      const anomalies = detectAnomalies(data);
      const low = anomalies.find(a => a.type === 'HISTORICAL_LOW');

      expect(low).toBeDefined();
      expect(low?.severity).toBe('MEDIUM');
      expect(low?.description).toContain('mínima histórica');
    });
  });

  describe('detecção de volatilidade', () => {
    it('detecta HIGH_VOLATILITY quando volatilidade recente é muito maior que histórica', () => {
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      // 30 dias estáveis
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 + Math.random() * 1 }); // Variação de 1%
      }

      // 7 dias voláteis
      for (let i = 30; i < 37; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 + Math.random() * 20 - 10 }); // Variação de 20%
      }

      const anomalies = detectAnomalies(data);
      const volatility = anomalies.find(a => a.type === 'HIGH_VOLATILITY');

      expect(volatility).toBeDefined();
      expect(volatility?.description).toContain('Volatilidade');
    });
  });

  describe('configuração customizada', () => {
    it('aceita configuração customizada', () => {
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      // Criar 20 dias de dados estáveis
      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 });
      }

      // Grande spike de 10%
      const lastDate = new Date(startDate);
      lastDate.setDate(lastDate.getDate() + 20);
      data.push({ date: lastDate, value: 110 });

      // Com configuração padrão, deve detectar spike
      const anomaliesDefault = detectAnomalies(data);
      expect(anomaliesDefault.some(a => a.type === 'PRICE_SPIKE')).toBe(true);

      // Com limiar de Z-score muito alto, não deve detectar por Z-score
      const anomaliesCustom = detectAnomalies(data, {
        zScoreThresholds: { low: 10, medium: 15, high: 20 }, // Limiares muito altos
        dailyChangeThresholds: { low: 15, medium: 20, high: 25 }, // Limiares muito altos
      });

      // Ainda pode detectar HISTORICAL_HIGH (não afetado por limiares customizados)
      // mas não deve detectar PRICE_SPIKE por Z-score ou variação diária
      const spikeAnomalies = anomaliesCustom.filter(a =>
        a.type === 'PRICE_SPIKE' &&
        (a.description.includes('acima da média') || a.description.includes('em um dia'))
      );
      expect(spikeAnomalies).toHaveLength(0);
    });
  });

  describe('deduplicação de anomalias', () => {
    it('mantém apenas a anomalia de maior severidade por tipo', () => {
      // Este teste verifica que quando há múltiplas detecções do mesmo tipo,
      // apenas a de maior severidade é mantida
      const data: PriceDataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({ date, value: 100 });
      }

      // Grande spike que será detectado por Z-score E por variação diária
      const lastDate = new Date(startDate);
      lastDate.setDate(lastDate.getDate() + 20);
      data.push({ date: lastDate, value: 150 });

      const anomalies = detectAnomalies(data);

      // Deve ter no máximo uma anomalia PRICE_SPIKE
      const spikes = anomalies.filter(a => a.type === 'PRICE_SPIKE');
      expect(spikes).toHaveLength(1);
    });
  });
});

describe('formatExpectedRange', () => {
  it('formata range com duas casas decimais', () => {
    const result = formatExpectedRange({ min: 99.5, max: 100.5 });
    expect(result).toBe('R$ 99.50 - R$ 100.50');
  });

  it('formata valores grandes corretamente', () => {
    const result = formatExpectedRange({ min: 1234.56, max: 5678.90 });
    expect(result).toBe('R$ 1234.56 - R$ 5678.90');
  });

  it('formata valores pequenos corretamente', () => {
    const result = formatExpectedRange({ min: 0.01, max: 0.05 });
    expect(result).toBe('R$ 0.01 - R$ 0.05');
  });
});
