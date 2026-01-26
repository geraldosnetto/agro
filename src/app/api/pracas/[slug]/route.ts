import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        // Find commodity
        const commodity = await prisma.commodity.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!commodity) {
            return NextResponse.json({ error: 'Commodity não encontrada' }, { status: 404 });
        }

        // Get distinct praças that actually exist in the database for this commodity
        // Filter out 'Seed History' as it's test data
        const pracasResult = await prisma.cotacao.findMany({
            where: {
                commodityId: commodity.id,
                NOT: { praca: 'Seed History' }
            },
            select: { praca: true },
            distinct: ['praca'],
            orderBy: { praca: 'asc' }
        });

        const pracas = pracasResult.map((p, index) => ({
            index,
            nome: p.praca || 'Referência'
        }));

        return NextResponse.json({
            slug,
            pracas
        });
    } catch (error) {
        console.error('Error fetching praças:', error);
        return NextResponse.json(
            { error: 'Failed to fetch praças' },
            { status: 500 }
        );
    }
}
