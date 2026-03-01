
import { Metadata } from 'next';
import { WeatherDashboard } from '@/components/dashboard/weather/WeatherDashboard';
import { CloudRain } from 'lucide-react';
import { PageHeader } from "@/components/dashboard/PageHeader";

export const metadata: Metadata = {
    title: 'Previsão do Tempo Agrícola | IndicAgro',
    description: 'Previsão do tempo detalhada para as principais regiões agrícolas do Brasil. Monitore temperatura e chuvas.',
};

export default function WeatherPage() {
    return (
        <div className="container px-4 py-6 md:py-8 space-y-8">
            <PageHeader
                title="Previsão do Tempo"
                description="Previsões atualizadas para as principais regiões produtoras."
                icon={CloudRain}
            />
            <WeatherDashboard />
        </div>
    );
}
