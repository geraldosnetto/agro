
import { NextResponse } from 'next/server';
import { fetchWeather } from '@/lib/data-sources/weather';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // Cache de 30 minutos

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lon = parseFloat(searchParams.get('lon') || '0');

        if (!lat || !lon) {
            return NextResponse.json(
                { success: false, error: 'Latitude e Longitude são obrigatórias' },
                { status: 400 }
            );
        }

        const weatherData = await fetchWeather(lat, lon);

        if (!weatherData) {
            return NextResponse.json(
                { success: false, error: 'Erro ao buscar dados do clima' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: weatherData
        });

    } catch (error) {
        console.error('Erro na API de clima:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
