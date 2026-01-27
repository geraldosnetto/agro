import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { Ticker } from "./Ticker";

// Busca dados reais para o Ticker (Server Component)
async function getTickerData() {
    try {
        const commodities = await prisma.commodity.findMany({
            where: { ativo: true },
            include: {
                cotacoes: {
                    orderBy: { dataReferencia: 'desc' },
                    take: 1
                }
            },
            take: 8 // Limitar para não sobrecarregar o ticker
        });

        return commodities.map(c => ({
            symbol: c.slug.toUpperCase().replace('-', ' '),
            value: c.cotacoes[0]?.valor?.toNumber() ?? 0,
            change: c.cotacoes[0]?.variacao?.toNumber() ?? 0
        })).filter(item => item.value > 0); // Só mostra se tiver valor
    } catch (error) {
        logger.error('Erro ao buscar dados do Ticker', { error: error instanceof Error ? error.message : String(error) });
        // Retorna array vazio em caso de erro - ticker não será exibido
        return [];
    }
}

export async function TickerServer() {
    const tickerData = await getTickerData();
    return <Ticker items={tickerData} />;
}
