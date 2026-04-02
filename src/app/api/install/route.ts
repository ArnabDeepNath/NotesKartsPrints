import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Raw SQL statements to create all tables (MySQL / MariaDB)
const CREATE_TABLE_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS \`genres\` (
        \`id\`    VARCHAR(36)  NOT NULL,
        \`name\`  VARCHAR(191) NOT NULL,
        \`slug\`  VARCHAR(191) NOT NULL,
        \`color\` VARCHAR(191) NOT NULL DEFAULT '#2997ff',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`genres_name_key\` (\`name\`),
        UNIQUE KEY \`genres_slug_key\` (\`slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\`            VARCHAR(36)          NOT NULL,
        \`email\`         VARCHAR(191)         NOT NULL,
        \`password\`      VARCHAR(191)         NOT NULL,
        \`name\`          VARCHAR(191)         NOT NULL,
        \`avatar\`        VARCHAR(191)         DEFAULT NULL,
        \`role\`          ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
        \`isActive\`      TINYINT(1)           NOT NULL DEFAULT 1,
        \`emailVerified\` TINYINT(1)           NOT NULL DEFAULT 0,
        \`phone\`         VARCHAR(191)         DEFAULT NULL,
        \`address\`       VARCHAR(191)         DEFAULT NULL,
        \`city\`          VARCHAR(191)         DEFAULT NULL,
        \`country\`       VARCHAR(191)         DEFAULT NULL,
        \`bio\`           TEXT                 DEFAULT NULL,
        \`createdAt\`     DATETIME(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\`     DATETIME(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`users_email_key\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`refresh_tokens\` (
        \`id\`        VARCHAR(36)  NOT NULL,
        \`token\`     VARCHAR(512) NOT NULL,
        \`userId\`    VARCHAR(36)  NOT NULL,
        \`expiresAt\` DATETIME(3)  NOT NULL,
        \`createdAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`refresh_tokens_token_key\` (\`token\`),
        CONSTRAINT \`refresh_tokens_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`books\` (
        \`id\`           VARCHAR(36)                                NOT NULL,
        \`title\`        VARCHAR(191)                               NOT NULL,
        \`subtitle\`     VARCHAR(191)                               DEFAULT NULL,
        \`author\`       VARCHAR(191)                               NOT NULL,
        \`description\`  LONGTEXT                                   NOT NULL,
        \`shortDesc\`    TEXT                                       DEFAULT NULL,
        \`price\`        DECIMAL(10,2)                              NOT NULL,
        \`comparePrice\` DECIMAL(10,2)                             DEFAULT NULL,
        \`coverImage\`   VARCHAR(191)                               DEFAULT NULL,
        \`images\`       TEXT                                       DEFAULT NULL,
        \`isbn\`         VARCHAR(191)                               DEFAULT NULL,
        \`publisher\`    VARCHAR(191)                               DEFAULT NULL,
        \`publishedAt\`  DATETIME(3)                                DEFAULT NULL,
        \`pages\`        INT                                        DEFAULT NULL,
        \`language\`     VARCHAR(191)                               NOT NULL DEFAULT 'English',
        \`format\`       ENUM('PHYSICAL','EBOOK','AUDIOBOOK','BUNDLE') NOT NULL DEFAULT 'PHYSICAL',
        \`stock\`        INT                                        NOT NULL DEFAULT 0,
        \`sold\`         INT                                        NOT NULL DEFAULT 0,
        \`rating\`       FLOAT                                      NOT NULL DEFAULT 0,
        \`reviewCount\`  INT                                        NOT NULL DEFAULT 0,
        \`featured\`     TINYINT(1)                                 NOT NULL DEFAULT 0,
        \`isActive\`     TINYINT(1)                                 NOT NULL DEFAULT 1,
        \`genreId\`      VARCHAR(36)                                DEFAULT NULL,
        \`tags\`         TEXT                                       DEFAULT NULL,
        \`createdAt\`    DATETIME(3)                                NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\`    DATETIME(3)                                NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`books_isbn_key\` (\`isbn\`),
        FULLTEXT KEY \`books_title_author_description_idx\` (\`title\`,\`author\`,\`description\`),
        CONSTRAINT \`books_genreId_fkey\` FOREIGN KEY (\`genreId\`) REFERENCES \`genres\` (\`id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\`              VARCHAR(36)                                                                   NOT NULL,
        \`userId\`          VARCHAR(36)                                                                   NOT NULL,
        \`status\`          ENUM('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
        \`subtotal\`        DECIMAL(10,2)                                                                 NOT NULL,
        \`discount\`        DECIMAL(10,2)                                                                 NOT NULL DEFAULT 0,
        \`tax\`             DECIMAL(10,2)                                                                 NOT NULL DEFAULT 0,
        \`total\`           DECIMAL(10,2)                                                                 NOT NULL,
        \`currency\`        VARCHAR(191)                                                                  NOT NULL DEFAULT 'INR',
        \`paymentMethod\`   VARCHAR(191)                                                                  DEFAULT NULL,
        \`paymentId\`       VARCHAR(191)                                                                  DEFAULT NULL,
        \`stripeSessionId\` VARCHAR(191)                                                                  DEFAULT NULL,
        \`notes\`           TEXT                                                                          DEFAULT NULL,
        \`shippingName\`    VARCHAR(191)                                                                  DEFAULT NULL,
        \`shippingEmail\`   VARCHAR(191)                                                                  DEFAULT NULL,
        \`shippingPhone\`   VARCHAR(191)                                                                  DEFAULT NULL,
        \`shippingAddress\` VARCHAR(191)                                                                  DEFAULT NULL,
        \`shippingCity\`    VARCHAR(191)                                                                  DEFAULT NULL,
        \`shippingCountry\` VARCHAR(191)                                                                  DEFAULT NULL,
        \`shippingZip\`     VARCHAR(191)                                                                  DEFAULT NULL,
        \`createdAt\`       DATETIME(3)                                                                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\`       DATETIME(3)                                                                   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`orders_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`order_items\` (
        \`id\`       VARCHAR(36)   NOT NULL,
        \`orderId\`  VARCHAR(36)   NOT NULL,
        \`bookId\`   VARCHAR(36)   NOT NULL,
        \`quantity\` INT           NOT NULL DEFAULT 1,
        \`price\`    DECIMAL(10,2) NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`order_items_orderId_fkey\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`order_items_bookId_fkey\`  FOREIGN KEY (\`bookId\`)  REFERENCES \`books\`  (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`wishlists\` (
        \`id\`        VARCHAR(36) NOT NULL,
        \`userId\`    VARCHAR(36) NOT NULL,
        \`bookId\`    VARCHAR(36) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`wishlists_userId_bookId_key\` (\`userId\`,\`bookId\`),
        CONSTRAINT \`wishlists_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`wishlists_bookId_fkey\` FOREIGN KEY (\`bookId\`) REFERENCES \`books\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\`        VARCHAR(36)  NOT NULL,
        \`userId\`    VARCHAR(36)  NOT NULL,
        \`bookId\`    VARCHAR(36)  NOT NULL,
        \`rating\`    INT          NOT NULL,
        \`title\`     VARCHAR(191) DEFAULT NULL,
        \`comment\`   TEXT         DEFAULT NULL,
        \`verified\`  TINYINT(1)   NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`reviews_userId_bookId_key\` (\`userId\`,\`bookId\`),
        CONSTRAINT \`reviews_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`reviews_bookId_fkey\` FOREIGN KEY (\`bookId\`) REFERENCES \`books\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS \`settings\` (
        \`id\`    VARCHAR(36)  NOT NULL,
        \`key\`   VARCHAR(191) NOT NULL,
        \`value\` TEXT         NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`settings_key_key\` (\`key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

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

    // Check DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
        return NextResponse.json(
            { success: false, error: "DATABASE_URL environment variable is not set on the server." },
            { status: 500 }
        );
    }

    let prisma: PrismaClient | null = null;
    const log: string[] = [];

    try {
        prisma = new PrismaClient();
        // Step 1: Create database tables (safe — uses CREATE TABLE IF NOT EXISTS)
        log.push("Creating database tables...");
        for (const sql of CREATE_TABLE_STATEMENTS) {
            await prisma.$executeRawUnsafe(sql);
        }
        log.push("✅ All database tables created (or already existed).");

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
        if (prisma) await prisma.$disconnect();
    }
}
