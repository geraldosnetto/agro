/**
 * Script para importar dados históricos do CEPEA dos arquivos XLS
 * Execute com: npx tsx scripts/import-cepea-historical.ts
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Mapeamento de títulos de arquivos para slugs de commodities
const FILE_TO_SLUG_MAP: Record<string, { slug: string; praca: string; estado: string }> = {
    // Açúcar
    'INDICADOR DO AÇÚCAR CRISTAL BRANCO': { slug: 'acucar-cristal', praca: 'São Paulo', estado: 'SP' },
    'Indicador Açúcar Cristal - Santos': { slug: 'acucar-cristal', praca: 'Santos (FOB)', estado: 'SP' },
    'Indicador do Açúcar Cristal Empacotado': { slug: 'acucar-empacotado', praca: 'São Paulo', estado: 'SP' },
    'Indicador do Açúcar Refinado Amorfo': { slug: 'acucar-refinado', praca: 'São Paulo', estado: 'SP' },
    'Indicador Mensal do Açúcar VHP': { slug: 'acucar-vhp', praca: 'Exportação', estado: 'SP' },
    'Indicador Mensal do Açúcar Branco': { slug: 'acucar-cristal', praca: 'Mensal SP', estado: 'SP' },
    'Indicador Semanal do Açúcar CEPEA/ESALQ Alagoas': { slug: 'acucar-cristal', praca: 'Alagoas', estado: 'AL' },
    'Indicador Mensal do Açúcar CEPEA/ESALQ Alagoas': { slug: 'acucar-cristal', praca: 'Alagoas (Mensal)', estado: 'AL' },
    'Indicador Mensal do Açúcar CEPEA/ESALQ Paraíba': { slug: 'acucar-cristal', praca: 'Paraíba', estado: 'PB' },
    'Indicador Mensal do Açúcar CEPEA/ESALQ Pernambuco': { slug: 'acucar-cristal', praca: 'Pernambuco', estado: 'PE' },

    // Etanol
    'INDICADOR SEMANAL DO ETANOL HIDRATADO COMBUSTÍVEL': { slug: 'etanol-hidratado', praca: 'São Paulo', estado: 'SP' },
    'INDICADOR SEMANAL DO ETANOL ANIDRO': { slug: 'etanol-anidro', praca: 'São Paulo', estado: 'SP' },
    'Indicador Semanal do Etanol Hidratado Outros Fins': { slug: 'etanol-hidratado', praca: 'SP - Outros Fins', estado: 'SP' },
    'Indicador Diário do Etanol Hidratado ESALQ/BM&FBovespa': { slug: 'etanol-hidratado', praca: 'BM&FBovespa', estado: 'SP' },
    'Indicador Semanal do Etanol Hidratado CEPEA/ESALQ - Mato Gro': { slug: 'etanol-hidratado', praca: 'Mato Grosso', estado: 'MT' },
    'Indicador Semanal do Etanol Anidro CEPEA/ESALQ - Mato Grosso': { slug: 'etanol-anidro', praca: 'Mato Grosso', estado: 'MT' },
    'Indicador Semanal do Etanol Hidratado Combustível CEPEA/ESAL': { slug: 'etanol-hidratado', praca: 'Goiás', estado: 'GO' },
    'Indicador Semanal do Etanol Anidro Combustível CEPEA/ESALQ -': { slug: 'etanol-anidro', praca: 'Goiás', estado: 'GO' },
    'Indicador semanal do etanol hidratado combustível CEPEA/Esal': { slug: 'etanol-hidratado', praca: 'Paraíba', estado: 'PB' },
    'Indicador Semanal de Etanol anidro CEPEA/ESALQ - PARAÍBA': { slug: 'etanol-anidro', praca: 'Paraíba', estado: 'PB' },

    // Algodão
    'Indicador do Algodão em Pluma CEPEA/ESALQ - À vista': { slug: 'algodao', praca: 'À Vista', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - Prazo de 8 dias': { slug: 'algodao-8dias', praca: 'Prazo 8 dias', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - Prazo de 15 dias': { slug: 'algodao-15dias', praca: 'Prazo 15 dias', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - Prazo de 30 dias': { slug: 'algodao-30dias', praca: 'Prazo 30 dias', estado: 'SP' },

    // Arroz
    'INDICADOR DO ARROZ EM CASCA CEPEA/IRGA-RS': { slug: 'arroz', praca: 'RS', estado: 'RS' },

    // Bezerro
    'INDICADOR DO BEZERRO CEPEA/ESALQ - MATO GROSSO DO SUL': { slug: 'bezerro', praca: 'Mato Grosso do Sul', estado: 'MS' },
    'Bezerro - Média Estado de São Paulo': { slug: 'bezerro', praca: 'São Paulo', estado: 'SP' },

    // Boi Gordo
    'INDICADOR DO BOI GORDO CEPEA/ESALQ': { slug: 'boi-gordo', praca: 'ESALQ/BM&FBovespa', estado: 'SP' },
    'Boi Gordo - Média a Prazo Estado de São Paulo': { slug: 'boi-gordo', praca: 'SP - A Prazo', estado: 'SP' },

    // Café
    'INDICADOR DO CAFÉ ARÁBICA CEPEA/ESALQ': { slug: 'cafe-arabica', praca: 'ESALQ', estado: 'SP' },
    'INDICADOR DO CAFÉ ROBUSTA CEPEA/ESALQ': { slug: 'cafe-robusta', praca: 'ESALQ', estado: 'SP' },

    // Feijão
    'Preços do Feijão Carioca - peneira 12': { slug: 'feijao-carioca', praca: 'SP - P12', estado: 'SP' },
    'Preços do Feijão Carioca - Notas 8': { slug: 'feijao-carioca', praca: 'SP - N8', estado: 'SP' },
    'Preços do Feijão Preto Tipo 1': { slug: 'feijao-preto', praca: 'São Paulo', estado: 'SP' },

    // Frango
    'PREÇOS DO FRANGO CONGELADO CEPEA/ESALQ': { slug: 'frango', praca: 'Congelado SP', estado: 'SP' },
    'PREÇOS DO FRANGO RESFRIADO CEPEA/ESALQ': { slug: 'frango-resfriado', praca: 'Resfriado SP', estado: 'SP' },

    // Leite
    'LEITE AO PRODUTOR CEPEA/ESALQ': { slug: 'leite', praca: 'Brasil', estado: 'BR' },

    // Mandioca
    'PREÇOS DA RAIZ DE MANDIOCA': { slug: 'mandioca', praca: 'Raiz', estado: 'PR' },
    'PREÇOS DA FÉCULA DE MANDIOCA': { slug: 'mandioca', praca: 'Fécula', estado: 'PR' },
    'PREÇOS DA FARINHA DE MANDIOCA SECA FINA': { slug: 'mandioca', praca: 'Farinha Fina', estado: 'PR' },
    'PREÇOS DA FARINHA DE MANDIOCA SECA GROSSA': { slug: 'mandioca', praca: 'Farinha Grossa', estado: 'PR' },

    // Milho
    'INDICADOR DO MILHO ESALQ/BM&FBOVESPA': { slug: 'milho', praca: 'ESALQ/BM&FBovespa', estado: 'SP' },

    // Ovos
    'PREÇOS MÉDIOS DE OVOS CEPEA': { slug: 'ovos', praca: 'São Paulo', estado: 'SP' },

    // Soja
    'INDICADOR DA SOJA CEPEA/ESALQ - PARANAGUÁ': { slug: 'soja', praca: 'Paranaguá', estado: 'PR' },
    'INDICADOR DA SOJA CEPEA/ESALQ - PARANÁ': { slug: 'soja', praca: 'Paraná', estado: 'PR' },

    // Suíno
    'INDICADOR DO SUÍNO VIVO CEPEA/ESALQ': { slug: 'suino', praca: 'Regional', estado: 'SP' },
    'PREÇOS DA CARCAÇA SUÍNA ESPECIAL': { slug: 'suino', praca: 'Carcaça SP', estado: 'SP' },

    // Tilápia
    'Preços da tilápia': { slug: 'tilapia', praca: 'São Paulo', estado: 'SP' },

    // Trigo
    'PREÇO MÉDIO DO TRIGO CEPEA/ESALQ - PARANÁ': { slug: 'trigo', praca: 'Paraná', estado: 'PR' },
    'PREÇO MÉDIO DO TRIGO CEPEA/ESALQ - RIO GRANDE DO SUL': { slug: 'trigo', praca: 'Rio Grande do Sul', estado: 'RS' },
};

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // DD/MM/YYYY
    const matchFull = String(dateStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (matchFull) {
        const [, dia, mes, ano] = matchFull;
        return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, parseInt(dia)));
    }

    // MM/YYYY
    const matchMonth = String(dateStr).match(/^(\d{1,2})\/(\d{4})$/);
    if (matchMonth) {
        const [, mes, ano] = matchMonth;
        return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, 1));
    }

    // mmm/yy
    const matchMonthName = String(dateStr).match(/([a-z]{3})\/(\d{2})/i);
    if (matchMonthName) {
        const [, mesStr, anoShort] = matchMonthName;
        const meses: Record<string, number> = {
            'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        const mesIndex = meses[mesStr.toLowerCase()];
        if (mesIndex !== undefined) {
            return new Date(Date.UTC(2000 + parseInt(anoShort), mesIndex, 1));
        }
    }

    // Tentar como Excel serial date
    const num = parseFloat(String(dateStr));
    if (!isNaN(num) && num > 30000 && num < 50000) {
        // Excel date serial number
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
    }

    return null;
}

function parseValue(valueStr: string | number): number | null {
    if (valueStr === null || valueStr === undefined) return null;

    const str = String(valueStr);
    const cleanStr = str.replace(/[^0-9.,-]/g, '');
    const value = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));

    return isNaN(value) || value <= 0 ? null : value;
}

function findSlugForTitle(title: string): { slug: string; praca: string; estado: string } | null {
    for (const [key, value] of Object.entries(FILE_TO_SLUG_MAP)) {
        if (title.includes(key)) {
            return value;
        }
    }
    return null;
}

async function importFile(filePath: string): Promise<{ imported: number; skipped: number; error?: string }> {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get title from first cell
        const titleCell = sheet['A1'] || sheet['A2'];
        const title = titleCell?.v ? String(titleCell.v) : '';

        const mapping = findSlugForTitle(title);
        if (!mapping) {
            return { imported: 0, skipped: 0, error: `Título não mapeado: ${title.substring(0, 60)}` };
        }

        // Get commodity
        const commodity = await prisma.commodity.findUnique({
            where: { slug: mapping.slug }
        });

        if (!commodity) {
            return { imported: 0, skipped: 0, error: `Commodity não encontrado: ${mapping.slug}` };
        }

        // Convert sheet to JSON
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

        let imported = 0;
        let skipped = 0;

        // Find header row (first row with "Data" or similar)
        let startRow = 0;
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row[0] && /data|dia/i.test(String(row[0]))) {
                startRow = i + 1;
                break;
            }
        }

        // Process data rows
        for (let i = startRow; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[0]) continue;

            const dataRef = parseDate(String(row[0]));
            if (!dataRef) continue;

            // Try different columns for value
            let valor: number | null = null;
            for (let col = 1; col < Math.min(5, row.length); col++) {
                valor = parseValue(row[col]);
                if (valor !== null && valor > 0) break;
            }

            if (!valor) continue;

            // Check if already exists
            const existing = await prisma.cotacao.findUnique({
                where: {
                    commodityId_praca_dataReferencia: {
                        commodityId: commodity.id,
                        praca: mapping.praca,
                        dataReferencia: dataRef
                    }
                }
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Insert
            await prisma.cotacao.create({
                data: {
                    commodityId: commodity.id,
                    valor: valor,
                    praca: mapping.praca,
                    estado: mapping.estado,
                    fonte: 'CEPEA',
                    fonteUrl: 'https://www.cepea.esalq.usp.br',
                    dataReferencia: dataRef,
                }
            });

            imported++;
        }

        return { imported, skipped };

    } catch (error) {
        return { imported: 0, skipped: 0, error: error instanceof Error ? error.message : String(error) };
    }
}

async function main() {
    console.log('📊 Iniciando importação de dados históricos CEPEA...\n');

    const folder = '/mnt/e/SITES/agro/historico';
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.xls')).sort();

    console.log(`📁 Encontrados ${files.length} arquivos XLS\n`);

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const file of files) {
        const filePath = path.join(folder, file);
        const result = await importFile(filePath);

        if (result.error) {
            console.log(`❌ ${file}: ${result.error}`);
            totalErrors++;
        } else if (result.imported > 0) {
            console.log(`✅ ${file}: ${result.imported} importados, ${result.skipped} existentes`);
            totalImported += result.imported;
            totalSkipped += result.skipped;
        } else {
            console.log(`⏭️  ${file}: ${result.skipped} já existiam`);
            totalSkipped += result.skipped;
        }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`📊 RESUMO DA IMPORTAÇÃO`);
    console.log(`   ✅ Importados: ${totalImported}`);
    console.log(`   ⏭️  Já existiam: ${totalSkipped}`);
    console.log(`   ❌ Erros: ${totalErrors}`);
    console.log('═══════════════════════════════════════════');
}

main()
    .catch((e) => {
        console.error('❌ Erro fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
