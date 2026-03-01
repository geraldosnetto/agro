
import { NextResponse } from 'next/server';
import { fetchAllNews, fetchNewsForCommodity } from '@/lib/data-sources/news';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const commodityParam = searchParams.get('commodity');
        const limit = limitParam ? parseInt(limitParam, 10) : 20;

        let news;
        if (commodityParam && commodityParam !== 'all') {
            news = await fetchNewsForCommodity(commodityParam, limit);
        } else {
            news = await fetchAllNews(limit);
        }

        return NextResponse.json({
            success: true,
            count: news.length,
            news,
        });
    } catch (error) {
        console.error('Erro ao buscar todas as notícias:', error);
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
