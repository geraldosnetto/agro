/**
 * Script para adicionar novos commodities ao banco de dados
 * Execute com: npx tsx scripts/seed-new-commodities.ts
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

const NEW_COMMODITIES: NewCommodity[] = [
    // === GRÃOS ===
    {
        slug: 'feijao-carioca',
        nome: 'Feijão Carioca',
        categoria: 'GRAOS',
        unidade: 'SACA_60KG',
        descricao: 'Feijão Carioca - Peneira 12 e/ou notas 9 ou superior',
        icone: '🫘',
    },
    {
        slug: 'feijao-preto',
        nome: 'Feijão Preto',
        categoria: 'GRAOS',
        unidade: 'SACA_60KG',
        descricao: 'Feijão Preto Tipo 1',
        icone: '🫘',
    },

    // === PECUÁRIA ===
    {
        slug: 'frango-resfriado',
        nome: 'Frango Resfriado',
        categoria: 'PECUARIA',
        unidade: 'KG',
        descricao: 'Frango resfriado inteiro - Estado de São Paulo',
        icone: '🐔',
    },
    {
        slug: 'ovos',
        nome: 'Ovos',
        categoria: 'OUTROS',
        unidade: 'DUZIA',
        descricao: 'Preços médios de ovos - CEPEA',
        icone: '🥚',
    },

    // === AÇÚCAR (novos tipos) ===
    {
        slug: 'acucar-vhp',
        nome: 'Açúcar VHP',
        categoria: 'SUCROENERGETICO',
        unidade: 'TONELADA',
        descricao: 'Açúcar VHP (Very High Polarization) - Mercado de exportação',
        icone: '🍬',
    },
    {
        slug: 'acucar-refinado',
        nome: 'Açúcar Refinado',
        categoria: 'SUCROENERGETICO',
        unidade: 'TONELADA',
        descricao: 'Açúcar Refinado Amorfo - São Paulo',
        icone: '🍬',
    },
    {
        slug: 'acucar-empacotado',
        nome: 'Açúcar Empacotado',
        categoria: 'SUCROENERGETICO',
        unidade: 'TONELADA',
        descricao: 'Açúcar Cristal Empacotado - São Paulo',
        icone: '🍬',
    },

    // === ALGODÃO (prazos) ===
    {
        slug: 'algodao-8dias',
        nome: 'Algodão 8 Dias',
        categoria: 'FIBRAS',
        unidade: 'ARROBA',
        descricao: 'Algodão em Pluma - Prazo de 8 dias',
        icone: '🌿',
    },
    {
        slug: 'algodao-15dias',
        nome: 'Algodão 15 Dias',
        categoria: 'FIBRAS',
        unidade: 'ARROBA',
        descricao: 'Algodão em Pluma - Prazo de 15 dias',
        icone: '🌿',
    },
    {
        slug: 'algodao-30dias',
        nome: 'Algodão 30 Dias',
        categoria: 'FIBRAS',
        unidade: 'ARROBA',
        descricao: 'Algodão em Pluma - Prazo de 30 dias',
        icone: '🌿',
    },

    // === PEIXE ===
    {
        slug: 'tilapia',
        nome: 'Tilápia',
        categoria: 'PEIXE',
        unidade: 'KG',
        descricao: 'Preços da Tilápia - CEPEA',
        icone: '🐟',
    },
];

async function main() {
    console.log('🌱 Iniciando seed de novos commodities...\n');

    let created = 0;
    let skipped = 0;

    for (const commodity of NEW_COMMODITIES) {
        const existing = await prisma.commodity.findUnique({
            where: { slug: commodity.slug },
        });

        if (existing) {
            console.log(`⏭️  ${commodity.nome} (${commodity.slug}) já existe, pulando...`);
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
