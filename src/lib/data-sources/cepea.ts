
import { JSDOM } from 'jsdom';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CepeaData {
    valor: number;
    data: Date;
    variacaoDiaria?: number;
    variacaoMensal?: number;
}

interface CommodityConfig {
    url: string;
    keywords?: string[]; // Palavras-chave para identificar a tabela correta (ex: "Anidro", "Paraná")
    tableIndex?: number; // Fallback: índice da tabela se não tiver keywords
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
    'trigo': { url: 'https://www.cepea.org.br/br/indicador/trigo.aspx', keywords: ['Paraná', 'PR'] }, // Referência PR
    'frango': { url: 'https://www.cepea.org.br/br/indicador/frango.aspx', keywords: ['Congelado'] }, // Default Congelado
    'suino': { url: 'https://www.cepea.org.br/br/indicador/suino.aspx', keywords: ['Vivo'] }, // Suíno Vivo
};

export async function fetchCepeaSpotPrice(slug: string): Promise<CepeaData | null> {
    const config = COMMODITY_CONFIG[slug];
    if (!config) {
        console.warn(`Configuração não encontrada para commodity: ${slug}`);
        return null;
    }

    try {
        console.log(`Buscando dados CEPEA para ${slug} [${config.url}]...`);

        // Timeout de 30s e User-Agent comum para evitar bloqueios simples
        const cmd = `curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --max-time 30 "${config.url}"`;
        const { stdout: html } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });

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
            // Procura tabela que contenha a keyword ou cujo título anterior contenha
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
            // Default: primeira tabela
            targetTable = tables[config.tableIndex || 0];
        }

        if (!targetTable) {
            console.warn(`Tabela não encontrada para ${slug} com keywords: ${config.keywords}`);
            // Fallback: Tenta a primeira se não achou específica, mas loga aviso
            if (tables.length > 0) targetTable = tables[0];
            else return null;
        }

        // Parse da primeira linha de dados válida
        const rows = targetTable.querySelectorAll('tbody tr');
        let validRow = null;

        for (const row of Array.from(rows)) {
            const cells = row.querySelectorAll('td');
            // Precisa ter pelo menos Data e Valor (2 células) e a primeira deve parecer uma data
            if (cells.length >= 2) {
                const dataText = cells[0].textContent?.trim();
                // Validação básica de data DD/MM/YYYY
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
        const dataStr = cells[0].textContent?.trim(); // Ex: 16/01/2026
        const valorStr = cells[1].textContent?.trim(); // Ex: 131,45
        const varDiaStr = cells[2]?.textContent?.trim().replace('%', ''); // Ex: -0,11

        if (!dataStr || !valorStr) return null;

        return {
            valor: parseValor(valorStr),
            data: parseData(dataStr),
            variacaoDiaria: varDiaStr ? parseValor(varDiaStr) : 0
        };

    } catch (error) {
        console.error(`Erro ao buscar dados CEPEA para ${slug}:`, error);
        return null; // Retorna null para tentar novamente ou logar falha
    }
}

function parseValor(str: string): number {
    if (!str) return 0;
    // Remove R$, espaços e converte
    const cleanStr = str.replace(/[^\d.,-]/g, '');
    // Remove pontos de milhar e troca vírgula por ponto
    return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
}

function parseData(str: string): Date {
    if (!str) return new Date();
    const [dia, mes, ano] = str.split('/');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
}
