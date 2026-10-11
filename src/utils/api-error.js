export class ApiError extends Error {
  constructor(status, message, { code = "ERROR", details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message = "Permintaan tidak valid", details) {
    return new ApiError(400, message, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message = "Tidak terautentikasi", details) {
    return new ApiError(401, message, { code: "UNAUTHORIZED", details });
  }

  static forbidden(message = "Akses ditolak", details) {
    return new ApiError(403, message, { code: "FORBIDDEN", details });
  }

  static notFound(message = "Data tidak ditemukan", details) {
    return new ApiError(404, message, { code: "NOT_FOUND", details });
  }

  static conflict(message = "Konflik data", details) {
    return new ApiError(409, message, { code: "CONFLICT", details });
  }

  static unprocessable(message = "Validasi gagal", details) {
    return new ApiError(422, message, { code: "VALIDATION_ERROR", details });
  }

  static internal(message = "Terjadi kesalahan pada server") {
    return new ApiError(500, message, { code: "INTERNAL_ERROR" });
  }
}
