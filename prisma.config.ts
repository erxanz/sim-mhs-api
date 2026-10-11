import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7.10 (versi stabil yang dipakai proyek ini) mengekspor `defineConfig`.
// File ini sebelumnya dibuat oleh Prisma 8 RC (`definePrismaConfig`) dan tidak
// kompatibel dengan Prisma 7, jadi disesuaikan agar perintah Prisma berjalan.
//
// Catatan Prisma 7: URL koneksi untuk Migrate tinggal di sini, bukan di schema.
// Migrasi diarahkan ke DIRECT_URL (koneksi langsung, tanpa pooler Neon) bila
// tersedia; kalau tidak ada, jatuh ke DATABASE_URL.
const migrateUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(migrateUrl ? { datasource: { url: migrateUrl } } : {}),
});
