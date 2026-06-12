const path = require("path");
const dotenv = require("dotenv");

// Load .env files only if they exist AND don't override existing env vars
// In production (Hostinger), env vars are already set
dotenv.config({ 
  path: path.join(__dirname, "../../.env"),
  override: false // Don't override existing env vars
});
dotenv.config({ 
  path: path.join(__dirname, "../../.env.local"),
  override: false
});

const app = require("./app");
const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Log Razorpay key status on startup
    const rzpKey = process.env.RAZORPAY_KEY_ID;
    console.log("[ENV Check] RAZORPAY_KEY_ID:", rzpKey 
      ? (rzpKey.startsWith("rzp_") ? `Set (${rzpKey.substring(0, 10)}...)` : "INVALID VALUE") 
      : "NOT SET");
    
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
