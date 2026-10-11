import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import { validate } from "../config/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ApiError } from "../utils/api-error.js";
import { uploadFoto } from "../config/upload.js";
import {
  createMahasiswaSchema,
  idParam,
  mahasiswaListQuery,
  npmParam,
  updateMahasiswaSchema,
} from "../validators/mahasiswa.validator.js";
import * as service from "../services/mahasiswa.service.js";
import * as reportService from "../services/report.service.js";

const router = Router();

const AKSEN_TULIS = ["ADMIN", "BAAK"];
const AKSEN_BACA = ["ADMIN", "BAAK", "DOSEN", "MAHASISWA"];

router.use(authenticate);

router.get("/", authorize(...AKSEN_BACA), validate(mahasiswaListQuery, "query"), async (req, res) => {
  res.json({ success: true, ...(await service.list(req.valid, req.auth)) });
});

router.get("/profil/:npm", authorize(...AKSEN_BACA), validate(npmParam, "params"), async (req, res) => {
  const data = await reportService.profilMahasiswa(req.valid.npm);
  if (!data) throw ApiError.notFound("Profil mahasiswa tidak ditemukan");
  res.json({ success: true, data });
});

router.get("/:id", authorize(...AKSEN_BACA), validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.getById(req.valid.id, req.auth) });
});

router.post("/", authorize(...AKSEN_TULIS), validate(createMahasiswaSchema), async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req, req.valid) });
});

router.patch("/:id", authorize(...AKSEN_TULIS), validate(idParam, "params"), validate(updateMahasiswaSchema), async (req, res) => {
  res.json({ success: true, data: await service.update(req, req.valid.id, req.valid) });
});

router.delete("/:id", authorize(...AKSEN_TULIS), validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.remove(req, req.valid.id) });
});

router.post(
  "/:id/foto",
  authorize(...AKSEN_TULIS),
  validate(idParam, "params"),
  uploadFoto.single("foto"),
  async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest("Field file 'foto' wajib diisi");
    }

    const detected = await fileTypeFromBuffer(req.file.buffer);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!detected || !allowed.includes(detected.mime)) {
      throw ApiError.badRequest("Format foto harus JPEG, PNG, atau WebP");
    }

    const ext = detected.ext === "jpg" ? "jpeg" : detected.ext;
    res.json({
      success: true,
      data: await service.setFoto(req, req.valid.id, { buffer: req.file.buffer, ext }),
    });
  }
);

router.delete("/:id/foto", authorize(...AKSEN_TULIS), validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.removeFoto(req, req.valid.id) });
});

export default router;
