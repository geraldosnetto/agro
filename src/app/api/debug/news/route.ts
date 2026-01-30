
import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/data-sources/news';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("DEBUG: Manually triggering fetchAllNews...");
        const news = await fetchAllNews(50);
        return NextResponse.json({
            count: news.length,
            sample: news.slice(0, 3)
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
