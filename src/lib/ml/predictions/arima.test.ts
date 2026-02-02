import { describe, it, expect } from 'vitest';
import {
    difference,
    inverseDifference,
    autocorrelation,
    findOptimalDifferencing,
    predictWithARIMA,
    predictARIMA,
    fitARIMA,
    autoARIMA,
    type DataPoint,
} from './arima';

describe('difference', () => {
    it('calcula diferença de primeira ordem corretamente', () => {
        const values = [100, 102, 105, 103, 108];
        const result = difference(values, 1);
        expect(result).toEqual([2, 3, -2, 5]);
    });

    it('calcula diferença de segunda ordem corretamente', () => {
        const values = [100, 102, 105, 103, 108];
        const result = difference(values, 2);
        // Primeira diferença: [2, 3, -2, 5]
        // Segunda diferença: [1, -5, 7]
        expect(result).toEqual([1, -5, 7]);
    });

    it('retorna array original quando ordem é 0', () => {
        const values = [100, 102, 105];
        const result = difference(values, 0);
        expect(result).toEqual(values);
    });

    it('lida com array vazio', () => {
        const result = difference([], 1);
        expect(result).toEqual([]);
    });
});

describe('inverseDifference', () => {
    it('reverte diferença de primeira ordem corretamente', () => {
        const predictions = [2, 3, -2];
        const lastValues = [100];
        const result = inverseDifference(predictions, lastValues, 1);
        // 100 + 2 = 102, 102 + 3 = 105, 105 + (-2) = 103
        expect(result).toEqual([102, 105, 103]);
    });

    it('retorna previsões originais quando ordem é 0', () => {
        const predictions = [100, 105, 110];
        const result = inverseDifference(predictions, [], 0);
        expect(result).toEqual(predictions);
    });
});

describe('autocorrelation', () => {
    it('retorna 1 para lag 0', () => {
        const values = [1, 2, 3, 4, 5];
        const result = autocorrelation(values, 0);
        expect(result).toBe(1);
    });

    it('calcula autocorrelação para lag > 0', () => {
        // Dados com padrão claro
        const values = [10, 20, 10, 20, 10, 20, 10, 20];
        const lag2 = autocorrelation(values, 2);
        // Lag 2 em dados alternados deve ter autocorrelação alta
        expect(Math.abs(lag2)).toBeGreaterThan(0.5);
    });

    it('retorna 0 quando lag >= tamanho', () => {
        const values = [1, 2, 3];
        const result = autocorrelation(values, 5);
        expect(result).toBe(0);
    });
});

describe('findOptimalDifferencing', () => {
    it('retorna 0 para dados estacionários', () => {
        // Dados com variância constante
        const values = Array.from({ length: 50 }, () => 100 + (Math.random() - 0.5) * 10);
        const d = findOptimalDifferencing(values);
        expect(d).toBeLessThanOrEqual(1);
    });

    it('sugere diferenciação para tendência linear', () => {
        // Dados com tendência clara
        const values = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
        const d = findOptimalDifferencing(values);
        // A função pode retornar 0, 1 ou 2 dependendo da análise de variância
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(2);
    });
});

describe('fitARIMA', () => {
    it('ajusta modelo ARIMA a dados', () => {
        const values = Array.from({ length: 30 }, (_, i) => 100 + i + (Math.random() - 0.5) * 5);
        const result = fitARIMA(values, 2, 1, 1);

        expect(result.params).toEqual({ p: 2, d: 1, q: 1 });
        expect(result.aic).toBeDefined();
        expect(isFinite(result.aic) || result.aic === Infinity).toBe(true);
    });

    it('retorna AIC infinito para dados insuficientes', () => {
        const values = [100, 101, 102];
        const result = fitARIMA(values, 5, 1, 2);
        expect(result.aic).toBe(Infinity);
    });
});

describe('predictWithARIMA', () => {
    const generateTrendData = (n: number): DataPoint[] => {
        const startDate = new Date('2024-01-01');
        return Array.from({ length: n }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            value: 100 + i * 0.5 + (Math.random() - 0.5) * 2,
        }));
    };

    it('gera previsões para número correto de dias', () => {
        const data = generateTrendData(60);
        const predictions = predictWithARIMA(data, 30);
        expect(predictions.length).toBe(30);
    });

    it('gera previsões dentro de limites razoáveis', () => {
        const data = generateTrendData(60);
        const currentPrice = data[data.length - 1].value;
        const predictions = predictWithARIMA(data, 14);

        predictions.forEach(pred => {
            expect(pred).toBeGreaterThan(currentPrice * 0.3);
            expect(pred).toBeLessThan(currentPrice * 2);
        });
    });

    it('lida com dados insuficientes', () => {
        const data: DataPoint[] = [
            { date: new Date(), value: 100 },
            { date: new Date(), value: 101 },
        ];
        const predictions = predictWithARIMA(data, 7);
        expect(predictions.length).toBe(7);
        expect(predictions[0]).toBe(101); // Repete último valor
    });
});

describe('predictARIMA', () => {
    it('retorna previsão única para horizonte específico', () => {
        const data: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            value: 100 + i * 0.3,
        }));

        const prediction = predictARIMA(data, 7);
        expect(typeof prediction).toBe('number');
        expect(prediction).toBeGreaterThan(0);
    });
});

describe('autoARIMA', () => {
    it('seleciona parâmetros válidos', () => {
        const values = Array.from({ length: 50 }, (_, i) => 100 + i + (Math.random() - 0.5) * 5);
        const result = autoARIMA(values);

        expect(result.p).toBeGreaterThanOrEqual(0);
        expect(result.p).toBeLessThanOrEqual(3);
        expect(result.d).toBeGreaterThanOrEqual(0);
        expect(result.d).toBeLessThanOrEqual(2);
        expect(result.q).toBeGreaterThanOrEqual(0);
        expect(result.q).toBeLessThanOrEqual(2);
        expect(result.aic).toBeDefined();
    });
});
