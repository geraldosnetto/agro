/**
 * Script para CORRIGIR dados importados incorretamente
 * O problema: parseValue tratava números do Excel incorretamente
 * 65.87 → "65.87" → remove ponto → "6587" → 6587 (100x maior!)
 * 
 * Execute com: npx tsx scripts/fix-corrupted-import.ts
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Mapeamento de títulos (mesmo do script anterior)
const FILE_TO_SLUG_MAP: Record<string, { slug: string; praca: string; estado: string }> = {
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
    'Indicador Mensal do Etanol Hidratado Combustível CEPEA/ESALQ': { slug: 'etanol-hidratado', praca: 'Mensal SP', estado: 'SP' },
    'Indicador Mensal do Etanol Anidro Combustível CEPEA/ESALQ': { slug: 'etanol-anidro', praca: 'Mensal SP', estado: 'SP' },
    'Indicador Mensal do Etanol Hidratado Outros Fins CEPEA/ESALQ': { slug: 'etanol-hidratado', praca: 'Mensal Outros Fins', estado: 'SP' },
    'Indicador Mensal do Etanol Anidro Outros Fins CEPEA/ESALQ': { slug: 'etanol-anidro', praca: 'Mensal Outros Fins', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - À vista': { slug: 'algodao', praca: 'À Vista', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - Prazo de 8 dias': { slug: 'algodao-8dias', praca: 'Prazo 8 dias', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - Prazo de 15 dias': { slug: 'algodao-15dias', praca: 'Prazo 15 dias', estado: 'SP' },
    'Indicador do Algodão em Pluma CEPEA/ESALQ - Prazo de 30 dias': { slug: 'algodao-30dias', praca: 'Prazo 30 dias', estado: 'SP' },
    'INDICADOR DO ARROZ EM CASCA CEPEA/IRGA-RS': { slug: 'arroz', praca: 'RS', estado: 'RS' },
    'INDICADOR DO BEZERRO CEPEA/ESALQ - MATO GROSSO DO SUL': { slug: 'bezerro', praca: 'Mato Grosso do Sul', estado: 'MS' },
    'Bezerro - Média Estado de São Paulo': { slug: 'bezerro', praca: 'São Paulo', estado: 'SP' },
    'Peso Médio do Bezerro - MS': { slug: 'bezerro', praca: 'Peso Médio MS', estado: 'MS' },
    'INDICADOR DO BOI GORDO CEPEA/ESALQ': { slug: 'boi-gordo', praca: 'ESALQ/BM&FBovespa', estado: 'SP' },
    'Boi Gordo - Média a Prazo Estado de São Paulo': { slug: 'boi-gordo', praca: 'SP - A Prazo', estado: 'SP' },
    'INDICADOR DO CAFÉ ARÁBICA CEPEA/ESALQ': { slug: 'cafe-arabica', praca: 'ESALQ', estado: 'SP' },
    'INDICADOR DO CAFÉ ROBUSTA CEPEA/ESALQ': { slug: 'cafe-robusta', praca: 'ESALQ', estado: 'SP' },
    'Preços do Feijão Carioca - peneira 12': { slug: 'feijao-carioca', praca: 'SP - P12', estado: 'SP' },
    'Preços do Feijão Carioca - Notas 8': { slug: 'feijao-carioca', praca: 'SP - N8', estado: 'SP' },
    'Preços do Feijão Preto Tipo 1': { slug: 'feijao-preto', praca: 'São Paulo', estado: 'SP' },
    'PREÇOS DO FRANGO CONGELADO CEPEA/ESALQ': { slug: 'frango', praca: 'Congelado SP', estado: 'SP' },
    'PREÇOS DO FRANGO RESFRIADO CEPEA/ESALQ': { slug: 'frango-resfriado', praca: 'Resfriado SP', estado: 'SP' },
    'LEITE AO PRODUTOR CEPEA/ESALQ': { slug: 'leite', praca: 'Brasil', estado: 'BR' },
    'PREÇOS DA RAIZ DE MANDIOCA': { slug: 'mandioca', praca: 'Raiz', estado: 'PR' },
    'PREÇOS DA FÉCULA DE MANDIOCA': { slug: 'mandioca', praca: 'Fécula', estado: 'PR' },
    'PREÇOS DA FARINHA DE MANDIOCA SECA FINA': { slug: 'mandioca', praca: 'Farinha Fina', estado: 'PR' },
    'PREÇOS DA FARINHA DE MANDIOCA SECA GROSSA': { slug: 'mandioca', praca: 'Farinha Grossa', estado: 'PR' },
    'INDICADOR DO MILHO ESALQ/BM&FBOVESPA': { slug: 'milho', praca: 'ESALQ/BM&FBovespa', estado: 'SP' },
    'PREÇOS MÉDIOS DE OVOS CEPEA': { slug: 'ovos', praca: 'São Paulo', estado: 'SP' },
    'INDICADOR DA SOJA CEPEA/ESALQ - PARANAGUÁ': { slug: 'soja', praca: 'Paranaguá', estado: 'PR' },
    'INDICADOR DA SOJA CEPEA/ESALQ - PARANÁ': { slug: 'soja', praca: 'Paraná', estado: 'PR' },
    'INDICADOR DO SUÍNO VIVO CEPEA/ESALQ': { slug: 'suino', praca: 'Regional', estado: 'SP' },
    'PREÇOS DA CARCAÇA SUÍNA ESPECIAL': { slug: 'suino', praca: 'Carcaça SP', estado: 'SP' },
    'Indicador do Suíno Vivo CEPEA/ESALQ - MENSAL': { slug: 'suino', praca: 'Mensal', estado: 'SP' },
    'Preços da tilápia': { slug: 'tilapia', praca: 'São Paulo', estado: 'SP' },
    'PREÇO MÉDIO DO TRIGO CEPEA/ESALQ - PARANÁ': { slug: 'trigo', praca: 'Paraná', estado: 'PR' },
    'PREÇO MÉDIO DO TRIGO CEPEA/ESALQ - RIO GRANDE DO SUL': { slug: 'trigo', praca: 'Rio Grande do Sul', estado: 'RS' },
};

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const str = String(dateStr);

    const matchFull = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (matchFull) {
        const [, dia, mes, ano] = matchFull;
        return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, parseInt(dia)));
    }

    const matchMonth = str.match(/^(\d{1,2})\/(\d{4})$/);
    if (matchMonth) {
        const [, mes, ano] = matchMonth;
        return new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, 1));
    }

    const matchMonthName = str.match(/([a-z]{3})\/(\d{2})/i);
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

    const num = parseFloat(str);
    if (!isNaN(num) && num > 30000 && num < 50000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        return new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
    }

    return null;
}

// FUNÇÃO CORRIGIDA - trata números do Excel corretamente
function parseValue(valueStr: string | number): number | null {
    if (valueStr === null || valueStr === undefined) return null;

    // Se já é um número, usar diretamente!
    if (typeof valueStr === 'number') {
        return isNaN(valueStr) || valueStr <= 0 ? null : valueStr;
    }

    // Se é string, fazer parse brasileiro (vírgula = decimal)
    const str = String(valueStr);

    // Se tem virgula, é formato brasileiro: "1.234,56" → 1234.56
    if (str.includes(',')) {
        const value = parseFloat(str.replace(/\./g, '').replace(',', '.'));
        return isNaN(value) || value <= 0 ? null : value;
    }

    // Senão, usar parseFloat direto (formato internacional)
    const value = parseFloat(str.replace(/[^0-9.-]/g, ''));
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

let commodityCache: Map<string, string> = new Map();

async function loadCommodityCache() {
    const commodities = await prisma.commodity.findMany({ select: { id: true, slug: true } });
    commodityCache = new Map(commodities.map(c => [c.slug, c.id]));
    console.log(`📦 Cache carregado: ${commodityCache.size} commodities`);
}

interface CotacaoData {
    commodityId: string;
    valor: number;
    praca: string;
    estado: string;
    fonte: string;
    fonteUrl: string;
    dataReferencia: Date;
}

async function importFile(filePath: string): Promise<{ imported: number; error?: string }> {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const titleCell = sheet['A1'] || sheet['A2'];
        const title = titleCell?.v ? String(titleCell.v) : '';

        const mapping = findSlugForTitle(title);
        if (!mapping) {
            return { imported: 0, error: `Título não mapeado: ${title.substring(0, 60)}` };
        }

        const commodityId = commodityCache.get(mapping.slug);
        if (!commodityId) {
            return { imported: 0, error: `Commodity não encontrado: ${mapping.slug}` };
        }

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

        let startRow = 0;
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (row && row[0] && /data|dia/i.test(String(row[0]))) {
                startRow = i + 1;
                break;
            }
        }

        const toInsert: CotacaoData[] = [];

        for (let i = startRow; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[0]) continue;

            const dataRef = parseDate(String(row[0]));
            if (!dataRef) continue;

            let valor: number | null = null;
            for (let col = 1; col < Math.min(5, row.length); col++) {
                valor = parseValue(row[col]);
                if (valor !== null && valor > 0) break;
            }

            if (!valor) continue;

            toInsert.push({
                commodityId,
                valor,
                praca: mapping.praca,
                estado: mapping.estado,
                fonte: 'CEPEA',
                fonteUrl: 'https://www.cepea.esalq.usp.br',
                dataReferencia: dataRef,
            });
        }

        if (toInsert.length > 0) {
            const batchSize = 500;
            for (let i = 0; i < toInsert.length; i += batchSize) {
                const batch = toInsert.slice(i, i + batchSize);
                await prisma.cotacao.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
            }
        }

        return { imported: toInsert.length };

    } catch (error) {
        return { imported: 0, error: error instanceof Error ? error.message : String(error) };
    }
}

async function main() {
    console.log('🔧 CORREÇÃO DE DADOS CORROMPIDOS\n');
    const startTime = Date.now();

    // 1. Deletar TODOS os dados importados do CEPEA (fonte = 'CEPEA')
    console.log('🗑️  Deletando dados corrompidos...');
    const deleted = await prisma.cotacao.deleteMany({
        where: { fonte: 'CEPEA' }
    });
    console.log(`   Deletados: ${deleted.count} registros\n`);

    // 2. Reimportar com função corrigida
    console.log('📥 Reimportando com valores corretos...\n');

    await loadCommodityCache();

    const folder = '/mnt/e/SITES/agro/historico';
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.xls')).sort();

    console.log(`📁 Encontrados ${files.length} arquivos XLS\n`);

    let totalImported = 0;
    let totalErrors = 0;

    for (const file of files) {
        const filePath = path.join(folder, file);
        const result = await importFile(filePath);

        if (result.error) {
            console.log(`❌ ${file}: ${result.error}`);
            totalErrors++;
        } else if (result.imported > 0) {
            console.log(`✅ ${file}: ${result.imported} importados`);
            totalImported += result.imported;
        } else {
            console.log(`⏭️  ${file}: nenhum dado`);
        }
    }

    const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(1);

    console.log('\n═══════════════════════════════════════════');
    console.log(`📊 RESUMO DA CORREÇÃO`);
    console.log(`   🗑️  Deletados: ${deleted.count}`);
    console.log(`   ✅ Reimportados: ${totalImported}`);
    console.log(`   ❌ Erros: ${totalErrors}`);
    console.log(`   ⏱️  Tempo: ${elapsedMinutes} minutos`);
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
