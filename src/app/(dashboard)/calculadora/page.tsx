
'use client';

import { useState } from 'react';
import { CalculatorForm } from '@/components/dashboard/calculator/CalculatorForm';
import { CalculatorResults } from '@/components/dashboard/calculator/CalculatorResults';
import { calculateProfitability, type CalculatorInputs, type ProfitabilityResult } from '@/lib/calculators/profitability';
import { Calculator } from 'lucide-react';

export default function CalculatorPage() {
    const [result, setResult] = useState<ProfitabilityResult | null>(null);

    const handleCalculate = (data: CalculatorInputs) => {
        const calculated = calculateProfitability(data);
        setResult(calculated);
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Calculator className="h-8 w-8 text-primary" />
                    Calculadora de Rentabilidade
                </h1>
                <p className="text-muted-foreground text-lg">
                    Estime seus custos, margens e ponto de equilíbrio para a próxima safra.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna da Esquerda: Formulário (5 cols) */}
                <div className="lg:col-span-5 h-full">
                    <CalculatorForm onCalculate={handleCalculate} />
                </div>

                {/* Coluna da Direita: Resultados (7 cols) */}
                <div className="lg:col-span-7">
                    <CalculatorResults result={result} />
                </div>
            </div>
        </div>
    );
}
