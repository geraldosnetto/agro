/**
 * API: Verificar email
 * 
 * POST /api/auth/verify-email
 * 
 * Valida token e marca email como verificado.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token é obrigatório' },
                { status: 400 }
            );
        }

        // Busca token válido
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { error: 'Token inválido ou expirado' },
                { status: 400 }
            );
        }

        // Verifica expiração
        if (new Date() > verificationToken.expires) {
            // Remove token expirado
            await prisma.verificationToken.delete({
                where: { token },
            });

            return NextResponse.json(
                { error: 'Token expirado. Solicite um novo email de verificação.' },
                { status: 400 }
            );
        }

        // Marca email como verificado
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { emailVerified: new Date() },
        });

        // Remove token usado
        await prisma.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({
            success: true,
            message: 'Email verificado com sucesso!',
        });
    } catch (error) {
        console.error('[VERIFY-EMAIL] Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao verificar email' },
            { status: 500 }
        );
    }
}
