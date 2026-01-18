import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Iniciando seed JS...')
    const commodities = [
        { slug: 'soja', nome: 'Soja', categoria: 'GRAOS', unidade: 'SACA_60KG', descricao: 'Indicador Soja ESALQ/BM&FBovespa' },
        { slug: 'milho', nome: 'Milho', categoria: 'GRAOS', unidade: 'SACA_60KG', descricao: 'Indicador Milho ESALQ/BM&FBovespa' },
        { slug: 'boi-gordo', nome: 'Boi Gordo', categoria: 'PECUARIA', unidade: 'ARROBA', descricao: 'Indicador do Boi Gordo CEPEA/B3' },
    ]

    for (const c of commodities) {
        await prisma.commodity.upsert({
            where: { slug: c.slug },
            update: {},
            create: {
                slug: c.slug,
                nome: c.nome,
                categoria: c.categoria,
                unidade: c.unidade,
                descricao: c.descricao,
                ativo: true
            },
        })
    }

    console.log('Seed JS concluído!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
