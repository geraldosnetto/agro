import { JSDOM } from 'jsdom';

interface CepeaData {
    valor: number;
    data: Date;
    variacaoDiaria?: number;
    variacaoMensal?: number;
}

interface CommodityConfig {
    url: string;
    keywords?: string[];
    tableIndex?: number;
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
    'suino': { url: 'https://www.cepea.org.br/br/indicador/suino.aspx', keywords: ['Vivo'] },
};

// Slugs válidos para validação
const VALID_SLUGS = new Set(Object.keys(COMMODITY_CONFIG));

export async function fetchCepeaSpotPrice(slug: string): Promise<CepeaData | null> {
    // Validação de whitelist para evitar injection
    if (!VALID_SLUGS.has(slug)) {
        console.warn(`Slug inválido ou não configurado: ${slug}`);
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
            console.error(`Erro HTTP ${response.status} ao buscar CEPEA para ${slug}`);
            return null;
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const tables = doc.querySelectorAll('table');

        if (tables.length === 0) {
            console.error(`Nenhuma tabela encontrada em ${config.url}`);
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
        } else {
            targetTable = tables[config.tableIndex || 0];
        }

        if (!targetTable) {
            console.warn(`Tabela não encontrada para ${slug} com keywords: ${config.keywords}`);
            if (tables.length > 0) targetTable = tables[0];
            else return null;
        }

        // Parse da primeira linha de dados válida
        const rows = targetTable.querySelectorAll('tbody tr');
        let validRow = null;

        for (const row of Array.from(rows)) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const dataText = cells[0].textContent?.trim();
                if (dataText && /\d{1,2}\/\d{1,2}\/\d{4}/.test(dataText)) {
                    validRow = row;
                    break;
                }
            }
        }

        if (!validRow) {
            console.warn(`Nenhuma linha de dados válida encontrada na tabela para ${slug}`);
            return null;
        }

        const cells = validRow.querySelectorAll('td');
        const dataStr = cells[0].textContent?.trim();
        const valorStr = cells[1].textContent?.trim();
        const varDiaStr = cells[2]?.textContent?.trim().replace('%', '');

        if (!dataStr || !valorStr) return null;

        const valor = parseValor(valorStr);
        const data = parseData(dataStr);
        const variacaoDiaria = varDiaStr ? parseValor(varDiaStr) : 0;

        // Validação dos valores parseados
        if (isNaN(valor) || valor <= 0) {
            console.warn(`Valor inválido parseado para ${slug}: ${valorStr} -> ${valor}`);
            return null;
        }

        return { valor, data, variacaoDiaria };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erro ao buscar dados CEPEA para ${slug}:`, { error: errorMessage });
        return null;
    }
}

function parseValor(str: string): number {
    if (!str) return 0;
    const cleanStr = str.replace(/[^\d.,-]/g, '');
    const value = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
    return isNaN(value) ? 0 : value;
}

function parseData(str: string): Date {
    if (!str) return new Date();
    // Validar formato DD/MM/YYYY
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return new Date();
    const [, dia, mes, ano] = match;
    // Usar UTC para evitar problemas de timezone
    return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, parseInt(dia)));
}
