import { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../utils/api-error.js";
import { isProduction } from "./env.js";

const PRISMA_ERROR_MAP = {
  P2002: (err) => {
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target.join(", ") : target;
    return ApiError.conflict(
      field ? `Nilai sudah terdaftar pada kolom: ${field}` : "Data sudah terdaftar",
      { field }
    );
  },
  P2003: () => ApiError.badRequest("Relasi data tidak valid: record terkait tidak ditemukan"),
  P2025: () => ApiError.notFound("Data tidak ditemukan"),
  P2021: () => ApiError.internal("Tabel tidak ditemukan pada database"),
  P2010: () => ApiError.internal("Kueri database gagal dieksekusi"),
  P2011: () => ApiError.badRequest("Nilai null tidak diizinkan pada kolom wajib"),
  P2014: () => ApiError.badRequest("Permintaan melibatkan relasi yang tidak valid"),
  P2015: () => ApiError.notFound("Record terkait tidak ditemukan"),
  P2016: () => ApiError.badRequest("Kueri database tidak valid"),
  P2018: () => ApiError.badRequest("Input tidak dapat di-cast ke tipe data yang benar"),
};

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

function normalizeZodIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function errorHandler(err, req, res, _next) {
  let apiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapper = PRISMA_ERROR_MAP[err.code];
    apiError = mapper ? mapper(err) : ApiError.internal();
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    apiError = ApiError.badRequest("Payload database tidak valid");
  } else if (err?.name === "ZodError") {
    apiError = ApiError.unprocessable("Validasi gagal", normalizeZodIssues(err));
  } else if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Ukuran file melebihi batas maksimum" : `Upload gagal: ${err.message}`;
    apiError = ApiError.badRequest(message, { field: err.field });
  } else if (err?.name === "JsonWebTokenError") {
    apiError = ApiError.unauthorized("Token tidak valid");
  } else if (err?.name === "TokenExpiredError") {
    apiError = ApiError.unauthorized("Token sudah kedaluwarsa");
  }

  const status = apiError?.status ?? 500;
  const code = apiError?.code ?? "INTERNAL_ERROR";
  const message = apiError?.message ?? "Terjadi kesalahan pada server";

  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(apiError?.details !== undefined ? { details: apiError.details } : {}),
      ...(status >= 500 && !isProduction ? { stack: err.stack } : {}),
    },
  });
}
