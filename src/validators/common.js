import { z } from "zod";

export const idParam = z.object({
  id: z.coerce.bigint({ error: "id harus berupa angka" }).refine((v) => v > 0n, "id harus positif"),
});

export const commonListQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(["asc", "desc"]).default("desc"),
  sort: z.string().trim().max(50).optional(),
  q: z.string().trim().max(200).optional(),
};

export const dateOnly = z.coerce.date();
