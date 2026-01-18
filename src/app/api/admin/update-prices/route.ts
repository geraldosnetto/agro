
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchCepeaSpotPrice } from "@/lib/data-sources/cepea";

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const authHeader = request.headers.get('authorization');
        const queryKey = searchParams.get('key');

        const cronSecret = process.env.CRON_SECRET;

        // Se CRON_SECRET não estiver configurado (dev), permite passar com aviso
        // Em produção, deve ser obrigatório.
        const isAuthorized =
            (authHeader === `Bearer ${cronSecret}`) ||
            (queryKey === cronSecret) ||
            (!cronSecret && process.env.NODE_ENV === 'development');

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log("Iniciando atualização de preços...");
        const commodities = await prisma.commodity.findMany({
            where: { ativo: true }
        });

        const updates = [];

        for (const commodity of commodities) {
            try {
                const data = await fetchCepeaSpotPrice(commodity.slug);

                if (data) {
                    console.log(`Atualizando ${commodity.nome}: R$ ${data.valor}`);

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
                console.error(`Falha ao processar ${commodity.slug}`, err);
                updates.push({ slug: commodity.slug, status: 'error' });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Processo de atualização finalizado",
            results: updates
        });

    } catch (error) {
        console.error("Erro geral na atualização:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
