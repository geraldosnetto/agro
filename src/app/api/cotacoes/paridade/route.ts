
import { NextResponse } from 'next/server';
import { fetchInternationalPrice, fetchDollarRate, hasInternationalPrice } from '@/lib/data-sources/yahoo-finance';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 });
        }

        if (!hasInternationalPrice(slug)) {
            return NextResponse.json({ error: 'Commodity não suporta paridade (sem preço intl)' }, { status: 404 });
        }

        const [internationalPrice, dolarRate] = await Promise.all([
            fetchInternationalPrice(slug),
            fetchDollarRate()
        ]);

        if (!internationalPrice || !dolarRate) {
            return NextResponse.json({ error: 'Erro ao buscar dados de mercado' }, { status: 503 });
        }

        return NextResponse.json({
            cbotPrice: internationalPrice.price,
            dolarPrice: dolarRate,
            unit: internationalPrice.slug === 'soja' ? 'cents/bu' : 'unknown', // Simplificação para MVP
            lastUpdated: internationalPrice.lastUpdated
        });

    } catch (error) {
        console.error('Parity API error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
