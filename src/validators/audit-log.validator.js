import { z } from "zod";

export const auditLogListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(["asc", "desc"]).default("desc"),
  sort: z.string().trim().max(50).optional(),
  tabel_nama: z.string().trim().max(100).optional(),
  aksi: z.enum(["LOGIN", "LOGOUT", "INSERT", "UPDATE", "DELETE", "VIEW"]).optional(),
  id_pengguna: z.coerce.bigint().optional(),
  record_id: z.string().trim().max(100).optional(),
  dari: z.coerce.date().optional(),
  sampai: z.coerce.date().optional(),
});
