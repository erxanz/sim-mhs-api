import { z } from "zod";
import { ApiError } from "./api-error.js";

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(["asc", "desc"]).default("desc"),
};

export function buildOrderBy(sort, order, allowedSorts, fallback) {
  const field = allowedSorts.includes(sort) ? sort : fallback;
  return { [field]: order };
}

export function buildMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

export function toId(value, field = "id") {
  const id = typeof value === "bigint" ? value : Number(value);
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest(`Parameter ${field} harus berupa angka positif`);
  }
  return BigInt(id);
}
