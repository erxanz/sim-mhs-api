import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";

const SORTABLE = ["id", "kodeFakultas", "namaFakultas", "createdAt"];

const AUDIT_FIELDS = ["idUniversitas", "kodeFakultas", "namaFakultas"];

const INCLUDE = { universitas: true };

export async function list(query) {
  const { page, limit, order, sort, q, id_universitas: idUniversitas } = query;
  const where = {
    ...(idUniversitas ? { idUniversitas } : {}),
    ...(q
      ? {
          OR: [
            { kodeFakultas: { contains: q, mode: "insensitive" } },
            { namaFakultas: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.fakultas.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(sort, order, SORTABLE, "kodeFakultas"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.fakultas.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, limit) };
}

export async function getById(id) {
  const data = await prisma.fakultas.findUnique({ where: { id }, include: INCLUDE });
  if (!data) throw ApiError.notFound("Fakultas tidak ditemukan");
  return data;
}

async function assertUniversitas(idUniversitas) {
  const universitas = await prisma.universitas.findUnique({
    where: { id: idUniversitas },
    select: { id: true },
  });
  if (!universitas) throw ApiError.badRequest("Universitas tidak ditemukan");
}

export async function create(req, payload) {
  await assertUniversitas(payload.idUniversitas);
  const data = await prisma.fakultas.create({ data: payload, include: INCLUDE });
  await writeAudit(req, {
    tabelNama: "fakultas",
    recordId: data.id,
    aksi: "INSERT",
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function update(req, id, payload) {
  const lama = await getById(id);
  if (payload.idUniversitas) await assertUniversitas(payload.idUniversitas);
  const data = await prisma.fakultas.update({ where: { id }, data: payload, include: INCLUDE });
  await writeAudit(req, {
    tabelNama: "fakultas",
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
    await prisma.fakultas.delete({ where: { id } });
  } catch (err) {
    if (err.code === "P2003") {
      throw ApiError.conflict("Fakultas masih memiliki relasi program studi/pengguna");
    }
    throw err;
  }
  await writeAudit(req, {
    tabelNama: "fakultas",
    recordId: id,
    aksi: "DELETE",
    dataLama: pick(lama, AUDIT_FIELDS),
  });
  return { message: "Fakultas berhasil dihapus" };
}
