import { Router } from "express";
import * as service from "../services/public.service.js";

const router = Router();

// Endpoint publik (tanpa token) untuk halaman landing / beranda website.
router.get("/landing", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  res.json({ success: true, data: await service.landing() });
});

export default router;
