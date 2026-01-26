/**
 * API: Esqueci minha senha
 * 
 * POST /api/auth/forgot-password
 * 
 * Gera token de reset e envia email.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email é obrigatório' },
                { status: 400 }
            );
        }

        // Busca usuário
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Sempre retorna sucesso para não revelar se email existe
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'Se o email existir, você receberá instruções de reset.',
            });
        }

        // Gera token único
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Salva token no banco
        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        // Envia email
        await sendPasswordResetEmail(email, token, user.name ?? undefined);

        return NextResponse.json({
            success: true,
            message: 'Se o email existir, você receberá instruções de reset.',
        });
    } catch (error) {
        console.error('[FORGOT-PASSWORD] Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
        );
    }
}
