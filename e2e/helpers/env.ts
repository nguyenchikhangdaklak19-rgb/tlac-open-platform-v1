/**
 * Shared constants for the Playwright E2E suite (task T09).
 *
 * Imported both by `playwright.config.ts` (to configure the `webServer` and
 * to seed `process.env` for the test-runner process itself — helpers like
 * `signSessionToken` from `lib/auth.ts` read `SESSION_SECRET` at call time)
 * and by test files/helpers that need the same values.
 *
 * A dedicated port + SQLite file keep this suite fully isolated from a
 * developer's local `npm run dev` (port 3000, `dev.db`).
 */
export const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;

/** Relative to the repo root — matches where `npm run dev`'s cwd resolves it. */
export const E2E_DATABASE_URL = "file:./e2e.db";

export const SESSION_SECRET = "e2e-secret";
export const ADMIN_EMAIL = "admin@e2e.test";
export const ADMIN_EMAILS = ADMIN_EMAIL;

/** A second, non-admin verified account seeded by global setup for auth tests. */
export const USER_EMAIL = "user@e2e.test";
