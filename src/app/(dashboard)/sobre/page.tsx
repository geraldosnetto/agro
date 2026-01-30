
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sobre | IndicAgro',
    description: 'Saiba mais sobre o IndicAgro.',
};

export default function SobrePage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Sobre o IndicAgro</h1>
            <p className="text-muted-foreground">
                O IndicAgro é sua plataforma de inteligência de mercado para o agronegócio.
                Fornecemos cotações em tempo real, notícias agregadas e análises baseadas em IA para ajudar na sua tomada de decisão.
            </p>
        </div>
    );
}
