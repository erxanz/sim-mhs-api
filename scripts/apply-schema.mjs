#!/usr/bin/env node
/**
 * apply-schema.mjs
 * Menerapkan neon_sim_mahasiswa_schema.sql ke database di DATABASE_URL (Neon).
 * Idempoten: seluruh statement di file memakai IF NOT EXISTS / CREATE OR REPLACE.
 *
 * Pakai: node scripts/apply-schema.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sqlPath = path.join(root, "neon_sim_mahasiswa_schema.sql");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum di-set di .env");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  const { rows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1"
  );
  console.log("Skema diterapkan. Tabel:", rows.map((r) => r.table_name).join(", "));
} catch (err) {
  console.error("Gagal menerapkan skema:", err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
