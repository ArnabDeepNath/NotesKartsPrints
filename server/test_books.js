const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const where = { isActive: true };
        const books = await prisma.book.findMany({
            where,
            skip: 0,
            take: 50,
            orderBy: { createdAt: "desc" },
            include: {
              genre: { select: { id: true, name: true, slug: true, color: true } },
              category: { select: { id: true, name: true, slug: true } },
              variations: true,
              _count: { select: { reviews: true } },
            },
        });
        console.log("Books returned normally:", books.length);
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
