/**
 * Unified server — Next.js (frontend) + Express (API) on a single process.
 * Hostinger uploads this file as the Node.js app entry point.
 *
 * Architecture:
 *   Express handles  /api/*  and  /uploads/*
 *   Next.js handles  everything else (pages, assets)
 */

require("dotenv").config(); // loads .env from project root

const { execSync } = require("child_process");
const express = require("express");
const next = require("next");
const { parse } = require("url");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "0.0.0.0";

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

async function main() {
  // 0 ─ Push Prisma schema to the database (ensures tables are up-to-date)
  try {
    const childProcess = require("child_process");
    console.log("⏳ Running prisma db push...");
    const path = require("path");
    const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
    const schemaPath = path.join(process.cwd(), "server", "prisma", "schema.prisma");
    const out = childProcess.execSync(
      `"${prismaBin}" db push --accept-data-loss --schema="${schemaPath}"`,
      { env: { ...process.env }, encoding: "utf8" }
    );
    console.log("✅ Prisma db push complete:\n", out);
  } catch (pushErr) {
    console.error("⚠️  Prisma db push failed:", pushErr.message);
    if (pushErr.stdout) console.error("--- STDOUT ---\n", pushErr.stdout);
    if (pushErr.stderr) console.error("--- STDERR ---\n", pushErr.stderr);
  }

  // 1 ─ Prepare Next.js
  await nextApp.prepare();

  // 2 ─ Connect Database (non-fatal — server starts even if DB is temporarily unavailable)
  const prisma = require("./server/src/config/prisma");
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (dbErr) {
    console.error(
      "⚠️  Database connection failed (server will still start):",
      dbErr.message,
    );
  }

  // 3 ─ Load Express API app (all /api/* middleware + routes)
  const apiApp = require("./server/src/app");

  // 4 ─ Create the unified server
  const server = express();

  // Mount Express API (handles /api/*, /uploads/*)
  server.use(apiApp);

  // Next.js handles every other route (pages, _next/static, etc.)
  server.all("*", (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  // 5 ─ Start listening
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`🚀 Basak Library running on http://${hostname}:${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // 6 ─ Graceful shutdown
  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
