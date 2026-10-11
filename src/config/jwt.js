import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function signAccessToken(user) {
  const payload = {
    sub: String(user.id),
    username: user.username,
    nama: user.namaLengkap,
    role: user.role?.kodeRole,
    scope: {
      idUniversitas: user.idUniversitas ? String(user.idUniversitas) : null,
      idFakultas: user.idFakultas ? String(user.idFakultas) : null,
      idProgramStudi: user.idProgramStudi ? String(user.idProgramStudi) : null,
    },
    typ: "access",
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: "sim-mhs-api",
  });
}

export function signRefreshToken(user) {
  const payload = {
    sub: String(user.id),
    username: user.username,
    typ: "refresh",
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: "sim-mhs-api",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: "sim-mhs-api" });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: "sim-mhs-api" });
}
