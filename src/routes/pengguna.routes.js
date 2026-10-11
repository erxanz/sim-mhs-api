import { Router } from "express";
import { validate } from "../config/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createPenggunaSchema,
  idParam,
  penggunaListQuery,
  updatePenggunaSchema,
} from "../validators/pengguna.validator.js";
import * as service from "../services/pengguna.service.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", validate(penggunaListQuery, "query"), async (req, res) => {
  res.json({ success: true, ...(await service.list(req.valid)) });
});

router.get("/:id", validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.getById(req.valid.id) });
});

router.post("/", validate(createPenggunaSchema), async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req, req.valid) });
});

router.patch("/:id", validate(idParam, "params"), validate(updatePenggunaSchema), async (req, res) => {
  res.json({ success: true, data: await service.update(req, req.valid.id, req.valid) });
});

router.delete("/:id", validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.remove(req, req.valid.id) });
});

export default router;
