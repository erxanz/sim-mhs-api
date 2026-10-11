import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";
import { hashPassword } from "./auth.service.js";

const SORTABLE = ["id", "username", "namaLengkap", "statusAktif", "lastLogin", "createdAt"];

const AUDIT_FIELDS = [
  "idRole",
  "idUniversitas",
  "idFakultas",
  "idProgramStudi",
  "username",
  "namaLengkap",
  "email",
  "noHp",
  "statusAktif",
];

const INCLUDE = {
  role: true,
  universitas: { select: { id: true, kodeUniversitas: true, namaUniversitas: true } },
  fakultas: { select: { id: true, kodeFakultas: true, namaFakultas: true } },
  programStudi: {
    select: { id: true, kodeProgramStudi: true, namaProgramStudi: true, jenjang: true },
  },
};

function sanitize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function list(query) {
  const { page, limit, order, sort, q, id_role: idRole, status_aktif: statusAktif } = query;
  const where = {
    ...(idRole ? { idRole: Number(idRole) } : {}),
    ...(statusAktif ? { statusAktif } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { namaLengkap: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.pengguna.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(sort, order, SORTABLE, "createdAt"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.pengguna.count({ where }),
  ]);

  return { data: rows.map(sanitize), meta: buildMeta(total, page, limit) };
}

export async function getById(id) {
  const data = await prisma.pengguna.findUnique({ where: { id }, include: INCLUDE });
  if (!data) throw ApiError.notFound("Pengguna tidak ditemukan");
  return sanitize(data);
}

async function assertRefs(payload) {
  const [role, universitas, fakultas, prodi] = await Promise.all([
    prisma.role.findUnique({ where: { id: payload.idRole }, select: { id: true } }),
    payload.idUniversitas
      ? prisma.universitas.findUnique({ where: { id: payload.idUniversitas }, select: { id: true } })
      : Promise.resolve({ id: true }),
    payload.idFakultas
      ? prisma.fakultas.findUnique({ where: { id: payload.idFakultas }, select: { id: true } })
      : Promise.resolve({ id: true }),
    payload.idProgramStudi
      ? prisma.programStudi.findUnique({
          where: { id: payload.idProgramStudi },
          select: { id: true },
        })
      : Promise.resolve({ id: true }),
  ]);

  if (!role) throw ApiError.badRequest("Role tidak ditemukan");
  if (payload.idUniversitas && !universitas) {
    throw ApiError.badRequest("Universitas tidak ditemukan");
  }
  if (payload.idFakultas && !fakultas) throw ApiError.badRequest("Fakultas tidak ditemukan");
  if (payload.idProgramStudi && !prodi) throw ApiError.badRequest("Program studi tidak ditemukan");
}

export async function create(req, payload) {
  await assertRefs(payload);
  const { password, ...rest } = payload;
  const passwordHash = await hashPassword(password);

  const data = await prisma.pengguna.create({
    data: { ...rest, passwordHash },
    include: INCLUDE,
  });

  await writeAudit(req, {
    tabelNama: "pengguna",
    recordId: data.id,
    aksi: "INSERT",
    dataBaru: { ...pick(data, AUDIT_FIELDS), passwordHash: "***" },
  });

  return sanitize(data);
}

export async function update(req, id, payload) {
  const lama = await prisma.pengguna.findUnique({ where: { id } });
  if (!lama) throw ApiError.notFound("Pengguna tidak ditemukan");

  await assertRefs({ idRole: payload.idRole ?? lama.idRole, ...payload });

  const { password, ...rest } = payload;
  const data = await prisma.pengguna.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
    include: INCLUDE,
  });

  await writeAudit(req, {
    tabelNama: "pengguna",
    recordId: data.id,
    aksi: "UPDATE",
    dataLama: { ...pick(lama, AUDIT_FIELDS), passwordHash: "***" },
    dataBaru: { ...pick(data, AUDIT_FIELDS), passwordHash: password ? "***" : undefined },
  });

  return sanitize(data);
}

export async function remove(req, id) {
  const lama = await prisma.pengguna.findUnique({ where: { id } });
  if (!lama) throw ApiError.notFound("Pengguna tidak ditemukan");

  const terkait = await prisma.mahasiswa.count({ where: { idPengguna: id } });
  if (terkait > 0) {
    throw ApiError.conflict("Pengguna masih tertaut ke data mahasiswa, lepaskan tautan terlebih dahulu");
  }

  await prisma.pengguna.delete({ where: { id } });
  await writeAudit(req, {
    tabelNama: "pengguna",
    recordId: id,
    aksi: "DELETE",
    dataLama: { ...pick(lama, AUDIT_FIELDS), passwordHash: "***" },
  });

  return { message: "Pengguna berhasil dihapus" };
}
