import { defineConfig, devices } from "@playwright/test";
import {
  ADMIN_EMAILS,
  BASE_URL,
  E2E_DATABASE_URL,
  PORT,
  SESSION_SECRET,
} from "./e2e/helpers/env";

// Seed process.env for this (test-runner) process too — not just the
// webServer subprocess below. Playwright forks worker processes from this
// one, so they inherit these at fork time. `e2e/helpers/session.ts` needs
// SESSION_SECRET set to call lib/auth.ts's signSessionToken() directly (it
// reads process.env.SESSION_SECRET, same value the webServer is started
// with), and `e2e/global-setup.ts` / `e2e/helpers/db.ts` always point at the
// same e2e.db regardless of ambient DATABASE_URL.
process.env.DATABASE_URL = E2E_DATABASE_URL;
process.env.SESSION_SECRET = SESSION_SECRET;
process.env.ADMIN_EMAILS = ADMIN_EMAILS;

/**
 * Playwright config for the T09 E2E suite (spec AC sections A–G).
 *
 * Design notes (see task brief):
 * - `npm run dev` as the webServer, not a production build — a full
 *   `next build` per run is too slow for a spec-mapped suite this size.
 * - A dedicated port (3100) and SQLite file (`e2e.db`) keep this fully
 *   separate from a developer's own `npm run dev` (port 3000, `dev.db`).
 * - `RESEND_API_KEY`/`SUPPORT_WEBHOOK_URL` are force-set to `""` (not just
 *   omitted) so OTP + support requests always take the dev-log path
 *   regardless of what's in the ambient shell environment (spec section
 *   B/D "dev mode" behavior).
 * - Single worker, not fully parallel: every test shares one `e2e.db` file
 *   and some specs mutate global state (admin hide/unhide, capability
 *   edits) — serial execution is what makes those safe without a lock.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Migrate + seed e2e.db *before* `next dev` starts listening — see
    // e2e/global-setup.ts for why this can't be Playwright's own
    // `globalSetup` hook (webServer readiness polling would deadlock
    // against an un-migrated DB).
    command: "npx tsx e2e/global-setup.ts && npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      SESSION_SECRET,
      ADMIN_EMAILS,
      PORT: String(PORT),
      RESEND_API_KEY: "",
      SUPPORT_WEBHOOK_URL: "",
    },
  },
});
