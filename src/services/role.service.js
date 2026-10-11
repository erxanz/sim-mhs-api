import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";

const SORTABLE = ["id", "kodeRole", "namaRole", "createdAt"];

const AUDIT_FIELDS = ["kodeRole", "namaRole", "keterangan"];

export async function list(query) {
  const { page, limit, order, sort, q } = query;
  const where = {
    ...(q
      ? {
          OR: [
            { kodeRole: { contains: q, mode: "insensitive" } },
            { namaRole: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.role.findMany({
      where,
      orderBy: buildOrderBy(sort, order, SORTABLE, "kodeRole"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.role.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, limit) };
}

export async function getById(id) {
  const data = await prisma.role.findUnique({ where: { id } });
  if (!data) throw ApiError.notFound("Role tidak ditemukan");
  return data;
}

export async function create(req, payload) {
  const data = await prisma.role.create({ data: payload });
  await writeAudit(req, {
    tabelNama: "roles",
    recordId: data.id,
    aksi: "INSERT",
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function update(req, id, payload) {
  const lama = await getById(id);
  const data = await prisma.role.update({ where: { id }, data: payload });
  await writeAudit(req, {
    tabelNama: "roles",
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
    await prisma.role.delete({ where: { id } });
  } catch (err) {
    if (err.code === "P2003") {
      throw ApiError.conflict("Role masih digunakan oleh pengguna");
    }
    throw err;
  }
  await writeAudit(req, {
    tabelNama: "roles",
    recordId: id,
    aksi: "DELETE",
    dataLama: pick(lama, AUDIT_FIELDS),
  });
  return { message: "Role berhasil dihapus" };
}
