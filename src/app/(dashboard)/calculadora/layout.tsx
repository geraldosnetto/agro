import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Calculadora de Rentabilidade | IndicAgro',
    description: 'Estime custos, margens e ponto de equilíbrio para a próxima safra com a calculadora de rentabilidade agrícola.',
};

export default function CalculadoraLayout({ children }: { children: React.ReactNode }) {
    return children;
}
