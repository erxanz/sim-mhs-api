import multer from "multer";
import { env } from "./env.js";

export const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FOTO_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.fieldname || file.fieldname !== "foto") {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "foto"));
    }
    cb(null, true);
  },
});
