import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";

const SORTABLE = ["id", "kodeProgramStudi", "namaProgramStudi", "jenjang", "statusAktif", "createdAt"];

const AUDIT_FIELDS = ["idFakultas", "kodeProgramStudi", "namaProgramStudi", "jenjang", "statusAktif"];

const INCLUDE = { fakultas: { include: { universitas: true } } };

export async function list(query) {
  const {
    page,
    limit,
    order,
    sort,
    q,
    id_fakultas: idFakultas,
    status_aktif: statusAktif,
    jenjang,
  } = query;

  const where = {
    ...(idFakultas ? { idFakultas } : {}),
    ...(statusAktif ? { statusAktif } : {}),
    ...(jenjang ? { jenjang: { equals: jenjang, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { kodeProgramStudi: { contains: q, mode: "insensitive" } },
            { namaProgramStudi: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.programStudi.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(sort, order, SORTABLE, "kodeProgramStudi"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.programStudi.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, limit) };
}

export async function getById(id) {
  const data = await prisma.programStudi.findUnique({ where: { id }, include: INCLUDE });
  if (!data) throw ApiError.notFound("Program studi tidak ditemukan");
  return data;
}

async function assertFakultas(idFakultas) {
  const fakultas = await prisma.fakultas.findUnique({
    where: { id: idFakultas },
    select: { id: true },
  });
  if (!fakultas) throw ApiError.badRequest("Fakultas tidak ditemukan");
}

export async function create(req, payload) {
  await assertFakultas(payload.idFakultas);
  const data = await prisma.programStudi.create({ data: payload, include: INCLUDE });
  await writeAudit(req, {
    tabelNama: "program_studi",
    recordId: data.id,
    aksi: "INSERT",
    dataBaru: pick(data, AUDIT_FIELDS),
  });
  return data;
}

export async function update(req, id, payload) {
  const lama = await getById(id);
  if (payload.idFakultas) await assertFakultas(payload.idFakultas);
  const data = await prisma.programStudi.update({ where: { id }, data: payload, include: INCLUDE });
  await writeAudit(req, {
    tabelNama: "program_studi",
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
    await prisma.programStudi.delete({ where: { id } });
  } catch (err) {
    if (err.code === "P2003") {
      throw ApiError.conflict("Program studi masih memiliki relasi mahasiswa/pengguna");
    }
    throw err;
  }
  await writeAudit(req, {
    tabelNama: "program_studi",
    recordId: id,
    aksi: "DELETE",
    dataLama: pick(lama, AUDIT_FIELDS),
  });
  return { message: "Program studi berhasil dihapus" };
}
