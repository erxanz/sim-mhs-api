import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "./env.js";

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
