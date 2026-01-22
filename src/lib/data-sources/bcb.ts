/**
 * Cliente para API do Banco Central do Brasil
 * Documentação: https://dadosabertos.bcb.gov.br/
 * API PTAX: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3
 */

import logger from '@/lib/logger';

const PTAX_API_URL = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

interface PTAXCotacao {
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
}

interface PTAXResponse {
    value: PTAXCotacao[];
}

export interface CotacaoDolar {
    data: Date;
    compra: number;
    venda: number;
    variacao?: number;
}

/**
 * Formata data para o formato MM-DD-YYYY usado pela API do BCB
 */
function formatDateForBCB(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
}

/**
 * Busca cotação do dólar PTAX para uma data específica
 */
async function fetchPTAXForDate(date: Date): Promise<PTAXCotacao | null> {
    const formattedDate = formatDateForBCB(date);
    const url = `${PTAX_API_URL}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$format=json`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache de 1 hora
        });

        if (!response.ok) {
            throw new Error(`BCB API error: ${response.status}`);
        }

        const data: PTAXResponse = await response.json();

        if (!data.value || data.value.length === 0) {
            return null;
        }

        // Retorna a última cotação do dia (pode ter várias)
        return data.value[data.value.length - 1];
    } catch (error) {
        logger.error(`Erro ao buscar PTAX para ${formattedDate}`, { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * Busca cotação do dólar PTAX (última disponível)
 */
export async function fetchDolarPTAX(): Promise<CotacaoDolar | null> {
    try {
        const hoje = new Date();
        let cotacaoHoje: PTAXCotacao | null = null;
        let cotacaoAnterior: PTAXCotacao | null = null;

        // Tenta buscar cotação de hoje e dos últimos 5 dias úteis
        for (let i = 0; i <= 5 && !cotacaoHoje; i++) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            cotacaoHoje = await fetchPTAXForDate(data);
        }

        if (!cotacaoHoje) {
            logger.warn('Nenhuma cotação PTAX encontrada nos últimos 5 dias');
            return null;
        }

        // Busca cotação anterior para calcular variação
        const dataAtual = new Date(cotacaoHoje.dataHoraCotacao);
        for (let i = 1; i <= 5 && !cotacaoAnterior; i++) {
            const dataAnterior = new Date(dataAtual);
            dataAnterior.setDate(dataAnterior.getDate() - i);
            cotacaoAnterior = await fetchPTAXForDate(dataAnterior);
        }

        // Calcula variação se houver dado anterior
        let variacao: number | undefined;
        if (cotacaoAnterior) {
            variacao = ((cotacaoHoje.cotacaoVenda - cotacaoAnterior.cotacaoVenda) / cotacaoAnterior.cotacaoVenda) * 100;
        }

        return {
            data: dataAtual,
            compra: cotacaoHoje.cotacaoCompra,
            venda: cotacaoHoje.cotacaoVenda,
            variacao,
        };
    } catch (error) {
        logger.error("Erro ao buscar dólar PTAX", { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}

/**
 * Busca taxa SELIC (usando API SGS que ainda funciona para séries específicas)
 */
export async function fetchSELIC(): Promise<number | null> {
    try {
        const url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json";
        const response = await fetch(url, {
            next: { revalidate: 86400 }, // Cache de 24 horas
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (!data.length) return null;
        return parseFloat(data[0].valor);
    } catch {
        return null;
    }
}
