/**
 * Authenticated API-only requests for the E2E suite (task T09).
 *
 * A handful of specs need to act as Admin purely to set up/tear down state
 * (e.g. toggling a capability's status) without opening a browser page for
 * it — `request.newContext` gives a standalone `APIRequestContext` that
 * doesn't share cookies with any `BrowserContext`, so we attach the signed
 * session cookie as a plain `Cookie` header instead (same token scheme as
 * `e2e/helpers/session.ts`, used by real logged-in browser tests).
 */
import { request as playwrightRequest, type APIRequestContext } from "@playwright/test";
import { BASE_URL } from "./env";
import { SESSION_COOKIE_NAME, signToken } from "./session";

export function sessionCookieHeader(email: string, isAdmin: boolean): Record<string, string> {
  return { Cookie: `${SESSION_COOKIE_NAME}=${signToken(email, isAdmin)}` };
}

/** A standalone API request context authenticated as `email` (Admin iff `isAdmin`). */
export async function newAuthedApiContext(
  email: string,
  isAdmin: boolean,
): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: sessionCookieHeader(email, isAdmin),
  });
}
