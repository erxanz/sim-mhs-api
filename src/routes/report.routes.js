import { Router } from "express";
import { validate } from "../config/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { reportListQuery } from "../validators/mahasiswa.validator.js";
import * as service from "../services/report.service.js";

const router = Router();

router.use(authenticate, authorize("ADMIN", "BAAK", "DOSEN"));

router.get("/mahasiswa-per-prodi", validate(reportListQuery, "query"), async (req, res) => {
  res.json({ success: true, ...(await service.mahasiswaPerProdi(req.valid)) });
});

router.get("/statistik-mahasiswa", async (_req, res) => {
  res.json({ success: true, data: await service.statistikMahasiswa() });
});

export default router;
