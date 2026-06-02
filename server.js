/**
 * Unified server — Next.js (frontend) + Express (API) on a single process.
 * Hostinger uploads this file as the Node.js app entry point.
 *
 * Architecture:
 *   Express handles  /api/*  and  /uploads/*
 *   Next.js handles  everything else (pages, assets)
 */

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local") });

const express = require("express");
const next = require("next");
const { parse } = require("url");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const hostname = "0.0.0.0";

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

async function maybePushPrismaSchema() {
  if (process.env.PRISMA_DB_PUSH_ON_BOOT !== "true") {
    console.log(
      "ℹ️ Skipping prisma db push on boot. Set PRISMA_DB_PUSH_ON_BOOT=true to enable it.",
    );
    return;
  }

  try {
    const childProcess = require("child_process");
    console.log("⏳ Running prisma db push...");
    const schemaPath = path.join(
      process.cwd(),
      "server",
      "prisma",
      "schema.prisma",
    );
    const prismaBin = path.join(
      process.cwd(),
      "node_modules",
      ".bin",
      "prisma",
    );
    const out = childProcess.execSync(
      `${prismaBin} db push --accept-data-loss --schema="${schemaPath}"`,
      { env: { ...process.env }, encoding: "utf8" },
    );
    console.log("✅ Prisma db push complete:\n", out);
  } catch (pushErr) {
    console.error("⚠️ Prisma db push failed:", pushErr.message);
    if (pushErr.stdout) console.error("--- STDOUT ---\n", pushErr.stdout);
    if (pushErr.stderr) console.error("--- STDERR ---\n", pushErr.stderr);
  }
}

function connectDatabaseInBackground(prisma) {
  prisma
    .$connect()
    .then(() => {
      console.log("✅ Database connected");
    })
    .catch((dbErr) => {
      console.error(
        "⚠️ Database connection unavailable during startup:",
        dbErr.message,
      );
    });
}

async function main() {
  // 0 ─ Optional schema sync for managed environments
  await maybePushPrismaSchema();

  // 1 ─ Prepare Next.js
  await nextApp.prepare();

  // 2 ─ Create Prisma client but do not block server startup on connectivity
  const prisma = require("./server/src/config/prisma");

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

  connectDatabaseInBackground(prisma);

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
