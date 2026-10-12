#!/usr/bin/env node
import "dotenv/config";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum di-set di .env");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const newRoles = [
  { kode: "REKTORAT", nama: "Rektorat", ket: "Akses pimpinan universitas dan eksekutif" },
  { kode: "DEKANAT", nama: "Dekanat", ket: "Akses pimpinan fakultas" },
  { kode: "KAPRODI", nama: "Kaprodi", ket: "Ketua Program Studi" },
  { kode: "ADMIN_PRODI", nama: "Admin Prodi", ket: "Operator Administrasi Program Studi" },
  { kode: "ADMIN_DEKANAT", nama: "Admin Dekanat", ket: "Operator Administrasi Dekanat / Fakultas" },
];

try {
  await client.connect();
  console.log("Terhubung ke Neon PostgreSQL...");

  for (const r of newRoles) {
    const query = `
      INSERT INTO roles (kode_role, nama_role, keterangan)
      VALUES ($1, $2, $3)
      ON CONFLICT (kode_role) 
      DO UPDATE SET nama_role = EXCLUDED.nama_role, keterangan = EXCLUDED.keterangan
      RETURNING id_role, kode_role, nama_role;
    `;
    const res = await client.query(query, [r.kode, r.nama, r.ket]);
    console.log(`[OK] Role tersimpan: ${res.rows[0].kode_role} - ${res.rows[0].nama_role} (ID: ${res.rows[0].id_role})`);
  }

  const { rows } = await client.query("SELECT id_role, kode_role, nama_role FROM roles ORDER BY id_role ASC");
  console.log("\n--- DAFTAR SELURUH ROLE DI DATABASE NEON SAAT INI ---");
  console.table(rows);
} catch (err) {
  console.error("Gagal menambahkan role:", err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
