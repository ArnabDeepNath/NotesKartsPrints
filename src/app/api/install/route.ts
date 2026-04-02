import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    // Basic protection — require ?secret= matching INSTALL_SECRET env var
    const secret = req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.INSTALL_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json(
            { error: "Unauthorized. Pass ?secret=YOUR_INSTALL_SECRET" },
            { status: 401 }
        );
    }

    const log: string[] = [];

    try {
        // Step 1: Verify database tables exist (schema must be pushed before running install)
        // Run: npm run prisma:push  (once, via SSH on the server) before using this installer.
        log.push("Checking database tables...");
        try {
            await prisma.$queryRaw`SELECT 1 FROM genres LIMIT 1`;
            log.push("✅ Database tables verified.");
        } catch {
            throw new Error(
                "Database tables not found. SSH into your server and run: npm run prisma:push — then try again."
            );
        }

        // Step 2: Seed genres
        log.push("Seeding genres...");
        const genres = await Promise.all([
            prisma.genre.upsert({ where: { slug: "fiction" }, update: {}, create: { name: "Fiction", slug: "fiction", color: "#2997ff" } }),
            prisma.genre.upsert({ where: { slug: "non-fiction" }, update: {}, create: { name: "Non-Fiction", slug: "non-fiction", color: "#f5a623" } }),
            prisma.genre.upsert({ where: { slug: "mystery" }, update: {}, create: { name: "Mystery", slug: "mystery", color: "#bf5af2" } }),
            prisma.genre.upsert({ where: { slug: "science" }, update: {}, create: { name: "Science", slug: "science", color: "#30d158" } }),
            prisma.genre.upsert({ where: { slug: "history" }, update: {}, create: { name: "History", slug: "history", color: "#ff6961" } }),
            prisma.genre.upsert({ where: { slug: "self-help" }, update: {}, create: { name: "Self Help", slug: "self-help", color: "#ffd60a" } }),
        ]);
        log.push(`✅ ${genres.length} genres seeded.`);

        // Step 3: Create admin user
        log.push("Creating admin user...");
        const adminPassword = await bcrypt.hash("Admin@123456", 12);
        const admin = await prisma.user.upsert({
            where: { email: "admin@basaklibrary.com" },
            update: {},
            create: {
                email: "admin@basaklibrary.com",
                password: adminPassword,
                name: "Basak Admin",
                role: "ADMIN",
                emailVerified: true,
            },
        });
        log.push(`✅ Admin user ready: ${admin.email}`);

        // Step 4: Seed sample books
        log.push("Seeding sample books...");
        const sampleBooks = [
            {
                title: "The Midnight Library", author: "Matt Haig",
                description: "A heartwarming and life-affirming story about all the choices that go into a life well lived.",
                shortDesc: "Between life and death there is a library with infinite possibilities.",
                price: 499, comparePrice: 699, featured: true, stock: 50, pages: 304,
                publisher: "Canongate Books", isbn: "9781786892737", genreId: genres[0].id,
                rating: 4.5, reviewCount: 2847, sold: 342,
                coverImage: "https://images-na.ssl-images-amazon.com/images/I/81tCtHFtOgL.jpg",
                tags: "bestseller,fiction,fantasy",
            },
            {
                title: "Atomic Habits", author: "James Clear",
                description: "A proven framework for improving every day through tiny behavior changes.",
                shortDesc: "Master the tiny behaviors that lead to remarkable results.",
                price: 399, comparePrice: 599, featured: true, stock: 75, pages: 320,
                publisher: "Penguin Random House", isbn: "9780735211292", genreId: genres[5].id,
                rating: 4.8, reviewCount: 5234, sold: 891,
                coverImage: "https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg",
                tags: "bestseller,productivity,habits",
            },
            {
                title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari",
                description: "A groundbreaking narrative of humanity's creation and evolution.",
                shortDesc: "A groundbreaking narrative of humanity's creation and evolution.",
                price: 549, comparePrice: 799, featured: true, stock: 40, pages: 443,
                publisher: "Harper Perennial", isbn: "9780062316097", genreId: genres[4].id,
                rating: 4.7, reviewCount: 8912, sold: 654,
                coverImage: "https://images-na.ssl-images-amazon.com/images/I/81PmqfPIABL.jpg",
                tags: "history,bestseller,nonfiction",
            },
        ];

        let booksSeeded = 0;
        for (const book of sampleBooks) {
            await prisma.book.upsert({
                where: { isbn: book.isbn },
                update: {},
                create: book,
            });
            booksSeeded++;
        }
        log.push(`✅ ${booksSeeded} sample books seeded.`);

        log.push("🎉 Installation complete!");

        return NextResponse.json({
            success: true,
            log,
            credentials: {
                email: "admin@basaklibrary.com",
                password: "Admin@123456",
                loginUrl: "/login",
                adminUrl: "/admin",
                warning: "Change your password after first login!",
            },
        });
    } catch (error: any) {
        log.push(`❌ Error: ${error.message}`);
        return NextResponse.json({ success: false, log, error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
