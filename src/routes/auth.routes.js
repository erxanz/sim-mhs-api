import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { validate } from "../config/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Terlalu banyak percobaan login, coba lagi nanti" },
  },
});

router.post("/login", loginLimiter, validate(loginSchema), async (req, res) => {
  res.status(200).json({ success: true, data: await authService.login(req, req.valid) });
});

router.post("/refresh", validate(refreshTokenSchema), async (req, res) => {
  res.status(200).json({ success: true, data: await authService.refresh(req, req.valid.refreshToken) });
});

router.post("/logout", authenticate, async (req, res) => {
  res.status(200).json({ success: true, data: await authService.logout(req) });
});

router.get("/me", authenticate, async (req, res) => {
  res.status(200).json({ success: true, data: await authService.me(req) });
});

router.put("/password", authenticate, validate(changePasswordSchema), async (req, res) => {
  res.status(200).json({ success: true, data: await authService.changePassword(req, req.valid) });
});

export default router;
