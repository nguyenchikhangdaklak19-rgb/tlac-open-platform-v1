/**
 * Shared setup for the Prisma data-model tests: each test file gets its own
 * throwaway SQLite file (never `dev.db`), built by replaying the real
 * migrations under `prisma/migrations`, and torn down afterwards.
 *
 * We apply migrations directly with `better-sqlite3` instead of shelling out
 * to `prisma migrate deploy` so tests stay fast and don't depend on the CLI
 * being available in the runner.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../prisma/migrations");

function applyMigrations(dbPath: string): void {
  const db = new Database(dbPath);
  try {
    const entries = readdirSync(MIGRATIONS_DIR)
      .filter((name) => statSync(path.join(MIGRATIONS_DIR, name)).isDirectory())
      .sort();
    for (const dir of entries) {
      const migrationFile = path.join(MIGRATIONS_DIR, dir, "migration.sql");
      const sql = readFileSync(migrationFile, "utf-8");
      db.exec(sql);
    }
  } finally {
    db.close();
  }
}

export type TestDb = {
  prisma: PrismaClient;
  cleanup: () => Promise<void>;
};

/** Create a fresh, migrated SQLite database file and a Prisma client for it. */
export function createTestDb(): TestDb {
  const dir = mkdtempSync(path.join(tmpdir(), "tlac-prisma-test-"));
  const dbPath = path.join(dir, "test.db");
  applyMigrations(dbPath);

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });

  return {
    prisma,
    async cleanup() {
      await prisma.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
