
// Load env vars first
import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function checkStates() {
    console.log("Conectando ao banco...");

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
        // Note: in the real app instance we might not want to disconnect if imported, 
        // but in a script it's fine.
        // However, the exported prisma instance doesn't expose $disconnect directly if it's the extended client? 
        // Actually it is PrismaClient instance.
        await prisma.$disconnect();
    });
