/**
 * E2E database setup (task T09).
 *
 * Invoked from `playwright.config.ts`'s `webServer.command` — as
 * `npx tsx e2e/global-setup.ts && npm run dev` — rather than wired up as
 * Playwright's own `globalSetup` hook. That matters: Playwright's
 * `webServer` readiness probe requires an HTTP 2xx/3xx response, and
 * Playwright starts polling for that *before* running `globalSetup`. Since
 * every page here queries the DB (`prisma.capability.findMany` etc.), a dev
 * server started against un-migrated tables 500s on every request and the
 * readiness probe never succeeds — `globalSetup` would never get a chance to
 * fix the DB, a deadlock confirmed empirically while wiring this suite up.
 * Running this *before* `next dev` even starts sidesteps that entirely.
 *
 * What it does:
 * 1. Wipes any leftover `e2e.db*` files so every run starts from the exact
 *    same, clean state — this is what lets individual specs get away with
 *    not being able to fully "undo" every mutation (e.g. there's no DELETE
 *    endpoint for a Capability, see `app/api/admin/capabilities/**`):
 *    whatever a previous run left behind never leaks into the next one.
 * 2. Runs `prisma migrate deploy` + `prisma db seed` against `e2e.db` (the
 *    same 6-capability catalog seed used for `dev.db`, see
 *    `prisma/seed.ts`).
 * 3. Seeds two verified `User` rows the auth/admin specs rely on: an admin
 *    (`ADMIN_EMAIL`, matching `ADMIN_EMAILS` passed to the `webServer`) and
 *    a plain user (`USER_EMAIL`) — both pre-verified so tests that only need
 *    "already logged in" don't have to run the OTP flow first.
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { ADMIN_EMAIL, E2E_DATABASE_URL, USER_EMAIL } from "./helpers/env";
import { upsertUser } from "./helpers/db";

function resetDatabaseFiles(): void {
  const dbPath = path.resolve(process.cwd(), "e2e.db");
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`${dbPath}${suffix}`, { force: true });
  }
}

export async function setupE2EDatabase(): Promise<void> {
  resetDatabaseFiles();

  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx prisma db seed", { stdio: "inherit", env });

  upsertUser(ADMIN_EMAIL, { emailVerified: true, isAdmin: true });
  upsertUser(USER_EMAIL, { emailVerified: true, isAdmin: false });
}

// Only run automatically when invoked as a script (`npx tsx
// e2e/global-setup.ts`, see `playwright.config.ts`'s `webServer.command`),
// not when imported (there is no other importer today, but this mirrors
// `prisma/seed.ts`'s convention for a script that's also a reusable module).
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  setupE2EDatabase().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
