import { Router } from "express";
import { validate } from "../config/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { auditLogListQuery } from "../validators/audit-log.validator.js";
import * as service from "../services/audit-log.service.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", validate(auditLogListQuery, "query"), async (req, res) => {
  res.json({ success: true, ...(await service.list(req.valid)) });
});

export default router;
