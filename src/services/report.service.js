import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { buildMeta } from "../utils/pagination.js";

export async function mahasiswaPerProdi(query) {
  const { page, limit, status_mahasiswa: status, id_program_studi: idProdi } = query;

  const filters = [Prisma.sql`1 = 1`];
  if (status) filters.push(Prisma.sql`v.status_mahasiswa = ${status}`);
  if (idProdi) filters.push(Prisma.sql`v.id_program_studi = ${idProdi}`);
  const where = Prisma.join(filters, " AND ");

  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM v_mahasiswa_per_prodi v
    WHERE ${where}
  `;
  const total = countRows[0]?.total ?? 0;

  const data = await prisma.$queryRaw`
    SELECT
      v.kode_universitas::text AS kode_universitas,
      v.nama_universitas::text AS nama_universitas,
      v.kode_fakultas::text AS kode_fakultas,
      v.nama_fakultas::text AS nama_fakultas,
      v.id_program_studi::text AS id_program_studi,
      v.kode_program_studi::text AS kode_program_studi,
      v.nama_program_studi::text AS nama_program_studi,
      v.jenjang::text AS jenjang,
      v.id_mahasiswa::text AS id_mahasiswa,
      v.npm::text AS npm,
      v.nama_mahasiswa::text AS nama_mahasiswa,
      v.jenis_kelamin::text AS jenis_kelamin,
      v.jenis_kelamin_text::text AS jenis_kelamin_text,
      v.tempat_lahir::text AS tempat_lahir,
      v.tanggal_lahir::date AS tanggal_lahir,
      v.tanggal_masuk::date AS tanggal_masuk,
      v.alamat::text AS alamat,
      v.status_mahasiswa::text AS status_mahasiswa
    FROM v_mahasiswa_per_prodi v
    WHERE ${where}
    ORDER BY v.kode_program_studi ASC, v.npm ASC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;

  return { data, meta: buildMeta(total, page, limit) };
}

export async function profilMahasiswa(npm) {
  const rows = await prisma.$queryRaw`
    SELECT
      m.id_mahasiswa::text AS id_mahasiswa,
      m.npm::text AS npm,
      m.nama_mahasiswa::text AS nama_mahasiswa,
      m.jenis_kelamin::text AS jenis_kelamin,
      m.tempat_lahir::text AS tempat_lahir,
      m.tanggal_lahir::date AS tanggal_lahir,
      m.tanggal_masuk::date AS tanggal_masuk,
      m.alamat::text AS alamat,
      m.status_mahasiswa::text AS status_mahasiswa,
      m.foto_url::text AS foto_url,
      ps.kode_program_studi::text AS kode_program_studi,
      ps.nama_program_studi::text AS nama_program_studi,
      ps.jenjang::text AS jenjang,
      f.kode_fakultas::text AS kode_fakultas,
      f.nama_fakultas::text AS nama_fakultas,
      u.kode_universitas::text AS kode_universitas,
      u.nama_universitas::text AS nama_universitas
    FROM mahasiswa m
    JOIN program_studi ps ON ps.id_program_studi = m.id_program_studi
    JOIN fakultas f ON f.id_fakultas = ps.id_fakultas
    JOIN universitas u ON u.id_universitas = f.id_universitas
    WHERE m.npm = ${npm}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function statistikMahasiswa() {
  const perStatus = await prisma.mahasiswa.groupBy({ by: ["statusMahasiswa"], _count: { _all: true } });
  const perProdi = await prisma.$queryRaw`
    SELECT
      ps.kode_program_studi::text AS kode_program_studi,
      ps.nama_program_studi::text AS nama_program_studi,
      COUNT(m.id_mahasiswa)::int AS jumlah_mahasiswa
    FROM program_studi ps
    LEFT JOIN mahasiswa m ON m.id_program_studi = ps.id_program_studi
    GROUP BY ps.id_program_studi, ps.kode_program_studi, ps.nama_program_studi
    ORDER BY ps.kode_program_studi ASC
  `;

  return {
    totalMahasiswa: await prisma.mahasiswa.count(),
    perStatus: perStatus.map((row) => ({
      statusMahasiswa: row.statusMahasiswa,
      jumlah: row._count._all,
    })),
    perProdi,
  };
}
