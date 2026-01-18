
import 'dotenv/config'
import { PrismaClient, Categoria, Unidade } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL!
console.log('Connecting to:', connectionString.replace(/:[^:@]*@/, ':****@')) // Log seguro

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Iniciando seed no PostgreSQL...')
    const commodities = [
        { slug: 'soja', nome: 'Soja', categoria: Categoria.GRAOS, unidade: Unidade.SACA_60KG, descricao: 'Indicador Soja ESALQ/BM&FBovespa' },
        { slug: 'milho', nome: 'Milho', categoria: Categoria.GRAOS, unidade: Unidade.SACA_60KG, descricao: 'Indicador Milho ESALQ/BM&FBovespa' },
        { slug: 'trigo', nome: 'Trigo', categoria: Categoria.GRAOS, unidade: Unidade.TONELADA, descricao: 'Trigo Paraná' },
        { slug: 'cafe-arabica', nome: 'Café Arábica', categoria: Categoria.GRAOS, unidade: Unidade.SACA_60KG, descricao: 'Indicador Café Arábica CEPEA/ESALQ' },
        { slug: 'boi-gordo', nome: 'Boi Gordo', categoria: Categoria.PECUARIA, unidade: Unidade.ARROBA, descricao: 'Indicador do Boi Gordo CEPEA/B3' },
        { slug: 'bezerro', nome: 'Bezerro', categoria: Categoria.PECUARIA, unidade: Unidade.ARROBA, descricao: 'Indicador do Bezerro ESALQ/BM&FBovespa' },
        { slug: 'suino', nome: 'Suíno Vivo', categoria: Categoria.PECUARIA, unidade: Unidade.KG, descricao: 'Suíno Vivo (Jales/SP)' },
        { slug: 'frango', nome: 'Frango Vivo', categoria: Categoria.PECUARIA, unidade: Unidade.KG, descricao: 'Frango Vivo (Grande SP)' },
        { slug: 'etanol-hidratado', nome: 'Etanol Hidratado', categoria: Categoria.SUCROENERGETICO, unidade: Unidade.LITRO, descricao: 'Indicador Diário Etanol Hidratado ESALQ/BM&FBovespa' },
        { slug: 'etanol-anidro', nome: 'Etanol Anidro', categoria: Categoria.SUCROENERGETICO, unidade: Unidade.LITRO, descricao: 'Indicador Semanal Etanol Anidro ESALQ/BM&FBovespa' },
        { slug: 'acucar-cristal', nome: 'Açúcar Cristal', categoria: Categoria.SUCROENERGETICO, unidade: Unidade.SACA_60KG, descricao: 'Indicador Açúcar Cristal ESALQ/São Paulo' },
    ]

    for (const c of commodities) {
        const commodity = await prisma.commodity.upsert({
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

        // Gerar histórico de 90 dias
        const valorBase = c.slug === 'soja' ? 140 : c.slug === 'milho' ? 70 : c.slug === 'boi-gordo' ? 300 : c.slug === 'cafe-arabica' ? 2000 : 100;
        let valorAtual = valorBase;

        for (let i = 90; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(3, 0, 0, 0); // Fuso Brasil aprox

            // Random walk simples
            const change = (Math.random() - 0.5) * (valorBase * 0.05);
            valorAtual += change;
            if (valorAtual < 0) valorAtual = 10;

            await prisma.cotacao.upsert({
                where: {
                    commodityId_praca_dataReferencia: {
                        commodityId: commodity.id,
                        praca: 'Seed History',
                        dataReferencia: date
                    }
                },
                update: {},
                create: {
                    commodityId: commodity.id,
                    valor: valorAtual,
                    valorAnterior: valorAtual - change,
                    variacao: (change / (valorAtual - change)) * 100,
                    praca: 'Seed History',
                    estado: 'BR',
                    fonte: 'Seed',
                    dataReferencia: date
                }
            });
        }
        console.log(`Histórico gerado para ${c.nome}`);
    }

    console.log('Seed concluído com sucesso!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
