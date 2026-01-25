import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateAlertaSchema = z.object({
    tipo: z.enum(["ACIMA", "ABAIXO", "VARIACAO"]).optional(),
    valorAlvo: z.number().positive().nullable().optional(),
    percentual: z.number().min(0.1).max(100).nullable().optional(),
    ativo: z.boolean().optional(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get single alert
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const alerta = await prisma.alertaUsuario.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!alerta) {
            return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 });
        }

        // Get commodity info
        const commodity = await prisma.commodity.findUnique({
            where: { id: alerta.commodityId },
            select: {
                nome: true,
                slug: true,
                unidade: true,
                cotacoes: {
                    orderBy: { dataReferencia: "desc" },
                    take: 1,
                    select: { valor: true },
                },
            },
        });

        return NextResponse.json({
            ...alerta,
            valorAlvo: alerta.valorAlvo?.toNumber() ?? null,
            percentual: alerta.percentual?.toNumber() ?? null,
            commodity: commodity
                ? {
                      nome: commodity.nome,
                      slug: commodity.slug,
                      unidade: commodity.unidade,
                      precoAtual: commodity.cotacoes[0]?.valor?.toNumber() ?? 0,
                  }
                : null,
        });
    } catch (error) {
        console.error("Erro ao buscar alerta:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// PATCH - Update alert
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const result = updateAlertaSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Dados inválidos", details: result.error.issues },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.alertaUsuario.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 });
        }

        const { tipo, valorAlvo, percentual, ativo } = result.data;

        const alerta = await prisma.alertaUsuario.update({
            where: { id },
            data: {
                ...(tipo !== undefined && { tipo }),
                ...(valorAlvo !== undefined && { valorAlvo }),
                ...(percentual !== undefined && { percentual }),
                ...(ativo !== undefined && { ativo, disparado: ativo ? false : existing.disparado }),
            },
        });

        return NextResponse.json({
            message: "Alerta atualizado",
            alerta: {
                ...alerta,
                valorAlvo: alerta.valorAlvo?.toNumber() ?? null,
                percentual: alerta.percentual?.toNumber() ?? null,
            },
        });
    } catch (error) {
        console.error("Erro ao atualizar alerta:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// DELETE - Delete alert
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Verify ownership
        const existing = await prisma.alertaUsuario.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 });
        }

        await prisma.alertaUsuario.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Alerta excluído" });
    } catch (error) {
        console.error("Erro ao excluir alerta:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
