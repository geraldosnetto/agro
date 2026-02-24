import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { sendWeeklyPortfolioSummaryEmail } from "@/lib/email";

// Este endpoint deve ser chamado por um cron job semanalmente
// Ex: Sexta-feira 18:00
export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
        const startTime = Date.now();
        let emailsSent = 0;

        // 1. Buscar usuários que possuem favoritos habilitados
        const usersWithFavorites = await prisma.user.findMany({
            where: {
                favoritos: { some: {} }
            },
            include: {
                favoritos: true
            }
        });

        if (usersWithFavorites.length === 0) {
            return NextResponse.json({ message: "Nenhum usuário com favoritos para enviar" });
        }

        const allFavoriteCommodityIds = [...new Set(usersWithFavorites.flatMap(u => u.favoritos.map(f => f.commodityId)))];

        const commodities = await prisma.commodity.findMany({
            where: { id: { in: allFavoriteCommodityIds } },
            select: {
                id: true,
                nome: true,
                slug: true,
                cotacoes: {
                    orderBy: { dataReferencia: 'desc' },
                    take: 2 // Atual e anterior
                }
            }
        });

        const commodityMap = new Map(commodities.map(c => [c.id, c]));

        // 2. Para cada usuário, montar e disparar o e-mail
        for (const user of usersWithFavorites) {
            if (!user.email) continue;

            const portfolioItems = user.favoritos
                .map(fav => commodityMap.get(fav.commodityId))
                .filter(c => c !== undefined && c.cotacoes.length > 0)
                .map(c => {
                    const latest = c!.cotacoes[0];
                    return {
                        commodityName: c!.nome,
                        slug: c!.slug,
                        currentPrice: latest.valor?.toNumber() ?? 0,
                        priceChange: latest.variacao?.toNumber() ?? 0,
                        priceChangePercent: latest.valorAnterior && latest.valorAnterior.toNumber() > 0
                            ? ((latest.valor.toNumber() - latest.valorAnterior.toNumber()) / latest.valorAnterior.toNumber()) * 100
                            : 0
                    };
                });

            if (portfolioItems.length > 0) {
                try {
                    await sendWeeklyPortfolioSummaryEmail(
                        user.email,
                        user.name ?? undefined,
                        portfolioItems
                    );
                    emailsSent++;
                    // Delay para não estourar rate limit caso existam mts usuários
                    await new Promise(r => setTimeout(r, 200));
                } catch (emailError) {
                    logger.error(`Erro ao enviar relatorio semanal para ${user.email}`, { error: emailError });
                }
            }
        }

        const duration = Date.now() - startTime;

        // Log da execução do Cron
        await prisma.atualizacaoLog.create({
            data: {
                fonte: "WEEKLY_PORTFOLIO_EMAIL",
                status: "SUCCESS",
                mensagem: `Enviados ${emailsSent} resumos semanais com sucesso.`,
                registros: emailsSent,
                duracao: duration,
            },
        });

        return NextResponse.json({
            message: "Disparos semanais concluídos",
            emailsSent,
            duration,
        });
    } catch (error) {
        logger.error("Erro no cron de resumo semanal", {
            error: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
