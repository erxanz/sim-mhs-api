import { Router } from "express";
import authRoutes from "./auth.routes.js";
import universitasRoutes from "./universitas.routes.js";
import fakultasRoutes from "./fakultas.routes.js";
import programStudiRoutes from "./program-studi.routes.js";
import rolesRoutes from "./roles.routes.js";
import penggunaRoutes from "./pengguna.routes.js";
import mahasiswaRoutes from "./mahasiswa.routes.js";
import auditLogRoutes from "./audit-log.routes.js";
import reportRoutes from "./report.routes.js";
import publicRoutes from "./public.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/universitas", universitasRoutes);
router.use("/fakultas", fakultasRoutes);
router.use("/program-studi", programStudiRoutes);
router.use("/roles", rolesRoutes);
router.use("/pengguna", penggunaRoutes);
router.use("/mahasiswa", mahasiswaRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/audit-log", auditLogRoutes);
router.use("/reports", reportRoutes);
router.use("/report", reportRoutes);
router.use("/public", publicRoutes);

export default router;
