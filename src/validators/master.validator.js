import { z } from "zod";
import { commonListQuery, idParam } from "./common.js";

export const universitasListQuery = z.object({
  ...commonListQuery,
  kota: z.string().trim().max(100).optional(),
});

const universitasBase = {
  kodeUniversitas: z.string().trim().min(1).max(20),
  namaUniversitas: z.string().trim().min(1).max(200),
  slogan: z.string().trim().max(255).nullish(),
  alamat: z.string().trim().max(5000).nullish(),
  kota: z.string().trim().max(100).nullish(),
  provinsi: z.string().trim().max(100).nullish(),
  kodePos: z.string().trim().max(10).nullish(),
  website: z.string().trim().url("Website harus berupa URL valid").max(255).nullish(),
  email: z.string().trim().email("Email tidak valid").max(150).nullish(),
  telepon: z.string().trim().max(50).nullish(),
};

export const createUniversitasSchema = z.object(universitasBase);
export const updateUniversitasSchema = z
  .object(universitasBase)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Minimal satu field harus dikirim");

export const fakultasListQuery = z.object({
  ...commonListQuery,
  id_universitas: z.coerce.bigint().optional(),
});

const fakultasBase = {
  idUniversitas: z.coerce.bigint(),
  kodeFakultas: z.string().trim().min(1).max(20),
  namaFakultas: z.string().trim().min(1).max(200),
};

export const createFakultasSchema = z.object(fakultasBase);
export const updateFakultasSchema = z
  .object(fakultasBase)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Minimal satu field harus dikirim");

export const programStudiListQuery = z.object({
  ...commonListQuery,
  id_fakultas: z.coerce.bigint().optional(),
  status_aktif: z.enum(["Aktif", "Tidak Aktif"]).optional(),
  jenjang: z.string().trim().max(20).optional(),
});

const programStudiBase = {
  idFakultas: z.coerce.bigint(),
  kodeProgramStudi: z.string().trim().min(1).max(20),
  namaProgramStudi: z.string().trim().min(1).max(200),
  jenjang: z.string().trim().min(1).max(20).default("S1"),
  statusAktif: z.enum(["Aktif", "Tidak Aktif"]).default("Aktif"),
};

export const createProgramStudiSchema = z.object(programStudiBase);
export const updateProgramStudiSchema = z
  .object(programStudiBase)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Minimal satu field harus dikirim");

export const roleListQuery = z.object(commonListQuery);

const roleBase = {
  kodeRole: z.string().trim().min(1).max(30),
  namaRole: z.string().trim().min(1).max(100),
  keterangan: z.string().trim().max(255).nullish(),
};

export const createRoleSchema = z.object(roleBase);
export const updateRoleSchema = z
  .object(roleBase)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Minimal satu field harus dikirim");

export { idParam };
