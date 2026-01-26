import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchAllCepeaPrices } from "@/lib/data-sources/cepea";
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

        logger.info("Iniciando atualização de preços (modo histórico)");
        const commodities = await prisma.commodity.findMany({
            where: { ativo: true }
        });

        const updates: { slug: string; status: string; count?: number }[] = [];

        for (const commodity of commodities) {
            try {
                // Fetch ALL historical data from CEPEA (all rows from table)
                const allPrices = await fetchAllCepeaPrices(commodity.slug);

                // Only use the first praça (main indicator - index 0)
                const mainPrices = allPrices.filter(p => p.pracaIndex === 0);

                if (mainPrices.length === 0) {
                    updates.push({ slug: commodity.slug, status: 'failed_fetch' });
                    continue;
                }

                logger.info(`Processando ${commodity.nome}`, { totalRows: mainPrices.length });

                let insertedCount = 0;
                let skippedCount = 0;

                for (const data of mainPrices) {
                    const startOfDay = new Date(data.data);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(data.data);
                    endOfDay.setHours(23, 59, 59, 999);

                    // Check if cotação already exists for this day
                    const existing = await prisma.cotacao.findFirst({
                        where: {
                            commodityId: commodity.id,
                            dataReferencia: {
                                gte: startOfDay,
                                lte: endOfDay
                            },
                            praca: 'Referência CEPEA'
                        }
                    });

                    if (!existing) {
                        await prisma.cotacao.create({
                            data: {
                                commodityId: commodity.id,
                                valor: data.valor,
                                valorAnterior: data.valor,
                                variacao: data.variacaoDiaria ?? 0,
                                praca: 'Referência CEPEA',
                                estado: 'BR',
                                fonte: 'CEPEA',
                                dataReferencia: data.data
                            }
                        });
                        insertedCount++;
                    } else {
                        skippedCount++;
                    }
                }

                updates.push({
                    slug: commodity.slug,
                    status: insertedCount > 0 ? 'updated' : 'skipped_all_exist',
                    count: insertedCount
                });

                logger.info(`${commodity.nome}: ${insertedCount} inseridos, ${skippedCount} já existiam`);

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
