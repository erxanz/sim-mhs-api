import { prisma } from "../config/prisma.js";

/**
 * Data publik untuk halaman landing (tanpa autentikasi).
 * Hanya mengembalikan informasi non-sensitif: profil kampus, ringkasan
 * jumlah fakultas/prodi/mahasiswa, serta daftar fakultas beserta prodinya.
 * Tidak ada data pribadi mahasiswa / pengguna yang diekspos.
 */
export async function landing() {
  const [universitas, totalFakultas, totalProdi, totalProdiAktif, totalMahasiswa, totalMahasiswaAktif, fakultasRows] =
    await Promise.all([
      prisma.universitas.findFirst({ orderBy: { id: "asc" } }),
      prisma.fakultas.count(),
      prisma.programStudi.count(),
      prisma.programStudi.count({ where: { statusAktif: "Aktif" } }),
      prisma.mahasiswa.count(),
      prisma.mahasiswa.count({ where: { statusMahasiswa: "Aktif" } }),
      prisma.fakultas.findMany({
        orderBy: { namaFakultas: "asc" },
        include: {
          programStudi: {
            orderBy: { namaProgramStudi: "asc" },
            include: { _count: { select: { mahasiswa: true } } },
          },
        },
      }),
    ]);

  const fakultas = fakultasRows.map((f) => ({
    id: f.id.toString(),
    kodeFakultas: f.kodeFakultas,
    namaFakultas: f.namaFakultas,
    totalProdi: f.programStudi.length,
    totalMahasiswa: f.programStudi.reduce((sum, p) => sum + p._count.mahasiswa, 0),
    programStudi: f.programStudi.map((p) => ({
      id: p.id.toString(),
      kodeProgramStudi: p.kodeProgramStudi,
      namaProgramStudi: p.namaProgramStudi,
      jenjang: p.jenjang,
      statusAktif: p.statusAktif,
      totalMahasiswa: p._count.mahasiswa,
    })),
  }));

  return {
    universitas: universitas
      ? {
          kodeUniversitas: universitas.kodeUniversitas,
          namaUniversitas: universitas.namaUniversitas,
          slogan: universitas.slogan,
          alamat: universitas.alamat,
          kota: universitas.kota,
          provinsi: universitas.provinsi,
          kodePos: universitas.kodePos,
          website: universitas.website,
          email: universitas.email,
          telepon: universitas.telepon,
        }
      : null,
    stats: {
      totalFakultas,
      totalProdi,
      totalProdiAktif,
      totalMahasiswa,
      totalMahasiswaAktif,
    },
    fakultas,
  };
}
