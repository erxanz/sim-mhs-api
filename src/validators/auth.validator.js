import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(1).max(200),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

export const changePasswordSchema = z
  .object({
    passwordLama: z.string().min(1).max(200),
    passwordBaru: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .max(200)
      .regex(/[A-Z]/, "Harus mengandung huruf besar")
      .regex(/[0-9]/, "Harus mengandung angka"),
  })
  .refine((data) => data.passwordLama !== data.passwordBaru, {
    path: ["passwordBaru"],
    message: "Password baru tidak boleh sama dengan password lama",
  });
