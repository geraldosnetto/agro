
import { z } from 'zod';

// Schema de Validação do Formulário
export const profitabilitySchema = z.object({
    area: z.number().min(0.1, 'A área deve ser maior que 0'),
    expectedYield: z.number().min(0, 'A produtividade deve ser maior ou igual a 0'),
    salePrice: z.number().min(0, 'O preço de venda deve ser maior ou igual a 0'),

    // Custos
    seedsCost: z.number().min(0).default(0),
    fertilizerCost: z.number().min(0).default(0),
    pesticideCost: z.number().min(0).default(0),
    operationCost: z.number().min(0).default(0), // Mecanização, combustivel
    adminCost: z.number().min(0).default(0),     // Administrativo, outros
    otherCost: z.number().min(0).default(0),     // Arrendamento, etc
});

export type CalculatorInputs = z.infer<typeof profitabilitySchema>;

export interface ProfitabilityResult {
    totalRevenue: number;       // Receita Bruta Total
    totalCost: number;          // Custo Total de Produção
    grossMargin: number;        // Margem Bruta (Receita - Custo)
    grossMarginPercent: number; // Margem Bruta %
    costPerBag: number;         // Custo por Saca/Unidade
    breakevenYield: number;     // Produtividade de Nivelamento (quantos sc/ha para pagar a conta)
    breakevenPrice: number;     // Preço de Nivelamento (quanto precisa vender para pagar a conta)
}

export function calculateProfitability(data: CalculatorInputs): ProfitabilityResult {
    const totalArea = data.area || 1; // Evitar divisão por zero se área for undefined (embora schema garanta)

    // Cálculos por Hectare
    const costPerHa =
        data.seedsCost +
        data.fertilizerCost +
        data.pesticideCost +
        data.operationCost +
        data.adminCost +
        data.otherCost;

    const revenuePerHa = data.expectedYield * data.salePrice;

    // Totais
    const totalCost = costPerHa * totalArea;
    const totalRevenue = revenuePerHa * totalArea;
    const grossMargin = totalRevenue - totalCost;

    const grossMarginPercent = totalRevenue > 0
        ? (grossMargin / totalRevenue) * 100
        : 0;

    // Métricas de Nivelamento
    const costPerBag = data.expectedYield > 0
        ? costPerHa / data.expectedYield
        : 0;

    const breakevenYield = data.salePrice > 0
        ? costPerHa / data.salePrice
        : 0;

    const breakevenPrice = data.expectedYield > 0
        ? costPerHa / data.expectedYield
        : 0;

    return {
        totalRevenue,
        totalCost,
        grossMargin,
        grossMarginPercent,
        costPerBag,
        breakevenYield,
        breakevenPrice
    };
}
