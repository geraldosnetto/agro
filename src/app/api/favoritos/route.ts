import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const addFavoritoSchema = z.object({
    commodityId: z.string().min(1, "Commodity é obrigatória"),
});

// GET - List user's favorites
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const favoritos = await prisma.favorito.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        // Get commodity info for each favorite
        const commodityIds = [...new Set(favoritos.map((f) => f.commodityId))];
        const commodities = await prisma.commodity.findMany({
            where: { id: { in: commodityIds } },
            select: {
                id: true,
                nome: true,
                slug: true,
                unidade: true,
                categoria: true,
                cotacoes: {
                    orderBy: { dataReferencia: "desc" },
                    take: 1,
                    select: {
                        valor: true,
                        variacao: true,
                        dataReferencia: true,
                    },
                },
            },
        });

        const commodityMap = new Map(commodities.map((c) => [c.id, c]));

        const favoritosComCommodity = favoritos.map((favorito) => {
            const commodity = commodityMap.get(favorito.commodityId);
            return {
                id: favorito.id,
                commodityId: favorito.commodityId,
                createdAt: favorito.createdAt,
                commodity: commodity
                    ? {
                          id: commodity.id,
                          nome: commodity.nome,
                          slug: commodity.slug,
                          unidade: commodity.unidade,
                          categoria: commodity.categoria,
                          precoAtual: commodity.cotacoes[0]?.valor?.toNumber() ?? 0,
                          variacao: commodity.cotacoes[0]?.variacao?.toNumber() ?? 0,
                          dataAtualizacao: commodity.cotacoes[0]?.dataReferencia ?? null,
                      }
                    : null,
            };
        });

        return NextResponse.json(favoritosComCommodity);
    } catch (error) {
        console.error("Erro ao listar favoritos:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// POST - Add favorite
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const result = addFavoritoSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Dados inválidos", details: result.error.issues },
                { status: 400 }
            );
        }

        const { commodityId } = result.data;

        // Check if commodity exists (try by ID first, then by slug)
        let commodity = await prisma.commodity.findUnique({
            where: { id: commodityId },
        });

        if (!commodity) {
            commodity = await prisma.commodity.findUnique({
                where: { slug: commodityId },
            });
        }

        if (!commodity) {
            return NextResponse.json(
                { error: "Commodity não encontrada" },
                { status: 404 }
            );
        }

        // Check if already favorited
        const existing = await prisma.favorito.findUnique({
            where: {
                userId_commodityId: {
                    userId: session.user.id,
                    commodityId: commodity.id,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Commodity já está nos favoritos" },
                { status: 409 }
            );
        }

        // Create favorite
        const favorito = await prisma.favorito.create({
            data: {
                userId: session.user.id,
                commodityId: commodity.id,
            },
        });

        return NextResponse.json(
            {
                message: "Favorito adicionado com sucesso",
                favorito,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao adicionar favorito:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// DELETE - Remove favorite by commodityId (in query string)
export async function DELETE(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const commodityId = searchParams.get("commodityId");

        if (!commodityId) {
            return NextResponse.json(
                { error: "commodityId é obrigatório" },
                { status: 400 }
            );
        }

        // Find commodity (try by ID first, then by slug)
        let commodity = await prisma.commodity.findUnique({
            where: { id: commodityId },
        });

        if (!commodity) {
            commodity = await prisma.commodity.findUnique({
                where: { slug: commodityId },
            });
        }

        if (!commodity) {
            return NextResponse.json(
                { error: "Commodity não encontrada" },
                { status: 404 }
            );
        }

        // Delete favorite
        const deleted = await prisma.favorito.deleteMany({
            where: {
                userId: session.user.id,
                commodityId: commodity.id,
            },
        });

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: "Favorito não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Favorito removido com sucesso" });
    } catch (error) {
        console.error("Erro ao remover favorito:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
