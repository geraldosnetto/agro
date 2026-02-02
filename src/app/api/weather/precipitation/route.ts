import { NextResponse } from 'next/server';
import { fetchRegionalPrecipitation } from '@/lib/data-sources/precipitation';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hora

export async function GET() {
    try {
        const data = await fetchRegionalPrecipitation();

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error fetching precipitation data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch precipitation data' },
            { status: 500 }
        );
    }
}
