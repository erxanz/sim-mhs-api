import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";

const SORTABLE = ["id", "kodeUniversitas", "namaUniversitas", "kota", "provinsi", "createdAt"];

const AUDIT_FIELDS = [
  "kodeUniversitas",
  "namaUniversitas",
  "slogan",
  "alamat",
  "kota",
  "provinsi",
  "kodePos",
  "website",
  "email",
  "telepon",
];

export async function list(query) {
  const { page, limit, order, sort, q, kota } = query;
  const where = {
    ...(q
      ? {
          OR: [
            { kodeUniversitas: { contains: q, mode: "insensitive" } },
            { namaUniversitas: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(kota ? { kota: { contains: kota, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.universitas.findMany({
      where,
      orderBy: buildOrderBy(sort, order, SORTABLE, "namaUniversitas"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.universitas.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, limit) };
}

export async function getById(id) {
  const data = await prisma.universitas.findUnique({ where: { id } });
  if (!data) throw ApiError.notFound("Universitas tidak ditemukan");
  return data;
}

export async function create(req, payload) {
  const data = await prisma.universitas.create({ data: payload });
  await writeAudit(req, {
    tabelNama: "universitas",
    recordId: data.id,
    aksi: "INSERT",
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function update(req, id, payload) {
  const lama = await getById(id);
  const data = await prisma.universitas.update({ where: { id }, data: payload });
  await writeAudit(req, {
    tabelNama: "universitas",
    recordId: data.id,
    aksi: "UPDATE",
    dataLama: pick(lama, AUDIT_FIELDS),
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function remove(req, id) {
  const lama = await getById(id);
  try {
    await prisma.universitas.delete({ where: { id } });
  } catch (err) {
    if (err.code === "P2003") {
      throw ApiError.conflict("Universitas masih memiliki relasi fakultas/pengguna");
    }
    throw err;
  }
  await writeAudit(req, {
    tabelNama: "universitas",
    recordId: id,
    aksi: "DELETE",
    dataLama: pick(lama, AUDIT_FIELDS),
  });
  return { message: "Universitas berhasil dihapus" };
}
