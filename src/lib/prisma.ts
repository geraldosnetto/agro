import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL!

const prismaClientSingleton = () => {
    // Para serverless/edge pode ser diferente, mas para Node runtime
    // usar adapter é boa prática com Prisma 7 se configurado assim.
    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
