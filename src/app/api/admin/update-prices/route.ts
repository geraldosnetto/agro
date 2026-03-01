import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchAllCepeaPrices } from "@/lib/data-sources/cepea";
import { timingSafeEqual } from "crypto";
import logger from "@/lib/logger";
import { extrairUF } from '@/lib/commodities';

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
                // Fetch ALL historical data from CEPEA (all rows from all tables/praças)
                const allPrices = await fetchAllCepeaPrices(commodity.slug);

                if (allPrices.length === 0) {
                    updates.push({ slug: commodity.slug, status: 'failed_fetch' });
                    continue;
                }

                logger.info(`Processando ${commodity.nome}`, { totalRows: allPrices.length });

                // Prepare data for bulk insert
                const dataToInsert = allPrices.map(data => {
                    const pracaNome = data.pracaNome || 'Referência CEPEA';
                    const estadoUF = extrairUF(pracaNome);

                    return {
                        commodityId: commodity.id,
                        valor: data.valor,
                        valorAnterior: data.valor, // Histórico não tem valor anterior explícito
                        variacao: data.variacaoDiaria ?? 0,
                        praca: pracaNome,
                        estado: estadoUF,
                        fonte: 'CEPEA',
                        dataReferencia: data.data,
                        createdAt: new Date(), // Explicitly set createdAt for createMany
                    };
                });

                // Bulk insert with skipDuplicates
                // This is MUCH faster than checking one by one
                const result = await prisma.cotacao.createMany({
                    data: dataToInsert,
                    skipDuplicates: true,
                });

                const insertedCount = result.count;
                const skippedCount = allPrices.length - insertedCount;

                updates.push({
                    slug: commodity.slug,
                    status: insertedCount > 0 ? 'updated' : 'skipped_all_exist',
                    count: insertedCount
                });

                logger.info(`${commodity.nome}: ${insertedCount} inseridos, ${skippedCount} já existiam (Ignorados)`);

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
