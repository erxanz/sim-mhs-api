import { Router } from "express";
import { validate } from "../config/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createProgramStudiSchema,
  idParam,
  programStudiListQuery,
  updateProgramStudiSchema,
} from "../validators/master.validator.js";
import * as service from "../services/program-studi.service.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(programStudiListQuery, "query"), async (req, res) => {
  res.json({ success: true, ...(await service.list(req.valid)) });
});

router.get("/:id", validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.getById(req.valid.id) });
});

router.post("/", authorize("ADMIN"), validate(createProgramStudiSchema), async (req, res) => {
  res.status(201).json({ success: true, data: await service.create(req, req.valid) });
});

router.patch("/:id", authorize("ADMIN"), validate(idParam, "params"), validate(updateProgramStudiSchema), async (req, res) => {
  res.json({ success: true, data: await service.update(req, req.valid.id, req.valid) });
});

router.delete("/:id", authorize("ADMIN"), validate(idParam, "params"), async (req, res) => {
  res.json({ success: true, data: await service.remove(req, req.valid.id) });
});

export default router;
