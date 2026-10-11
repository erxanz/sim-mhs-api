import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../config/jwt.js";
import { ApiError } from "../utils/api-error.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw ApiError.unauthorized("Header Authorization dengan format Bearer <token> wajib ada");
    }

    const payload = verifyAccessToken(token);
    if (payload.typ !== "access") {
      throw ApiError.unauthorized("Token bukan access token");
    }

    const user = await prisma.pengguna.findUnique({
      where: { id: BigInt(payload.sub) },
      include: { role: true },
    });

    if (!user) {
      throw ApiError.unauthorized("Akun tidak ditemukan");
    }
    if (user.statusAktif !== "Aktif") {
      throw ApiError.forbidden("Akun tidak aktif");
    }

    req.auth = {
      id: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      idRole: user.idRole,
      role: user.role.kodeRole,
      idUniversitas: user.idUniversitas,
      idFakultas: user.idFakultas,
      idProgramStudi: user.idProgramStudi,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(ApiError.unauthorized());
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.auth.role)) {
      return next(
        ApiError.forbidden(`Role ${req.auth.role} tidak memiliki akses ke resource ini`)
      );
    }
    next();
  };
}
