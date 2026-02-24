import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
    const email = "geraldosnetto@gmail.com";
    const user = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
    });
    console.log("Updated user:", user);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
