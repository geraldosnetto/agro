import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const clickSchema = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    source: z.string().min(1),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validação com Zod
        const validation = clickSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const { url, title, source } = validation.data;

        // Registra o click (Upsert = Cria ou Atualiza)
        await prisma.newsAccess.upsert({
            where: { url },
            update: {
                clicks: { increment: 1 },
                title, // Atualiza título caso mude
            },
            create: {
                url,
                title,
                source,
                clicks: 1,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error tracking click:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
