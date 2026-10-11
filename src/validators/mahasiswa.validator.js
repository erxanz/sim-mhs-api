import { z } from "zod";
import { commonListQuery, idParam, dateOnly } from "./common.js";

export const mahasiswaListQuery = z.object({
  ...commonListQuery,
  id_program_studi: z.coerce.bigint().optional(),
  status_mahasiswa: z
    .enum(["Aktif", "Cuti", "Lulus", "Mengundurkan Diri", "Drop Out", "Tidak Aktif"])
    .optional(),
  jenis_kelamin: z.enum(["L", "P"]).optional(),
  jenjang: z.string().trim().max(20).optional(),
  tanggal_masuk_dari: dateOnly.optional(),
  tanggal_masuk_sampai: dateOnly.optional(),
});

const mahasiswaSchema = z.object({
  idPengguna: z.coerce.bigint().nullish(),
  idProgramStudi: z.coerce.bigint(),
  npm: z.string().trim().min(1).max(30),
  namaMahasiswa: z.string().trim().min(1).max(200),
  jenisKelamin: z.enum(["L", "P"]),
  tempatLahir: z.string().trim().max(100).nullish(),
  tanggalLahir: dateOnly.nullish(),
  tanggalMasuk: dateOnly,
  alamat: z.string().trim().max(5000).nullish(),
  statusMahasiswa: z
    .enum(["Aktif", "Cuti", "Lulus", "Mengundurkan Diri", "Drop Out", "Tidak Aktif"])
    .default("Aktif"),
  fotoUrl: z.string().trim().max(5000).nullish(),
  fotoStorageKey: z.string().trim().max(5000).nullish(),
});

export const createMahasiswaSchema = mahasiswaSchema;
export const updateMahasiswaSchema = mahasiswaSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Minimal satu field harus dikirim");

export const reportListQuery = z.object({
  status_mahasiswa: z
    .enum(["Aktif", "Cuti", "Lulus", "Mengundurkan Diri", "Drop Out", "Tidak Aktif"])
    .optional(),
  id_program_studi: z.coerce.bigint().optional(),
  id_fakultas: z.coerce.bigint().optional(),
  id_universitas: z.coerce.bigint().optional(),
});

export const npmParam = z.object({
  npm: z.string().trim().min(1).max(30),
});

export { idParam };
