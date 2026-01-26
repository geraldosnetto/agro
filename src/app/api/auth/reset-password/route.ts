/**
 * API: Redefinir senha
 * 
 * POST /api/auth/reset-password
 * 
 * Valida token e atualiza senha.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token e nova senha são obrigatórios' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Senha deve ter pelo menos 6 caracteres' },
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
                { error: 'Token expirado. Solicite um novo reset.' },
                { status: 400 }
            );
        }

        // Busca usuário
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 400 }
            );
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Atualiza senha
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        // Remove token usado
        await prisma.verificationToken.delete({
            where: { token },
        });

        return NextResponse.json({
            success: true,
            message: 'Senha atualizada com sucesso!',
        });
    } catch (error) {
        console.error('[RESET-PASSWORD] Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar senha' },
            { status: 500 }
        );
    }
}
