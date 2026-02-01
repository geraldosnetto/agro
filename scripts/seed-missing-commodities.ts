/**
 * Script para adicionar commodities BASE que estavam faltando
 * Execute com: npx tsx scripts/seed-missing-commodities.ts
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { Categoria, Unidade } from '@prisma/client';

interface NewCommodity {
    slug: string;
    nome: string;
    categoria: Categoria;
    unidade: Unidade;
    descricao: string;
    icone: string;
}

// Estes são commodities BASE que deveriam existir mas não foram criados
const MISSING_COMMODITIES: NewCommodity[] = [
    {
        slug: 'algodao',
        nome: 'Algodão',
        categoria: 'FIBRAS',
        unidade: 'ARROBA',
        descricao: 'Algodão em Pluma - À vista',
        icone: '🌿',
    },
    {
        slug: 'arroz',
        nome: 'Arroz',
        categoria: 'GRAOS',
        unidade: 'SACA_60KG',
        descricao: 'Arroz em casca - RS/IRGA',
        icone: '🍚',
    },
    {
        slug: 'cafe-robusta',
        nome: 'Café Robusta',
        categoria: 'GRAOS',
        unidade: 'KG',
        descricao: 'Café Robusta - CEPEA/ESALQ',
        icone: '☕',
    },
    {
        slug: 'soja',
        nome: 'Soja',
        categoria: 'GRAOS',
        unidade: 'SACA_60KG',
        descricao: 'Soja em grão - Paranaguá/PR',
        icone: '🫘',
    },
    {
        slug: 'milho',
        nome: 'Milho',
        categoria: 'GRAOS',
        unidade: 'SACA_60KG',
        descricao: 'Milho - ESALQ/BM&FBovespa',
        icone: '🌽',
    },
    {
        slug: 'boi-gordo',
        nome: 'Boi Gordo',
        categoria: 'PECUARIA',
        unidade: 'ARROBA',
        descricao: 'Boi Gordo - CEPEA/ESALQ',
        icone: '🐄',
    },
    {
        slug: 'bezerro',
        nome: 'Bezerro',
        categoria: 'PECUARIA',
        unidade: 'CABECA',
        descricao: 'Bezerro - Mato Grosso do Sul',
        icone: '🐂',
    },
    {
        slug: 'cafe-arabica',
        nome: 'Café Arábica',
        categoria: 'GRAOS',
        unidade: 'KG',
        descricao: 'Café Arábica - CEPEA/ESALQ',
        icone: '☕',
    },
    {
        slug: 'acucar-cristal',
        nome: 'Açúcar Cristal',
        categoria: 'SUCROENERGETICO',
        unidade: 'TONELADA',
        descricao: 'Açúcar Cristal Branco - São Paulo',
        icone: '🍬',
    },
    {
        slug: 'etanol-hidratado',
        nome: 'Etanol Hidratado',
        categoria: 'SUCROENERGETICO',
        unidade: 'LITRO',
        descricao: 'Etanol Hidratado Combustível - São Paulo',
        icone: '⛽',
    },
    {
        slug: 'etanol-anidro',
        nome: 'Etanol Anidro',
        categoria: 'SUCROENERGETICO',
        unidade: 'LITRO',
        descricao: 'Etanol Anidro - São Paulo',
        icone: '⛽',
    },
    {
        slug: 'trigo',
        nome: 'Trigo',
        categoria: 'GRAOS',
        unidade: 'SACA_60KG',
        descricao: 'Trigo - Paraná',
        icone: '🌾',
    },
    {
        slug: 'frango',
        nome: 'Frango Congelado',
        categoria: 'PECUARIA',
        unidade: 'KG',
        descricao: 'Frango Congelado - São Paulo',
        icone: '🐔',
    },
    {
        slug: 'suino',
        nome: 'Suíno Vivo',
        categoria: 'PECUARIA',
        unidade: 'KG',
        descricao: 'Suíno Vivo - Regional',
        icone: '🐷',
    },
    {
        slug: 'mandioca',
        nome: 'Mandioca',
        categoria: 'OUTROS',
        unidade: 'TONELADA',
        descricao: 'Raiz de Mandioca',
        icone: '🥔',
    },
    {
        slug: 'leite',
        nome: 'Leite',
        categoria: 'PECUARIA',
        unidade: 'LITRO',
        descricao: 'Leite ao Produtor - Brasil',
        icone: '🥛',
    },
];

async function main() {
    console.log('🌱 Verificando e criando commodities faltando...\n');

    let created = 0;
    let skipped = 0;

    for (const commodity of MISSING_COMMODITIES) {
        const existing = await prisma.commodity.findUnique({
            where: { slug: commodity.slug },
        });

        if (existing) {
            console.log(`⏭️  ${commodity.nome} (${commodity.slug}) já existe`);
            skipped++;
            continue;
        }

        await prisma.commodity.create({
            data: {
                slug: commodity.slug,
                nome: commodity.nome,
                categoria: commodity.categoria,
                unidade: commodity.unidade,
                descricao: commodity.descricao,
                icone: commodity.icone,
                ativo: true,
            },
        });

        console.log(`✅ ${commodity.nome} (${commodity.slug}) criado!`);
        created++;
    }

    console.log(`\n📊 Resumo: ${created} criados, ${skipped} já existiam.`);
}

main()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
