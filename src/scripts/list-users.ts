import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true, name: true },
    });
    console.log("Users:", users);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
