
import { NextResponse } from 'next/server';
import { searchCities } from '@/lib/data-sources/weather';

export const dynamic = 'force-dynamic';
// Cache de busca pode ser maior, cidades não mudam de lugar
export const revalidate = 86400; // 24 horas

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        const results = await searchCities(query);

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('Erro na API de busca de cidades:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor', results: [] },
            { status: 500 }
        );
    }
}
