import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL!

const prismaClientSingleton = () => {
    // Pool configurado com limites explícitos para performance
    const pool = new pg.Pool({
        connectionString,
        max: 10,                    // Máximo de conexões no pool
        idleTimeoutMillis: 30000,   // Timeout para conexões idle (30s)
        connectionTimeoutMillis: 5000, // Timeout para obter conexão (5s)
    })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
