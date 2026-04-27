import { PrismaClient } from "@prisma/client";

/**
 * PRODUCTION-GRADE PRISMA SINGLETON
 *
 * Why this configuration:
 * 1. The global singleton prevents Prisma from creating a new connection pool
 *    on every hot-reload in Next.js dev mode (which would exhaust the DB limit).
 * 2. connection_limit=10 is set at the URL level (via DATABASE_URL env).
 *    Prisma's default is cpu_cores*2+1, which massively oversubscribes Supabase's
 *    per-client allocation when multiple pipelines run simultaneously.
 * 3. pool_timeout=30 gives a clean error instead of hanging indefinitely.
 *
 * DATABASE_URL must use the session-mode pooler (port 5432), NOT the
 * transaction-mode pooler (port 6543). Prisma uses prepared statements which
 * are incompatible with transaction mode and will cause silent connection leaks.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["warn", "error"]
      : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
