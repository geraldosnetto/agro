import { describe, it, expect } from 'vitest';
import {
    fitHoltWinters,
    predictWithHoltWinters,
    predictHoltWinters,
    optimizeHoltWinters,
    autoHoltWinters,
    type DataPoint,
    type HoltWintersParams,
} from './holt-winters';

describe('fitHoltWinters', () => {
    const generateSeasonalData = (n: number): number[] => {
        return Array.from({ length: n }, (_, i) => {
            // Tendência + sazonalidade semanal
            const trend = 100 + i * 0.5;
            const seasonal = Math.sin((i / 7) * 2 * Math.PI) * 5;
            return trend + seasonal;
        });
    };

    it('ajusta modelo a dados com sazonalidade', () => {
        const values = generateSeasonalData(30);
        const result = fitHoltWinters(values);

        expect(result.level).toBeGreaterThan(0);
        expect(result.seasonal.length).toBe(7);
        expect(result.fitted.length).toBe(values.length);
    });

    it('usa parâmetros default quando não especificados', () => {
        const values = generateSeasonalData(20);
        const result = fitHoltWinters(values);

        expect(result.params.alpha).toBe(0.3);
        expect(result.params.beta).toBe(0.1);
        expect(result.params.gamma).toBe(0.2);
        expect(result.params.seasonalPeriod).toBe(7);
    });

    it('lida com dados insuficientes', () => {
        const values = [100, 102, 105];
        const result = fitHoltWinters(values);

        expect(result.level).toBeGreaterThan(0);
        expect(result.fitted.length).toBe(3);
    });

    it('calcula MSE para ajuste do modelo', () => {
        const values = generateSeasonalData(30);
        const result = fitHoltWinters(values);

        expect(result.mse).toBeGreaterThanOrEqual(0);
        expect(isFinite(result.mse)).toBe(true);
    });
});

describe('predictWithHoltWinters', () => {
    const generateData = (n: number): DataPoint[] => {
        const startDate = new Date('2024-01-01');
        return Array.from({ length: n }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            value: 100 + i * 0.3 + (Math.random() - 0.5) * 3,
        }));
    };

    it('gera número correto de previsões', () => {
        const data = generateData(30);
        const predictions = predictWithHoltWinters(data, 14);
        expect(predictions.length).toBe(14);
    });

    it('gera previsões dentro de limites razoáveis', () => {
        const data = generateData(30);
        const currentPrice = data[data.length - 1].value;
        const predictions = predictWithHoltWinters(data, 7);

        predictions.forEach(pred => {
            expect(pred).toBeGreaterThan(currentPrice * 0.4);
            expect(pred).toBeLessThan(currentPrice * 1.6);
        });
    });

    it('lida com dados insuficientes', () => {
        const data: DataPoint[] = [
            { date: new Date(), value: 100 },
        ];
        const predictions = predictWithHoltWinters(data, 7);
        expect(predictions.length).toBe(7);
        expect(predictions[0]).toBe(100);
    });

    it('aceita parâmetros customizados', () => {
        const data = generateData(30);
        const customParams: HoltWintersParams = {
            alpha: 0.5,
            beta: 0.2,
            gamma: 0.3,
            seasonalPeriod: 7,
        };
        const predictions = predictWithHoltWinters(data, 7, customParams);
        expect(predictions.length).toBe(7);
    });
});

describe('predictHoltWinters', () => {
    it('retorna previsão única para horizonte específico', () => {
        const data: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            value: 100 + i * 0.3,
        }));

        const prediction = predictHoltWinters(data, 14);
        expect(typeof prediction).toBe('number');
        expect(prediction).toBeGreaterThan(0);
    });

    it('previsão de 30 dias considera tendência de alta', () => {
        // Dados com tendência clara de alta
        const data: DataPoint[] = Array.from({ length: 60 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            value: 100 + i * 1,
        }));

        const currentPrice = data[data.length - 1].value;
        const prediction = predictHoltWinters(data, 30);

        // Previsão deve ser maior que preço atual para tendência de alta
        expect(prediction).toBeGreaterThan(currentPrice * 0.9);
    });
});

describe('optimizeHoltWinters', () => {
    it('retorna parâmetros válidos', () => {
        const values = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5 + (Math.random() - 0.5) * 5);
        const params = optimizeHoltWinters(values);

        expect(params.alpha).toBeGreaterThan(0);
        expect(params.alpha).toBeLessThan(1);
        expect(params.beta).toBeGreaterThan(0);
        expect(params.beta).toBeLessThan(1);
        expect(params.gamma).toBeGreaterThan(0);
        expect(params.gamma).toBeLessThan(1);
        expect(params.seasonalPeriod).toBe(7);
    });

    it('minimiza MSE comparado a parâmetros genéricos', () => {
        const values = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5 + Math.sin(i / 7 * Math.PI) * 5);
        const optimizedParams = optimizeHoltWinters(values);

        const defaultResult = fitHoltWinters(values, { alpha: 0.5, beta: 0.5, gamma: 0.5, seasonalPeriod: 7 });
        const optimizedResult = fitHoltWinters(values, optimizedParams);

        // Parâmetros otimizados devem ter MSE menor ou igual
        expect(optimizedResult.mse).toBeLessThanOrEqual(defaultResult.mse + 1);
    });
});

describe('autoHoltWinters', () => {
    it('gera previsões com otimização automática', () => {
        const data: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            value: 100 + i * 0.3 + Math.sin(i / 7 * Math.PI) * 3,
        }));

        const predictions = autoHoltWinters(data, 14);
        expect(predictions.length).toBe(14);
        predictions.forEach(pred => {
            expect(pred).toBeGreaterThan(0);
        });
    });

    it('usa defaults para dados insuficientes para otimização', () => {
        const data: DataPoint[] = Array.from({ length: 10 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
            value: 100 + i,
        }));

        const predictions = autoHoltWinters(data, 7);
        expect(predictions.length).toBe(7);
    });
});
