require("dotenv").config();
const app = require("./app");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const { execSync } = require("child_process");

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    // Run seed on startup when SEED_ON_START=true (useful for fresh deploys)
    if (process.env.SEED_ON_START === "true") {
      console.log("🌱 SEED_ON_START=true — running seed script...");
      execSync("node prisma/seed.js", {
        cwd: path.join(__dirname, "../.."),
        stdio: "inherit",
      });
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Basak Library API v1.0.0`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
