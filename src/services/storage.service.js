import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

function safeKey(key) {
  const base = path.basename(key);
  if (!base || base !== key) return null;
  return base;
}

export async function saveFoto(npm, buffer, ext) {
  await mkdir(uploadRoot, { recursive: true });
  const filename = `${npm}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  await writeFile(path.join(uploadRoot, filename), buffer);
  return { storageKey: filename, fotoUrl: `/uploads/${filename}` };
}

export async function deleteFoto(storageKey) {
  if (!storageKey) return;
  const base = safeKey(storageKey);
  if (!base) return;
  try {
    await unlink(path.join(uploadRoot, base));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}
