import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../config/jwt.js";
import { ApiError } from "../utils/api-error.js";
import { pick } from "../utils/object.js";
import { writeAudit } from "./audit-log.service.js";

const SALT_ROUNDS = 10;

const USER_SELECT = {
  id: true,
  idRole: true,
  idUniversitas: true,
  idFakultas: true,
  idProgramStudi: true,
  username: true,
  namaLengkap: true,
  email: true,
  noHp: true,
  statusAktif: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, kodeRole: true, namaRole: true } },
};

function publicUser(user) {
  return user;
}

async function loadUserByUsername(username) {
  return prisma.pengguna.findUnique({
    where: { username },
    include: { role: true },
  });
}

async function loadActiveUser(id) {
  const user = await prisma.pengguna.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!user) throw ApiError.unauthorized("Akun tidak ditemukan");
  if (user.statusAktif !== "Aktif") throw ApiError.forbidden("Akun tidak aktif");
  return user;
}

export async function login(req, { username, password }) {
  const user = await loadUserByUsername(username);
  const passwordCocok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!passwordCocok) {
    await writeAudit(req, {
      idPengguna: user?.id ?? null,
      tabelNama: "pengguna",
      recordId: user?.id ?? null,
      aksi: "LOGIN",
      dataBaru: { username, hasil: "GAGAL" },
    });
    throw ApiError.unauthorized("Username atau password salah");
  }

  if (user.statusAktif !== "Aktif") {
    throw ApiError.forbidden("Akun tidak aktif, hubungi administrator");
  }

  const updated = await prisma.pengguna.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
    include: { role: true },
  });

  await writeAudit(req, {
    idPengguna: user.id,
    tabelNama: "pengguna",
    recordId: user.id,
    aksi: "LOGIN",
    dataBaru: { username: user.username, role: user.role.kodeRole },
  });

  return {
    accessToken: signAccessToken(updated),
    refreshToken: signRefreshToken(updated),
    tokenType: "Bearer",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    user: pick(publicUser(updated), Object.keys(USER_SELECT)),
  };
}

export async function refresh(req, refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  if (payload.typ !== "refresh") {
    throw ApiError.unauthorized("Token bukan refresh token");
  }
  const user = await loadActiveUser(BigInt(payload.sub));
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    tokenType: "Bearer",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
}

export async function logout(req) {
  await writeAudit(req, {
    tabelNama: "pengguna",
    recordId: req.auth.id,
    aksi: "LOGOUT",
    dataLama: { username: req.auth.username },
  });
  return { message: "Berhasil keluar" };
}

export async function me(req) {
  const user = await prisma.pengguna.findUnique({
    where: { id: req.auth.id },
    select: USER_SELECT,
  });
  if (!user) throw ApiError.unauthorized("Akun tidak ditemukan");
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { idPengguna: req.auth.id },
    select: { id: true, npm: true, namaMahasiswa: true, idProgramStudi: true },
  });
  return { ...user, mahasiswa };
}

export async function changePassword(req, { passwordLama, passwordBaru }) {
  const user = await prisma.pengguna.findUnique({ where: { id: req.auth.id } });
  if (!user) throw ApiError.unauthorized("Akun tidak ditemukan");

  const cocok = await bcrypt.compare(passwordLama, user.passwordHash);
  if (!cocok) throw ApiError.badRequest("Password lama tidak sesuai");

  const passwordHash = await bcrypt.hash(passwordBaru, SALT_ROUNDS);
  await prisma.pengguna.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await writeAudit(req, {
    tabelNama: "pengguna",
    recordId: user.id,
    aksi: "UPDATE",
    dataLama: { passwordHash: "***" },
    dataBaru: { passwordHash: "***" },
  });

  return { message: "Password berhasil diperbarui" };
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
