/**
 * Direct SQLite access to the e2e database (task T09) — raw `better-sqlite3`,
 * deliberately *not* the generated Prisma Client.
 *
 * The generated client (`prisma/generated/prisma/client`) is an ESM module
 * that uses `import.meta`. `e2e/global-setup.ts` runs under `tsx` (a real
 * ESM loader) so it can import that client directly — but files under
 * `e2e/**` that Playwright's test runner loads go through its own
 * CJS-targeting transform, which chokes on `import.meta` with
 * `SyntaxError: Cannot use 'import.meta' outside a module`. Talking to
 * `e2e.db` with `better-sqlite3` directly (already a project dependency,
 * a plain native CJS binding) sidesteps that entirely — the schema here
 * mirrors `prisma/schema.prisma`'s `Capability`/`User`/`OtpCode` models
 * exactly (table/column names are unmapped, i.e. identical to the model).
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

let db: Database.Database | undefined;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(process.cwd(), "e2e.db"));
  }
  return db;
}

export type CapabilityRow = {
  id: string;
  slug: string;
  name: string;
  configSnippet: string;
  status: "VISIBLE" | "HIDDEN";
};

export function getCapabilityBySlug(slug: string): CapabilityRow {
  const row = getDb()
    .prepare(
      "SELECT id, slug, name, configSnippet, status FROM Capability WHERE slug = ?",
    )
    .get(slug) as CapabilityRow | undefined;
  if (!row) throw new Error(`No seeded capability with slug "${slug}"`);
  return row;
}

export function countVisibleCapabilities(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as count FROM Capability WHERE status = 'VISIBLE'")
    .get() as { count: number };
  return row.count;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Insert (or reactivate) a `User` row with a given verified/admin state. */
export function upsertUser(email: string, params: { emailVerified: boolean; isAdmin: boolean }): void {
  const normalizedEmail = email.trim().toLowerCase();
  const database = getDb();
  const existing = database.prepare("SELECT id FROM User WHERE email = ?").get(normalizedEmail) as
    | { id: string }
    | undefined;

  if (existing) {
    database
      .prepare("UPDATE User SET emailVerified = ?, isAdmin = ?, updatedAt = ? WHERE id = ?")
      .run(params.emailVerified ? 1 : 0, params.isAdmin ? 1 : 0, nowIso(), existing.id);
    return;
  }

  database
    .prepare(
      "INSERT INTO User (id, email, emailVerified, isAdmin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(randomUUID(), normalizedEmail, params.emailVerified ? 1 : 0, params.isAdmin ? 1 : 0, nowIso(), nowIso());
}

/** Create a brand-new, unverified `User` row (spec section B, unverified-login test). */
export function createUnverifiedUser(email: string): void {
  upsertUser(email, { emailVerified: false, isAdmin: false });
}
