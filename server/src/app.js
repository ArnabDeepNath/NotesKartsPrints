const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const userRoutes = require("./routes/users");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payment");
const wishlistRoutes = require("./routes/wishlist");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:3000"
).split(",");
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ─── Stripe webhook (raw body MUST come before express.json) ─────────────────
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Static files (uploads) ──────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later." },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── Install / Seed Route ────────────────────────────────────────────────────
app.get("/api/install", async (req, res) => {
  const secret = req.query.secret;
  const expectedSecret = process.env.INSTALL_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized. Pass ?secret=YOUR_INSTALL_SECRET" });
  }

  const log = [];
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const installPrisma = new PrismaClient();

  // Show which DB host is being used
  const dbUrl = process.env.DATABASE_URL || "";
  const dbHost = dbUrl.match(/@([^:/]+)/)?.[1] ?? "unknown";
  log.push(`Connecting to database host: ${dbHost}`);

  try {
    // Seed genres
    log.push("Seeding genres...");
    const genres = await Promise.all([
      installPrisma.genre.upsert({ where: { slug: "fiction" }, update: {}, create: { name: "Fiction", slug: "fiction", color: "#2997ff" } }),
      installPrisma.genre.upsert({ where: { slug: "non-fiction" }, update: {}, create: { name: "Non-Fiction", slug: "non-fiction", color: "#f5a623" } }),
      installPrisma.genre.upsert({ where: { slug: "mystery" }, update: {}, create: { name: "Mystery", slug: "mystery", color: "#bf5af2" } }),
      installPrisma.genre.upsert({ where: { slug: "science" }, update: {}, create: { name: "Science", slug: "science", color: "#30d158" } }),
      installPrisma.genre.upsert({ where: { slug: "history" }, update: {}, create: { name: "History", slug: "history", color: "#ff6961" } }),
      installPrisma.genre.upsert({ where: { slug: "self-help" }, update: {}, create: { name: "Self Help", slug: "self-help", color: "#ffd60a" } }),
    ]);
    log.push(`✅ ${genres.length} genres seeded.`);

    // Create admin user
    log.push("Creating admin user...");
    const adminPassword = await bcrypt.hash("Admin@123456", 12);
    const admin = await installPrisma.user.upsert({
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

    // Seed sample books
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
      await installPrisma.book.upsert({
        where: { isbn: book.isbn },
        update: {},
        create: book,
      });
      booksSeeded++;
    }
    log.push(`✅ ${booksSeeded} sample books seeded.`);
    log.push("🎉 Installation complete!");

    return res.json({
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
  } catch (error) {
    log.push(`❌ Error: ${error.message}`);
    return res.status(500).json({ success: false, log, error: error.message });
  } finally {
    await installPrisma.$disconnect();
  }
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// (Next.js custom server handles 404s for non-API routes)
app.use(errorHandler);

module.exports = app;
