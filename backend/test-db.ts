import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing database connection...");
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log("Connection successful! Users found:", users.length);
    } catch (error) {
        console.error("Database Connection Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
