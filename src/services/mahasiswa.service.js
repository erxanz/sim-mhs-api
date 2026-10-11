import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";
import { deleteFoto, saveFoto } from "./storage.service.js";

const SORTABLE = [
  "id",
  "npm",
  "namaMahasiswa",
  "jenisKelamin",
  "tanggalMasuk",
  "statusMahasiswa",
  "createdAt",
];

const AUDIT_FIELDS = [
  "idPengguna",
  "idProgramStudi",
  "npm",
  "namaMahasiswa",
  "jenisKelamin",
  "tempatLahir",
  "tanggalLahir",
  "tanggalMasuk",
  "alamat",
  "statusMahasiswa",
  "fotoUrl",
  "fotoStorageKey",
];

const INCLUDE = {
  programStudi: { include: { fakultas: { include: { universitas: true } } } },
  pengguna: {
    select: { id: true, username: true, namaLengkap: true, email: true, role: { select: { kodeRole: true } } },
  },
};

export async function resolveOwnMahasiswaId(auth) {
  if (!auth || auth.role !== "MAHASISWA") return null;
  const own = await prisma.mahasiswa.findUnique({
    where: { idPengguna: auth.id },
    select: { id: true },
  });
  return own?.id ?? -1n;
}

export async function list(query, auth) {
  const {
    page,
    limit,
    order,
    sort,
    q,
    id_program_studi: idProgramStudi,
    status_mahasiswa: statusMahasiswa,
    jenis_kelamin: jenisKelamin,
    jenjang,
    tanggal_masuk_dari: tanggalMasukDari,
    tanggal_masuk_sampai: tanggalMasukSampai,
  } = query;

  const ownId = await resolveOwnMahasiswaId(auth);

  const where = {
    ...(ownId !== null ? { id: ownId } : {}),
    ...(idProgramStudi ? { idProgramStudi } : {}),
    ...(statusMahasiswa ? { statusMahasiswa } : {}),
    ...(jenisKelamin ? { jenisKelamin } : {}),
    ...(jenjang ? { programStudi: { jenjang: { equals: jenjang, mode: "insensitive" } } } : {}),
    ...(tanggalMasukDari || tanggalMasukSampai
      ? {
          tanggalMasuk: {
            ...(tanggalMasukDari ? { gte: tanggalMasukDari } : {}),
            ...(tanggalMasukSampai ? { lte: tanggalMasukSampai } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { npm: { contains: q, mode: "insensitive" } },
            { namaMahasiswa: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.mahasiswa.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(sort, order, SORTABLE, "createdAt"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mahasiswa.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, limit) };
}

export async function getById(id, auth) {
  const data = await prisma.mahasiswa.findUnique({ where: { id }, include: INCLUDE });
  if (!data) throw ApiError.notFound("Mahasiswa tidak ditemukan");

  if (auth?.role === "MAHASISWA") {
    const ownId = await resolveOwnMahasiswaId(auth);
    if (data.id !== ownId) throw ApiError.forbidden("Anda hanya dapat mengakses data sendiri");
  }

  return data;
}

async function assertProgramStudi(idProgramStudi) {
  const prodi = await prisma.programStudi.findUnique({
    where: { id: idProgramStudi },
    select: { id: true },
  });
  if (!prodi) throw ApiError.badRequest("Program studi tidak ditemukan");
}

async function assertPenggunaTersedia(idPengguna) {
  if (!idPengguna) return;
  const pengguna = await prisma.pengguna.findUnique({
    where: { id: idPengguna },
    select: { id: true },
  });
  if (!pengguna) throw ApiError.badRequest("Pengguna tidak ditemukan");
  const terpakai = await prisma.mahasiswa.findFirst({
    where: { idPengguna },
    select: { id: true },
  });
  if (terpakai) throw ApiError.conflict("Pengguna sudah tertaut ke mahasiswa lain");
}

export async function create(req, payload) {
  await assertProgramStudi(payload.idProgramStudi);
  await assertPenggunaTersedia(payload.idPengguna);

  const data = await prisma.mahasiswa.create({ data: payload, include: INCLUDE });
  await writeAudit(req, {
    tabelNama: "mahasiswa",
    recordId: data.id,
    aksi: "INSERT",
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function update(req, id, payload) {
  const lama = await prisma.mahasiswa.findUnique({ where: { id } });
  if (!lama) throw ApiError.notFound("Mahasiswa tidak ditemukan");

  if (payload.idProgramStudi) await assertProgramStudi(payload.idProgramStudi);
  if (payload.idPengguna && payload.idPengguna !== lama.idPengguna) {
    await assertPenggunaTersedia(payload.idPengguna);
  }

  const data = await prisma.mahasiswa.update({ where: { id }, data: payload, include: INCLUDE });
  await writeAudit(req, {
    tabelNama: "mahasiswa",
    recordId: data.id,
    aksi: "UPDATE",
    dataLama: pick(lama, AUDIT_FIELDS),
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function remove(req, id) {
  const lama = await prisma.mahasiswa.findUnique({ where: { id } });
  if (!lama) throw ApiError.notFound("Mahasiswa tidak ditemukan");

  await prisma.mahasiswa.delete({ where: { id } });
  await deleteFoto(lama.fotoStorageKey);

  await writeAudit(req, {
    tabelNama: "mahasiswa",
    recordId: id,
    aksi: "DELETE",
    dataLama: pick(lama, AUDIT_FIELDS),
  });
  return { message: "Mahasiswa berhasil dihapus" };
}

export async function setFoto(req, id, file) {
  const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id } });
  if (!mahasiswa) throw ApiError.notFound("Mahasiswa tidak ditemukan");

  const { storageKey, fotoUrl } = await saveFoto(mahasiswa.npm, file.buffer, file.ext);
  const lamaFoto = { fotoUrl: mahasiswa.fotoUrl, fotoStorageKey: mahasiswa.fotoStorageKey };

  const data = await prisma.mahasiswa.update({
    where: { id },
    data: { fotoUrl, fotoStorageKey: storageKey },
    include: INCLUDE,
  });

  await deleteFoto(lamaFoto.fotoStorageKey);
  await writeAudit(req, {
    tabelNama: "mahasiswa",
    recordId: id,
    aksi: "UPDATE",
    dataLama: lamaFoto,
    dataBaru: { fotoUrl, fotoStorageKey: storageKey },
  });

  return data;
}

export async function removeFoto(req, id) {
  const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id } });
  if (!mahasiswa) throw ApiError.notFound("Mahasiswa tidak ditemukan");
  if (!mahasiswa.fotoStorageKey) throw ApiError.notFound("Mahasiswa belum memiliki foto");

  const data = await prisma.mahasiswa.update({
    where: { id },
    data: { fotoUrl: null, fotoStorageKey: null },
    include: INCLUDE,
  });

  await deleteFoto(mahasiswa.fotoStorageKey);
  await writeAudit(req, {
    tabelNama: "mahasiswa",
    recordId: id,
    aksi: "UPDATE",
    dataLama: { fotoUrl: mahasiswa.fotoUrl, fotoStorageKey: mahasiswa.fotoStorageKey },
    dataBaru: { fotoUrl: null, fotoStorageKey: null },
  });

  return data;
}
