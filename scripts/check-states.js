/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStates() {
    const states = await prisma.cotacao.groupBy({
        by: ['estado'],
        _count: {
            estado: true
        }
    });

    console.log('Estados encontrados:', states);

    const samplePracas = await prisma.cotacao.findMany({
        take: 10,
        select: {
            praca: true,
            estado: true
        }
    });

    console.log('Amostra de praças:', samplePracas);
}

checkStates()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
