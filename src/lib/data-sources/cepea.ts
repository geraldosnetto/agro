import { JSDOM } from 'jsdom';
import logger from '@/lib/logger';

interface CepeaData {
    valor: number;
    data: Date;
    variacaoDiaria?: number;
    variacaoMensal?: number;
}

// Data with praça information for multi-table scraping
export interface CepeaPracaData extends CepeaData {
    pracaIndex: number;
    pracaNome: string;
}

// Praça names per commodity (based on CEPEA table structure)
const PRACA_NAMES: Record<string, string[]> = {
    'soja': ['Paranaguá/PR', 'Porto Base'],
    'milho': ['ESALQ/BM&FBovespa'],
    'boi-gordo': ['Indicador CEPEA', 'Média SP', 'A Prazo'],
    'cafe-arabica': ['Indicador CEPEA'],
    'cafe-robusta': ['Indicador Robusta'],
    'bezerro': ['Indicador CEPEA'],
    'acucar-cristal': ['Cristal SP'],
    'etanol-hidratado': ['Hidratado SP'],
    'etanol-anidro': ['Anidro SP'],
    'trigo': ['Paraná'],
    'frango': ['Congelado'],
    'suino': ['Regional (MG/PR/RS)', 'Carcaça SP'],
    'algodao': ['Indicador CEPEA'],
    'arroz': ['Indicador CEPEA'],
    'mandioca': ['Indicador CEPEA'],
    'leite': ['Indicador CEPEA'],
};

interface CommodityConfig {
    url: string;
    keywords?: string[];
    tableIndex?: number;
    priceColumnIndex?: number; // Default 1
    varColumnIndex?: number; // Default priceColumnIndex + 1. Set -1 to disable.
}

const COMMODITY_CONFIG: Record<string, CommodityConfig> = {
    'soja': { url: 'https://www.cepea.org.br/br/indicador/soja.aspx' },
    'milho': { url: 'https://www.cepea.org.br/br/indicador/milho.aspx' },
    'boi-gordo': { url: 'https://www.cepea.org.br/br/indicador/boi-gordo.aspx' },
    'cafe-arabica': { url: 'https://www.cepea.org.br/br/indicador/cafe.aspx' },
    'bezerro': { url: 'https://www.cepea.org.br/br/indicador/bezerro.aspx' },
    'acucar-cristal': { url: 'https://www.cepea.org.br/br/indicador/acucar.aspx', keywords: ['Cristal', 'CRISTAL'] },
    'etanol-hidratado': { url: 'https://www.cepea.org.br/br/indicador/etanol.aspx', keywords: ['Hidratado', 'HIDRATADO'] },
    'etanol-anidro': { url: 'https://www.cepea.org.br/br/indicador/etanol.aspx', keywords: ['Anidro', 'ANIDRO'] },
    'trigo': { url: 'https://www.cepea.org.br/br/indicador/trigo.aspx', keywords: ['Paraná', 'PR'] },
    'frango': { url: 'https://www.cepea.org.br/br/indicador/frango.aspx', keywords: ['Congelado'] },
    'suino': { url: 'https://www.cepea.org.br/br/indicador/suino.aspx', tableIndex: 1 },
    'algodao': { url: 'https://www.cepea.org.br/br/indicador/algodao.aspx' },
    'arroz': { url: 'https://www.cepea.org.br/br/indicador/arroz.aspx' },
    'cafe-robusta': { url: 'https://www.cepea.org.br/br/indicador/cafe.aspx', tableIndex: 1, keywords: ['Robusta', 'ROBUSTA'] },
    'mandioca': { url: 'https://www.cepea.org.br/br/indicador/mandioca.aspx', priceColumnIndex: 2, varColumnIndex: -1 },
    'leite': { url: 'https://www.cepea.org.br/br/indicador/leite.aspx', priceColumnIndex: 2, varColumnIndex: -1 },
    // 'ovinos': { url: 'https://www.cepea.org.br/br/indicador/ovinos.aspx' }, // Tabela desconhecida ainda, manter
};

// Slugs válidos para validação
const VALID_SLUGS = new Set(Object.keys(COMMODITY_CONFIG));

export async function fetchCepeaSpotPrice(slug: string): Promise<CepeaData | null> {
    // Validação de whitelist para evitar injection
    if (!VALID_SLUGS.has(slug)) {
        logger.warn(`Slug inválido ou não configurado: ${slug}`);
        return null;
    }

    const config = COMMODITY_CONFIG[slug];

    try {
        // Usar fetch nativo em vez de exec (elimina command injection)
        const response = await fetch(config.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (!response.ok) {
            logger.error(`Erro HTTP ${response.status} ao buscar CEPEA para ${slug}`);
            return null;
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const tables = doc.querySelectorAll('table');

        if (tables.length === 0) {
            logger.error(`Nenhuma tabela encontrada em ${config.url}`);
            return null;
        }

        let targetTable: HTMLTableElement | null = null;

        // Estratégia de seleção de tabela
        if (config.keywords && config.keywords.length > 0) {
            for (const table of Array.from(tables)) {
                const tableText = table.textContent || '';
                const prevElementText = table.previousElementSibling?.textContent || '';
                const containerText = table.parentElement?.textContent || '';

                const combinedContext = (tableText + prevElementText + containerText).toUpperCase();

                const hasKeyword = config.keywords.some(k => combinedContext.includes(k.toUpperCase()));
                if (hasKeyword) {
                    targetTable = table;
                    break;
                }
            }
        }

        // Fallback or explicit index
        if (!targetTable && typeof config.tableIndex === 'number') {
            targetTable = tables[config.tableIndex];
        } else if (!targetTable) {
            targetTable = tables[0];
        }

        if (!targetTable) {
            logger.warn(`Tabela não encontrada para ${slug}`);
            return null;
        }

        // Parse da primeira linha de dados válida
        const rows = targetTable.querySelectorAll('tbody tr');
        let validRow = null;

        for (const row of Array.from(rows)) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const dataText = cells[0].textContent?.trim();
                // Regex para DD/MM/YYYY, MM/YYYY ou mmm/yy (suportar prefixos)
                if (dataText && (
                    /\d{1,2}\/\d{1,2}\/\d{4}/.test(dataText) ||
                    /\d{1,2}\/\d{4}/.test(dataText) ||
                    /[a-z]{3}\/\d{2}/i.test(dataText)
                )) {
                    validRow = row;
                    break;
                }
            }
        }

        if (!validRow) {
            logger.warn(`Nenhuma linha de dados válida encontrada na tabela para ${slug}`);
            return null;
        }

        const cells = validRow.querySelectorAll('td');
        const dataStr = cells[0].textContent?.trim();

        const priceIdx = config.priceColumnIndex || 1;
        const valorStr = cells[priceIdx]?.textContent?.trim();

        let varDiaStr = '';
        const varIdx = config.varColumnIndex !== undefined ? config.varColumnIndex : (priceIdx + 1);
        if (varIdx >= 0) {
            varDiaStr = cells[varIdx]?.textContent?.trim().replace('%', '') || '';
        }

        if (!dataStr || !valorStr) return null;

        const valor = parseValor(valorStr);
        const data = parseData(dataStr);
        const variacaoDiaria = varDiaStr ? parseValor(varDiaStr) : 0;

        // Validação dos valores parseados
        if (isNaN(valor) || valor <= 0) {
            logger.warn(`Valor inválido parseado para ${slug}: ${valorStr} -> ${valor}`);
            return null;
        }

        return { valor, data, variacaoDiaria };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Erro ao buscar dados CEPEA para ${slug}:`, { error: errorMessage });
        return null;
    }
}

/**
 * Fetch prices from ALL tables (praças) for a commodity
 * Returns array with data from each praça
 */
export async function fetchAllCepeaPrices(slug: string): Promise<CepeaPracaData[]> {
    if (!VALID_SLUGS.has(slug)) {
        logger.warn(`Slug inválido ou não configurado: ${slug}`);
        return [];
    }

    const config = COMMODITY_CONFIG[slug];
    const pracaNames = PRACA_NAMES[slug] || ['Indicador CEPEA'];
    const results: CepeaPracaData[] = [];

    try {
        const response = await fetch(config.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            logger.error(`Erro HTTP ${response.status} ao buscar CEPEA para ${slug}`);
            return [];
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const tables = doc.querySelectorAll('table');

        // Process each table as a different praça
        for (let tableIdx = 0; tableIdx < tables.length && tableIdx < pracaNames.length; tableIdx++) {
            const table = tables[tableIdx];
            const pracaNome = pracaNames[tableIdx];

            const rows = table.querySelectorAll('tbody tr');

            for (const row of Array.from(rows)) {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) continue;

                const dataText = cells[0].textContent?.trim();
                if (!dataText || !/\d{1,2}\/\d{1,2}\/\d{4}/.test(dataText)) continue;

                const priceIdx = config.priceColumnIndex || 1;
                const valorStr = cells[priceIdx]?.textContent?.trim();

                let varDiaStr = '';
                const varIdx = config.varColumnIndex !== undefined ? config.varColumnIndex : (priceIdx + 1);
                if (varIdx >= 0) {
                    varDiaStr = cells[varIdx]?.textContent?.trim().replace('%', '') || '';
                }

                if (!valorStr) continue;

                const valor = parseValor(valorStr);
                const data = parseData(dataText);
                const variacaoDiaria = varDiaStr ? parseValor(varDiaStr) : 0;

                if (isNaN(valor) || valor <= 0) continue;

                results.push({
                    valor,
                    data,
                    variacaoDiaria,
                    pracaIndex: tableIdx,
                    pracaNome
                });
            }
        }

        return results;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Erro ao buscar todas praças CEPEA para ${slug}:`, { error: errorMessage });
        return [];
    }
}

/**
 * Get available praças for a commodity
 */
export function getPracasForCommodity(slug: string): { index: number; nome: string }[] {
    const names = PRACA_NAMES[slug] || ['Indicador CEPEA'];
    return names.map((nome, index) => ({ index, nome }));
}

function parseValor(str: string): number {
    if (!str) return 0;
    const cleanStr = str.replace(/[^\d.,-]/g, '');
    const value = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
    return isNaN(value) ? 0 : value;
}

function parseData(str: string): Date {
    if (!str) return new Date();

    // 1. Tentar encontrar DD/MM/YYYY em qualquer lugar da string (Mandioca: "5 - 09/01/2026")
    const matchFull = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (matchFull) {
        const [, dia, mes, ano] = matchFull;
        return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, parseInt(dia)));
    }

    // 2. Tentar formato MM/YYYY (numérico)
    // Usar ^ para garantir que é MM/YYYY se não tiver dia, mas Mandioca pode ter tudo mistura.
    // Melhor verificar mmm/yy ou MM/YYYY isolado.
    const matchMonth = str.match(/^(\d{1,2})\/(\d{4})$/);
    if (matchMonth) {
        const [, mes, ano] = matchMonth;
        return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, 1));
    }

    // 3. Tentar formato mmm/yy (Leite: "nov/25")
    const matchMonthName = str.match(/([a-z]{3})\/(\d{2})/i);
    if (matchMonthName) {
        const [, mesStr, anoShort] = matchMonthName;
        const meses: Record<string, number> = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        const mesIndex = meses[mesStr.toLowerCase()];
        if (mesIndex !== undefined) {
            const fullYear = 2000 + parseInt(anoShort);
            return new Date(Date.UTC(fullYear, mesIndex, 1));
        }
    }

    return new Date();
}
