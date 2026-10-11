import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./config/error.js";
import { openApiSpec } from "./docs/openapi.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("json replacer", (_key, value) => (typeof value === "bigint" ? value.toString() : value));

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(
    "/api",
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan, coba lagi nanti" },
      },
    })
  );

  app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        service: "sim-mhs-api",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use(
    "/api-docs",
    (_req, res, next) => {
      res.removeHeader("Content-Security-Policy");
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "SIM Mahasiswa UMB API Docs",
      explorer: true,
    })
  );

  app.use("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
