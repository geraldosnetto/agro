import { NextResponse } from 'next/server';
import {
    fetchInternationalPrice,
    fetchAllInternationalPrices,
    hasInternationalPrice,
    INTERNATIONAL_TICKERS,
} from '@/lib/data-sources/yahoo-finance';

export const dynamic = 'force-dynamic';
export const revalidate = 900; // 15 minutos

/**
 * GET /api/cotacoes/internacional
 *
 * Retorna cotações internacionais de commodities.
 *
 * Query params:
 * - slug: (opcional) filtrar por commodity específica
 *
 * Exemplos:
 * - GET /api/cotacoes/internacional - todas as commodities
 * - GET /api/cotacoes/internacional?slug=soja - apenas soja
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        // Se slug específico
        if (slug) {
            if (!hasInternationalPrice(slug)) {
                return NextResponse.json(
                    {
                        error: 'Commodity não possui cotação internacional',
                        code: 'NO_INTERNATIONAL_PRICE',
                        availableCommodities: Object.keys(INTERNATIONAL_TICKERS),
                    },
                    { status: 404 }
                );
            }

            const price = await fetchInternationalPrice(slug);

            if (!price) {
                return NextResponse.json(
                    {
                        error: 'Erro ao buscar cotação internacional',
                        code: 'FETCH_ERROR',
                    },
                    { status: 503 }
                );
            }

            return NextResponse.json({
                price,
                source: 'Yahoo Finance',
                disclaimer: 'Dados com atraso de 15-20 minutos. Não são cotações em tempo real.',
            });
        }

        // Todas as commodities
        const prices = await fetchAllInternationalPrices();

        return NextResponse.json({
            prices,
            count: prices.length,
            availableCommodities: Object.keys(INTERNATIONAL_TICKERS),
            source: 'Yahoo Finance',
            disclaimer: 'Dados com atraso de 15-20 minutos. Não são cotações em tempo real.',
        });
    } catch (error) {
        console.error('International prices API error:', error);
        return NextResponse.json(
            {
                error: 'Erro ao buscar cotações internacionais',
                code: 'API_ERROR',
            },
            { status: 500 }
        );
    }
}
