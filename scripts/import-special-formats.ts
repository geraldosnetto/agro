/**
 * Script para importar arquivos com formato especial (Leite e Suíno Mensal)
 * Execute com: npx tsx scripts/import-special-formats.ts
 */

import * as path from 'path';
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import * as XLSX from 'xlsx';

const MESES: Record<string, number> = {
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
};

interface CotacaoData {
    commodityId: string;
    valor: number;
    praca: string;
    estado: string;
    fonte: string;
    fonteUrl: string;
    dataReferencia: Date;
}

async function importLeite() {
    console.log('\n🥛 Importando Leite ao Produtor...');

    const commodity = await prisma.commodity.findUnique({ where: { slug: 'leite' } });
    if (!commodity) {
        console.log('❌ Commodity leite não encontrado');
        return 0;
    }

    const wb = XLSX.readFile(path.join(process.cwd(), 'historico', 'CEPEA_20260131122823.xls'));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

    const toInsert: CotacaoData[] = [];

    // Formato: Ano | Mês | Estado | Preço
    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 4) continue;

        const ano = Number(row[0]);
        const mesStr = String(row[1]).toLowerCase().substring(0, 3);
        const estado = String(row[2]);
        const valor = Number(row[3]);

        if (isNaN(ano) || isNaN(valor) || valor <= 0) continue;

        const mes = MESES[mesStr] ?? (Number(row[1]) - 1);
        if (mes === undefined || mes < 0 || mes > 11) continue;

        const dataRef = new Date(Date.UTC(ano, mes, 1));

        toInsert.push({
            commodityId: commodity.id,
            valor,
            praca: estado,
            estado,
            fonte: 'CEPEA',
            fonteUrl: 'https://www.cepea.esalq.usp.br',
            dataReferencia: dataRef,
        });
    }

    // Batch insert
    if (toInsert.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            await prisma.cotacao.createMany({ data: batch, skipDuplicates: true });
        }
    }

    console.log(`✅ Leite: ${toInsert.length} registros importados`);
    return toInsert.length;
}

async function importSuinoMensal() {
    console.log('\n🐷 Importando Suíno Mensal por Estado...');

    const commodity = await prisma.commodity.findUnique({ where: { slug: 'suino' } });
    if (!commodity) {
        console.log('❌ Commodity suino não encontrado');
        return 0;
    }

    const wb = XLSX.readFile(path.join(process.cwd(), 'historico', 'CEPEA_20260131123121.xls'));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

    // Header: Ano | Mês | MG | PR | RS | SC | SP
    const estados = ['MG', 'PR', 'RS', 'SC', 'SP'];

    const toInsert: CotacaoData[] = [];

    for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 7) continue;

        const ano = Number(row[0]);
        const mes = Number(row[1]) - 1;

        if (isNaN(ano) || isNaN(mes) || mes < 0 || mes > 11) continue;

        const dataRef = new Date(Date.UTC(ano, mes, 1));

        // Importar cada estado
        for (let j = 0; j < estados.length; j++) {
            const valor = Number(row[j + 2]);
            if (isNaN(valor) || valor <= 0) continue;

            toInsert.push({
                commodityId: commodity.id,
                valor,
                praca: `Mensal ${estados[j]}`,
                estado: estados[j],
                fonte: 'CEPEA',
                fonteUrl: 'https://www.cepea.esalq.usp.br',
                dataReferencia: dataRef,
            });
        }
    }

    // Batch insert
    if (toInsert.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            await prisma.cotacao.createMany({ data: batch, skipDuplicates: true });
        }
    }

    console.log(`✅ Suíno Mensal: ${toInsert.length} registros importados`);
    return toInsert.length;
}

async function main() {
    console.log('📊 Importando arquivos com formato especial...');
    const startTime = Date.now();

    const leiteCount = await importLeite();
    const suinoCount = await importSuinoMensal();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════');
    console.log(`📊 RESUMO`);
    console.log(`   🥛 Leite: ${leiteCount} registros`);
    console.log(`   🐷 Suíno: ${suinoCount} registros`);
    console.log(`   ⏱️  Tempo: ${elapsed}s`);
    console.log('═══════════════════════════════════════════');
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
