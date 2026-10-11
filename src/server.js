import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { disconnectPrisma } from "./config/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`SIM Mahasiswa API berjalan di http://localhost:${env.PORT}`);
  console.log(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
});

async function shutdown(signal) {
  console.log(`\n[${signal}] Menutup server dengan graceful shutdown...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Graceful shutdown timeout, memaksa keluar");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED_REJECTION]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT_EXCEPTION]", err);
  shutdown("UNCAUGHT_EXCEPTION");
});
