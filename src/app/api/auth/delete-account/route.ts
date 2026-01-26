/**
 * API: Excluir conta (LGPD)
 * 
 * DELETE /api/auth/delete-account
 * 
 * Exclui completamente a conta do usuário e todos seus dados.
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

export async function DELETE(request: Request) {
    try {
        // Verifica autenticação
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: 'Senha é obrigatória para confirmar exclusão' },
                { status: 400 }
            );
        }

        // Busca usuário com senha
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Verifica senha (apenas para usuários com senha local)
        if (user.password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'Senha incorreta' },
                    { status: 403 }
                );
            }
        }

        // Deleta todos os dados do usuário (cascade não funciona para todas as relações)
        // Ordem: dependentes primeiro

        // 1. Alertas do usuário
        await prisma.alertaUsuario.deleteMany({
            where: { userId: user.id },
        });

        // 2. Favoritos do usuário
        await prisma.favorito.deleteMany({
            where: { userId: user.id },
        });

        // 3. Sessões do usuário
        await prisma.session.deleteMany({
            where: { userId: user.id },
        });

        // 4. Accounts (OAuth)
        await prisma.account.deleteMany({
            where: { userId: user.id },
        });

        // 5. Por fim, o usuário
        await prisma.user.delete({
            where: { id: user.id },
        });

        return NextResponse.json({
            success: true,
            message: 'Conta excluída com sucesso. Todos os seus dados foram removidos.',
        });
    } catch (error) {
        console.error('[DELETE-ACCOUNT] Erro:', error);
        return NextResponse.json(
            { error: 'Erro ao excluir conta' },
            { status: 500 }
        );
    }
}
