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

export async function rekapitulasi(query = {}, auth = {}) {
  const { status, id_prodi, tahun, q } = query;

  const where = {};

  // Limitasi role (Dekanat hanya melihat fakultasnya, Kaprodi/Admin Prodi hanya prodinya)
  const isDekanat = auth.role === "DEKANAT" || auth.role === "ADMIN_DEKANAT";
  const isProdiStaff = auth.role === "KAPRODI" || auth.role === "ADMIN_PRODI";

  if (isDekanat && auth.idFakultas) {
    where.programStudi = { idFakultas: BigInt(auth.idFakultas) };
  } else if (isProdiStaff && auth.idProgramStudi) {
    where.idProgramStudi = BigInt(auth.idProgramStudi);
  }

  // Filter Prodi
  if (id_prodi && id_prodi !== "" && id_prodi !== "0") {
    try {
      where.idProgramStudi = BigInt(id_prodi);
    } catch (e) {}
  }

  // Filter Status
  if (status && status !== "Semua") {
    where.statusMahasiswa = status;
  }

  // Filter Tahun Masuk
  if (tahun) {
    const yearNum = parseInt(tahun, 10);
    if (!isNaN(yearNum)) {
      const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${yearNum}-12-31T23:59:59.999Z`);
      where.tanggalMasuk = { gte: startDate, lte: endDate };
    }
  }

  // Filter Pencarian (NPM / Nama)
  if (q) {
    where.OR = [
      { npm: { contains: q, mode: "insensitive" } },
      { namaMahasiswa: { contains: q, mode: "insensitive" } },
    ];
  }

  // Ambil data mahasiswa
  const rows = await prisma.mahasiswa.findMany({
    where,
    include: {
      programStudi: {
        include: {
          fakultas: true,
        },
      },
    },
    orderBy: [
      { tanggalMasuk: "desc" },
      { namaMahasiswa: "asc" },
    ],
  });

  const mahasiswaList = rows.map((m) => ({
    id: m.id.toString(),
    npm: m.npm,
    namaMahasiswa: m.namaMahasiswa,
    jenisKelamin: m.jenisKelamin,
    tempatLahir: m.tempatLahir,
    tanggalLahir: m.tanggalLahir ? m.tanggalLahir.toISOString().split("T")[0] : null,
    tanggalMasuk: m.tanggalMasuk ? m.tanggalMasuk.toISOString().split("T")[0] : null,
    statusMahasiswa: m.statusMahasiswa,
    idProgramStudi: m.idProgramStudi.toString(),
    namaProgramStudi: m.programStudi?.namaProgramStudi || "-",
    kodeProgramStudi: m.programStudi?.kodeProgramStudi || "-",
    namaFakultas: m.programStudi?.fakultas?.namaFakultas || "-",
    kodeFakultas: m.programStudi?.fakultas?.kodeFakultas || "-",
  }));

  // Hitung statistik status dalam lingkup filter (tanpa terpotong oleh filter status tunggal)
  const statsWhere = { ...where };
  delete statsWhere.statusMahasiswa;

  const grouped = await prisma.mahasiswa.groupBy({
    by: ["statusMahasiswa"],
    where: statsWhere,
    _count: { _all: true },
  });

  const stats = {
    Aktif: 0,
    Cuti: 0,
    Lulus: 0,
    "Drop Out": 0,
    total: 0,
  };

  for (const g of grouped) {
    stats[g.statusMahasiswa] = g._count._all;
    stats.total += g._count._all;
  }

  // Ambil daftar prodi untuk opsi dropdown filter
  const prodiWhere = {};
  if (isDekanat && auth.idFakultas) {
    prodiWhere.idFakultas = BigInt(auth.idFakultas);
  } else if (isProdiStaff && auth.idProgramStudi) {
    prodiWhere.id = BigInt(auth.idProgramStudi);
  }

  const prodiRows = await prisma.programStudi.findMany({
    where: prodiWhere,
    orderBy: { namaProgramStudi: "asc" },
  });

  const prodiList = prodiRows.map((p) => ({
    id: p.id.toString(),
    kodeProgramStudi: p.kodeProgramStudi,
    namaProgramStudi: p.namaProgramStudi,
    jenjang: p.jenjang,
  }));

  return {
    mahasiswa: mahasiswaList,
    stats,
    prodiList,
  };
}

export async function rekapitulasiDosen(query = {}, auth = {}) {
  const { id_prodi, status_aktif, q } = query;

  const dosenRole = await prisma.role.findUnique({
    where: { kodeRole: "DOSEN" },
  });

  const where = {
    ...(dosenRole ? { idRole: dosenRole.id } : { role: { kodeRole: "DOSEN" } }),
  };

  const isDekanat = auth.role === "DEKANAT" || auth.role === "ADMIN_DEKANAT";
  const isProdiStaff = auth.role === "KAPRODI" || auth.role === "ADMIN_PRODI";

  // Dekanat dibatasi hanya dosen pada fakultasnya
  if (isDekanat && auth.idFakultas) {
    where.idFakultas = BigInt(auth.idFakultas);
  } else if (isProdiStaff && auth.idProgramStudi) {
    where.idProgramStudi = BigInt(auth.idProgramStudi);
  }

  // Filter Prodi
  if (id_prodi && id_prodi !== "" && id_prodi !== "0") {
    try {
      where.idProgramStudi = BigInt(id_prodi);
    } catch (e) {}
  }

  // Filter Status Aktif
  if (status_aktif && status_aktif !== "Semua") {
    where.statusAktif = status_aktif;
  }

  // Filter Pencarian
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { namaLengkap: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.pengguna.findMany({
    where,
    include: {
      fakultas: true,
      programStudi: true,
      role: true,
    },
    orderBy: { namaLengkap: "asc" },
  });

  const dosenList = rows.map((d) => ({
    id: d.id.toString(),
    username: d.username,
    namaLengkap: d.namaLengkap,
    email: d.email || "-",
    noHp: d.noHp || "-",
    statusAktif: d.statusAktif,
    idFakultas: d.idFakultas ? d.idFakultas.toString() : null,
    namaFakultas: d.fakultas?.namaFakultas || "-",
    kodeFakultas: d.fakultas?.kodeFakultas || "-",
    idProgramStudi: d.idProgramStudi ? d.idProgramStudi.toString() : null,
    namaProgramStudi: d.programStudi?.namaProgramStudi || "-",
    kodeProgramStudi: d.programStudi?.kodeProgramStudi || "-",
    jenjang: d.programStudi?.jenjang || "-",
    createdAt: d.createdAt ? d.createdAt.toISOString() : null,
  }));

  // Daftar prodi untuk filter dropdown
  const prodiWhere = {};
  if (isDekanat && auth.idFakultas) {
    prodiWhere.idFakultas = BigInt(auth.idFakultas);
  } else if (isProdiStaff && auth.idProgramStudi) {
    prodiWhere.id = BigInt(auth.idProgramStudi);
  }

  const prodiRows = await prisma.programStudi.findMany({
    where: prodiWhere,
    orderBy: { namaProgramStudi: "asc" },
  });

  const prodiList = prodiRows.map((p) => ({
    id: p.id.toString(),
    kodeProgramStudi: p.kodeProgramStudi,
    namaProgramStudi: p.namaProgramStudi,
    jenjang: p.jenjang,
  }));

  return {
    dosen: dosenList,
    total: dosenList.length,
    totalAktif: dosenList.filter((d) => d.statusAktif === "Aktif").length,
    prodiList,
  };
}
