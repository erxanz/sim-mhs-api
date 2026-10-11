import { z } from "zod";
import { commonListQuery, idParam } from "./common.js";

export const penggunaListQuery = z.object({
  ...commonListQuery,
  id_role: z.coerce.number().int().optional(),
  status_aktif: z.enum(["Aktif", "Tidak Aktif"]).optional(),
});

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(200)
  .regex(/[A-Z]/, "Harus mengandung huruf besar")
  .regex(/[0-9]/, "Harus mengandung angka");

const penggunaSchema = z.object({
  idRole: z.coerce.number().int(),
  idUniversitas: z.coerce.bigint().nullish(),
  idFakultas: z.coerce.bigint().nullish(),
  idProgramStudi: z.coerce.bigint().nullish(),
  username: z.string().trim().min(3).max(100),
  namaLengkap: z.string().trim().min(1).max(200),
  email: z.string().trim().email("Email tidak valid").max(150).nullish(),
  noHp: z.string().trim().max(30).nullish(),
  statusAktif: z.enum(["Aktif", "Tidak Aktif"]).default("Aktif"),
});

export const createPenggunaSchema = penggunaSchema.extend({
  password: passwordSchema,
});

export const updatePenggunaSchema = penggunaSchema
  .partial()
  .extend({ password: passwordSchema.optional() })
  .refine((data) => Object.keys(data).length > 0, "Minimal satu field harus dikirim");

export { idParam };
