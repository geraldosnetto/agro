
import { Metadata } from 'next';
import { WeatherDashboard } from '@/components/dashboard/weather/WeatherDashboard';

export const metadata: Metadata = {
    title: 'Previsão do Tempo Agrícola | IndicAgro',
    description: 'Previsão do tempo detalhada para as principais regiões agrícolas do Brasil. Monitore temperatura e chuvas.',
};

export default function WeatherPage() {
    return (
        <div className="container mx-auto p-6">
            <WeatherDashboard />
        </div>
    );
}
