import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchCepeaSpotPrice } from "@/lib/data-sources/cepea";
import { timingSafeEqual } from "crypto";
import logger from "@/lib/logger";

// Comparação segura contra timing attacks
function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b || a.length !== b.length) return false;
    try {
        return timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const authHeader = request.headers.get('authorization');
        const queryKey = searchParams.get('key');

        const cronSecret = process.env.CRON_SECRET;

        // Validação timing-safe para evitar timing attacks
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const isAuthorized =
            safeCompare(bearerToken, cronSecret) ||
            safeCompare(queryKey, cronSecret) ||
            (!cronSecret && process.env.NODE_ENV === 'development');

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        logger.info("Iniciando atualização de preços");
        const commodities = await prisma.commodity.findMany({
            where: { ativo: true }
        });

        const updates = [];

        for (const commodity of commodities) {
            try {
                const data = await fetchCepeaSpotPrice(commodity.slug);

                if (data) {
                    logger.info(`Atualizando ${commodity.nome}`, { valor: data.valor });

                    const startOfDay = new Date(data.data);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(data.data);
                    endOfDay.setHours(23, 59, 59, 999);

                    const existing = await prisma.cotacao.findFirst({
                        where: {
                            commodityId: commodity.id,
                            dataReferencia: {
                                gte: startOfDay,
                                lte: endOfDay
                            }
                        }
                    });

                    if (!existing) {
                        const lastCotacao = await prisma.cotacao.findFirst({
                            where: { commodityId: commodity.id },
                            orderBy: { dataReferencia: 'desc' }
                        });

                        let variacao = data.variacaoDiaria ?? 0;
                        if (!data.variacaoDiaria && lastCotacao) {
                            const valorAnt = lastCotacao.valor.toNumber();
                            if (valorAnt > 0) {
                                variacao = ((data.valor - valorAnt) / valorAnt) * 100;
                            }
                        }

                        await prisma.cotacao.create({
                            data: {
                                commodityId: commodity.id,
                                valor: data.valor,
                                valorAnterior: lastCotacao?.valor ?? data.valor,
                                variacao: variacao,
                                praca: 'Referência CEPEA',
                                estado: 'BR',
                                fonte: 'CEPEA',
                                dataReferencia: data.data
                            }
                        });
                        updates.push({ slug: commodity.slug, status: 'updated', valor: data.valor });
                    } else {
                        updates.push({ slug: commodity.slug, status: 'skipped_exists' });
                    }
                } else {
                    updates.push({ slug: commodity.slug, status: 'failed_fetch' });
                }
            } catch (err) {
                logger.error(`Falha ao processar ${commodity.slug}`, { error: err instanceof Error ? err.message : String(err) });
                updates.push({ slug: commodity.slug, status: 'error' });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Processo de atualização finalizado",
            results: updates
        });

    } catch (error) {
        logger.error("Erro geral na atualização", { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
