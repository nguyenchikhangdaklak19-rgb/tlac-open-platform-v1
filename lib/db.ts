/**
 * Prisma Client singleton for TLAC Open Platform.
 *
 * Next.js dev mode hot-reloads modules on every file save, which would
 * otherwise create a fresh `PrismaClient` (and a fresh SQLite connection) per
 * reload and quickly exhaust connections. We stash the instance on
 * `globalThis` in non-production so it survives HMR, following the standard
 * Prisma + Next.js pattern: https://pris.ly/d/help/next-js-best-practices
 *
 * Prisma 7 no longer reads the datasource URL from `schema.prisma` — the
 * connection is provided at runtime via a driver adapter (see
 * `prisma.config.ts` for the equivalent used by the CLI/migrate).
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../prisma/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
