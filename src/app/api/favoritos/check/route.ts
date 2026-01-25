import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET - Check if a commodity is favorited
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ isFavorited: false });
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
            return NextResponse.json({ isFavorited: false });
        }

        // Check if favorited
        const favorito = await prisma.favorito.findUnique({
            where: {
                userId_commodityId: {
                    userId: session.user.id,
                    commodityId: commodity.id,
                },
            },
        });

        return NextResponse.json({ isFavorited: !!favorito });
    } catch (error) {
        console.error("Erro ao verificar favorito:", error);
        return NextResponse.json({ isFavorited: false });
    }
}
