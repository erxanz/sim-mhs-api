import net from "node:net";
import { prisma } from "../config/prisma.js";
import { buildMeta, buildOrderBy } from "../utils/pagination.js";

function clientIp(req) {
  const raw =
    req?.headers?.["x-forwarded-for"] ??
    req?.headers?.["x-real-ip"] ??
    req?.ip ??
    req?.socket?.remoteAddress ??
    null;
  if (!raw) return null;
  const candidate = String(raw).split(",")[0].trim().replace(/^::ffff:/, "");
  return net.isIP(candidate) ? candidate : null;
}

export async function writeAudit(
  req,
  { idPengguna = null, tabelNama, recordId, aksi, dataLama = null, dataBaru = null }
) {
  try {
    await prisma.auditLog.create({
      data: {
        idPengguna: idPengguna ?? req?.auth?.id ?? null,
        tabelNama,
        recordId: recordId === null || recordId === undefined ? null : String(recordId),
        aksi,
        dataLama,
        dataBaru,
        ipAddress: clientIp(req),
        userAgent: req?.headers?.["user-agent"] ?? null,
      },
    });
  } catch (err) {
    console.error("[AUDIT] gagal menulis audit log:", err.message);
  }
}

const SORTABLE = ["id", "waktu", "aksi", "tabelNama"];

export async function list(query) {
  const {
    page,
    limit,
    order,
    sort,
    tabel_nama: tabelNama,
    aksi,
    id_pengguna: idPengguna,
    record_id: recordId,
    dari,
    sampai,
  } = query;

  const where = {
    ...(tabelNama ? { tabelNama: { equals: tabelNama, mode: "insensitive" } } : {}),
    ...(aksi ? { aksi } : {}),
    ...(idPengguna ? { idPengguna } : {}),
    ...(recordId ? { recordId } : {}),
    ...(dari || sampai
      ? { waktu: { ...(dari ? { gte: dari } : {}), ...(sampai ? { lte: sampai } : {}) } }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: {
        pengguna: { select: { id: true, username: true, namaLengkap: true } },
      },
      orderBy: buildOrderBy(sort, order, SORTABLE, "waktu"),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, limit) };
}
