import { Router } from "express";
import { validate } from "../config/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createUniversitasSchema,
  idParam,
  universitasListQuery,
  updateUniversitasSchema,
} from "../validators/master.validator.js";
import * as service from "../services/universitas.service.js";

const router = Router();

// Endpoint publik: siapa saja (termasuk publik landing page) dapat melihat data profil universitas
router.get("/", validate(universitasListQuery, "query"), async (req, res) => {
  res.json({ success: true, ...(await service.list(req.valid)) });
});

router.get("/:id", validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.getById(req.valid.id) });
});

// Endpoint terproteksi: hanya ADMIN yang berhak menambah, mengubah, atau menghapus profil universitas
router.use(authenticate);
router.use(authorize("ADMIN"));

router.post("/", validate(createUniversitasSchema), async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req, req.valid) });
});

router.patch("/:id", validate(idParam, "params"), validate(updateUniversitasSchema), async (req, res) => {
  res.json({ success: true, data: await service.update(req, req.valid.id, req.valid) });
});

router.delete("/:id", validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.remove(req, req.valid.id) });
});

export default router;

