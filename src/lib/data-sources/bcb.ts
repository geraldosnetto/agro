/**
 * Cliente para API do Banco Central do Brasil
 * Documentação: https://dadosabertos.bcb.gov.br/
 */

const BCB_API_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

// Séries do BCB
const SERIES = {
    PTAX_COMPRA: 1,  // PTAX compra
    PTAX_VENDA: 10813, // PTAX venda  
    SELIC: 432, // Taxa SELIC
};

interface BCBResponse {
    data: string; // DD/MM/YYYY
    valor: string;
}

/**
 * Busca últimos N valores de uma série do BCB
 */
async function fetchSerie(serie: number, ultimos: number = 1): Promise<BCBResponse[]> {
    const url = `${BCB_API_URL}/${serie}/dados/ultimos/${ultimos}?formato=json`;

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache de 1 hora
        });

        if (!response.ok) {
            throw new Error(`BCB API error: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(`Erro ao buscar série ${serie} do BCB:`, error);
        return [];
    }
}

export interface CotacaoDolar {
    data: Date;
    compra: number;
    venda: number;
    variacao?: number;
}

/**
 * Busca cotação do dólar PTAX
 */
export async function fetchDolarPTAX(): Promise<CotacaoDolar | null> {
    try {
        // Busca últimos 2 valores para calcular variação
        const [compraData, vendaData] = await Promise.all([
            fetchSerie(SERIES.PTAX_COMPRA, 2),
            fetchSerie(SERIES.PTAX_VENDA, 2),
        ]);

        if (!compraData.length || !vendaData.length) {
            return null;
        }

        const compraAtual = parseFloat(compraData[compraData.length - 1].valor);
        const vendaAtual = parseFloat(vendaData[vendaData.length - 1].valor);

        // Calcula variação se houver dado anterior
        let variacao: number | undefined;
        if (vendaData.length > 1) {
            const vendaAnterior = parseFloat(vendaData[vendaData.length - 2].valor);
            variacao = ((vendaAtual - vendaAnterior) / vendaAnterior) * 100;
        }

        // Parse da data (DD/MM/YYYY)
        const [dia, mes, ano] = compraData[compraData.length - 1].data.split("/");
        const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

        return {
            data,
            compra: compraAtual,
            venda: vendaAtual,
            variacao,
        };
    } catch (error) {
        console.error("Erro ao buscar dólar PTAX:", error);
        return null;
    }
}

/**
 * Busca taxa SELIC
 */
export async function fetchSELIC(): Promise<number | null> {
    try {
        const data = await fetchSerie(SERIES.SELIC, 1);
        if (!data.length) return null;
        return parseFloat(data[0].valor);
    } catch {
        return null;
    }
}
