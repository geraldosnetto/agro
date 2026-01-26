/**
 * API de Notícias por Commodity
 * 
 * GET /api/news/[slug]
 * 
 * Retorna notícias filtradas por commodity usando RSS feeds públicos.
 */

import { NextResponse } from 'next/server';
import { fetchNewsForCommodity } from '@/lib/data-sources/news';

export const dynamic = 'force-dynamic';

// Cache de 1 hora no cliente
export const revalidate = 3600;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Parâmetro opcional de limite
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5', 10);

        const news = await fetchNewsForCommodity(slug, limit);

        return NextResponse.json({
            success: true,
            slug,
            count: news.length,
            news,
        });
    } catch (error) {
        console.error('Erro ao buscar notícias:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao buscar notícias',
                news: []
            },
            { status: 500 }
        );
    }
}
