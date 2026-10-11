import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

const ROLES = [
  { kodeRole: "ADMIN", namaRole: "Administrator", keterangan: "Akses penuh ke seluruh modul" },
  { kodeRole: "BAAK", namaRole: "Bagian Akademik", keterangan: "Kelola data akademik dan mahasiswa" },
  { kodeRole: "DOSEN", namaRole: "Dosen", keterangan: "Akses baca data akademik" },
  { kodeRole: "MAHASISWA", namaRole: "Mahasiswa", keterangan: "Akses data diri sendiri" },
];

async function upsertRole(kodeRole, namaRole, keterangan) {
  return prisma.role.upsert({
    where: { kodeRole },
    update: { namaRole, keterangan },
    create: { kodeRole, namaRole, keterangan },
  });
}

async function upsertPengguna({ username, password, namaLengkap, email, idRole, idUniversitas, idFakultas, idProgramStudi, noHp }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.pengguna.upsert({
    where: { username },
    update: { namaLengkap, email, idRole, idUniversitas, idFakultas, idProgramStudi, noHp },
    create: {
      username,
      passwordHash,
      namaLengkap,
      email,
      idRole,
      idUniversitas,
      idFakultas,
      idProgramStudi,
      noHp,
    },
  });
}

async function main() {
  console.log("Menjalankan seed...");

  const roles = {};
  for (const role of ROLES) {
    roles[role.kodeRole] = await upsertRole(role.kodeRole, role.namaRole, role.keterangan);
  }

  const universitas = await prisma.universitas.upsert({
    where: { kodeUniversitas: "UMB" },
    update: {
      namaUniversitas: "Universitas Mercu Buana",
      slogan: "Unggul, Mandiri, Kreatif",
      kota: "Jakarta",
      provinsi: "DKI Jakarta",
      website: "https://www.mercu.ac.id",
      email: "info@mercu.ac.id",
      telepon: "021-58909099",
    },
    create: {
      kodeUniversitas: "UMB",
      namaUniversitas: "Universitas Mercu Buana",
      slogan: "Unggul, Mandiri, Kreatif",
      alamat: "Jl. Meruya Selatan, Kebon Jeruk, Jakarta Barat",
      kota: "Jakarta",
      provinsi: "DKI Jakarta",
      kodePos: "11650",
      website: "https://www.mercu.ac.id",
      email: "info@mercu.ac.id",
      telepon: "021-58909099",
    },
  });

  const ft = await prisma.fakultas.upsert({
    where: { idUniversitas_kodeFakultas: { idUniversitas: universitas.id, kodeFakultas: "FTI" } },
    update: { namaFakultas: "Fakultas Teknik Informasi" },
    create: {
      idUniversitas: universitas.id,
      kodeFakultas: "FTI",
      namaFakultas: "Fakultas Teknik Informasi",
    },
  });

  const feb = await prisma.fakultas.upsert({
    where: { idUniversitas_kodeFakultas: { idUniversitas: universitas.id, kodeFakultas: "FEB" } },
    update: { namaFakultas: "Fakultas Ekonomi dan Bisnis" },
    create: {
      idUniversitas: universitas.id,
      kodeFakultas: "FEB",
      namaFakultas: "Fakultas Ekonomi dan Bisnis",
    },
  });

  const ti = await prisma.programStudi.upsert({
    where: { idFakultas_kodeProgramStudi: { idFakultas: ft.id, kodeProgramStudi: "TI" } },
    update: { namaProgramStudi: "Teknik Informatika", jenjang: "S1", statusAktif: "Aktif" },
    create: {
      idFakultas: ft.id,
      kodeProgramStudi: "TI",
      namaProgramStudi: "Teknik Informatika",
      jenjang: "S1",
      statusAktif: "Aktif",
    },
  });

  const si = await prisma.programStudi.upsert({
    where: { idFakultas_kodeProgramStudi: { idFakultas: ft.id, kodeProgramStudi: "SI" } },
    update: { namaProgramStudi: "Sistem Informasi", jenjang: "S1", statusAktif: "Aktif" },
    create: {
      idFakultas: ft.id,
      kodeProgramStudi: "SI",
      namaProgramStudi: "Sistem Informasi",
      jenjang: "S1",
      statusAktif: "Aktif",
    },
  });

  await prisma.programStudi.upsert({
    where: { idFakultas_kodeProgramStudi: { idFakultas: feb.id, kodeProgramStudi: "MT" } },
    update: { namaProgramStudi: "Manajemen", jenjang: "S1", statusAktif: "Aktif" },
    create: {
      idFakultas: feb.id,
      kodeProgramStudi: "MT",
      namaProgramStudi: "Manajemen",
      jenjang: "S1",
      statusAktif: "Aktif",
    },
  });

  const admin = await upsertPengguna({
    username: "admin",
    password: "Admin123!",
    namaLengkap: "Administrator Sistem",
    email: "admin@mercu.ac.id",
    idRole: roles.ADMIN.id,
    idUniversitas: universitas.id,
  });

  await upsertPengguna({
    username: "baak",
    password: "Baak123!",
    namaLengkap: "Petugas BAAK",
    email: "baak@mercu.ac.id",
    idRole: roles.BAAK.id,
    idUniversitas: universitas.id,
  });

  await upsertPengguna({
    username: "dosen01",
    password: "Dosen123!",
    namaLengkap: "Dr. Budi Santoso, M.Kom.",
    email: "dosen01@mercu.ac.id",
    idRole: roles.DOSEN.id,
    idUniversitas: universitas.id,
    idFakultas: ft.id,
    idProgramStudi: ti.id,
  });

  const mhsPengguna = await upsertPengguna({
    username: "mhs001",
    password: "Mhs12345!",
    namaLengkap: "Andi Pratama",
    email: "andi@student.mercu.ac.id",
    idRole: roles.MAHASISWA.id,
    idUniversitas: universitas.id,
    idFakultas: ft.id,
    idProgramStudi: ti.id,
  });

  const daftarMahasiswa = [
    {
      npm: "2021101001",
      namaMahasiswa: "Andi Pratama",
      jenisKelamin: "L",
      tempatLahir: "Jakarta",
      tanggalLahir: new Date("2003-02-15"),
      tanggalMasuk: new Date("2021-09-01"),
      alamat: "Jl. Meruya Selatan No. 1, Jakarta Barat",
      idProgramStudi: ti.id,
      idPengguna: mhsPengguna.id,
      statusMahasiswa: "Aktif",
    },
    {
      npm: "2021101002",
      namaMahasiswa: "Siti Rahmawati",
      jenisKelamin: "P",
      tempatLahir: "Bandung",
      tanggalLahir: new Date("2003-06-22"),
      tanggalMasuk: new Date("2021-09-01"),
      alamat: "Jl. Melati No. 12, Bandung",
      idProgramStudi: ti.id,
      statusMahasiswa: "Aktif",
    },
    {
      npm: "2022102001",
      namaMahasiswa: "Rizky Ramadhan",
      jenisKelamin: "L",
      tempatLahir: "Surabaya",
      tanggalLahir: new Date("2004-01-10"),
      tanggalMasuk: new Date("2022-09-01"),
      alamat: "Jl. Kenanga No. 5, Surabaya",
      idProgramStudi: si.id,
      statusMahasiswa: "Cuti",
    },
    {
      npm: "2020101001",
      namaMahasiswa: "Dewi Lestari",
      jenisKelamin: "P",
      tempatLahir: "Yogyakarta",
      tanggalLahir: new Date("2002-11-30"),
      tanggalMasuk: new Date("2020-09-01"),
      alamat: "Jl. Malioboro No. 8, Yogyakarta",
      idProgramStudi: ti.id,
      statusMahasiswa: "Lulus",
    },
    {
      npm: "2022103001",
      namaMahasiswa: "Bagus Wijaya",
      jenisKelamin: "L",
      tempatLahir: "Medan",
      tanggalLahir: new Date("2004-04-18"),
      tanggalMasuk: new Date("2022-09-01"),
      alamat: "Jl. Diponegoro No. 21, Medan",
      idProgramStudi: await prisma.programStudi
        .findFirst({ where: { kodeProgramStudi: "MT" }, select: { id: true } })
        .then((r) => r.id),
      statusMahasiswa: "Aktif",
    },
  ];

  for (const mahasiswa of daftarMahasiswa) {
    await prisma.mahasiswa.upsert({
      where: { npm: mahasiswa.npm },
      update: {
        namaMahasiswa: mahasiswa.namaMahasiswa,
        jenisKelamin: mahasiswa.jenisKelamin,
        tempatLahir: mahasiswa.tempatLahir,
        tanggalLahir: mahasiswa.tanggalLahir,
        tanggalMasuk: mahasiswa.tanggalMasuk,
        alamat: mahasiswa.alamat,
        idProgramStudi: mahasiswa.idProgramStudi,
        statusMahasiswa: mahasiswa.statusMahasiswa,
      },
      create: mahasiswa,
    });
  }

  console.log("Seed selesai.");
  console.log("Akun demo:");
  console.log("  admin      / Admin123!   (ADMIN)");
  console.log("  baak       / Baak123!    (BAAK)");
  console.log("  dosen01    / Dosen123!   (DOSEN)");
  console.log("  mhs001     / Mhs12345!   (MAHASISWA)");
  console.log(`  admin id: ${admin.id}`);
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
