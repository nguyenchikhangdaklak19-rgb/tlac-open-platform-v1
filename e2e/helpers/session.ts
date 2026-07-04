/**
 * Signed-cookie session helpers for the E2E suite (task T09).
 *
 * Rather than driving the real OTP UI for every test that needs to be
 * "logged in" (slow, and re-tests the same auth flow covered by
 * `e2e/b-auth.spec.ts`), we sign a session cookie directly with the exact
 * same HMAC scheme the app uses (`lib/auth.ts`'s `signSessionToken`, which is
 * pure — no Next.js APIs — so it's safe to call from Node/tsx here) and hand
 * it to Playwright's `BrowserContext.addCookies`.
 *
 * Requires `process.env.SESSION_SECRET` to already be set to the same value
 * the `webServer` was started with — `playwright.config.ts` sets it (from
 * `./env.ts`) before anything else runs.
 */
import { SESSION_COOKIE_NAME, signSessionToken } from "../../lib/auth";
import { BASE_URL } from "./env";

export { SESSION_COOKIE_NAME };

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

/** Sign a session token for `email`/`isAdmin`, valid for 7 days from now. */
export function signToken(email: string, isAdmin: boolean): string {
  return signSessionToken({
    email,
    isAdmin,
    exp: Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS,
  });
}

/** A Playwright cookie object ready for `context.addCookies([...])`. */
export function sessionCookie(email: string, isAdmin: boolean) {
  const url = new URL(BASE_URL);
  return {
    name: SESSION_COOKIE_NAME,
    value: signToken(email, isAdmin),
    domain: url.hostname,
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
    secure: false,
  };
}
