
'use client';

import { useState } from 'react';
import { CalculatorForm } from '@/components/dashboard/calculator/CalculatorForm';
import { CalculatorResults } from '@/components/dashboard/calculator/CalculatorResults';
import { calculateProfitability, type CalculatorInputs, type ProfitabilityResult } from '@/lib/calculators/profitability';
import { Calculator } from 'lucide-react';
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function CalculatorPage() {
    const [result, setResult] = useState<ProfitabilityResult | null>(null);

    const handleCalculate = (data: CalculatorInputs) => {
        const calculated = calculateProfitability(data);
        setResult(calculated);
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <PageHeader
                title="Calculadora de Rentabilidade"
                description="Estime seus custos, margens e ponto de equilíbrio para a próxima safra."
                icon={Calculator}
            />

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
