/**
 * Authorization gate for the Admin CMS (spec section E).
 *
 * `middleware.ts` (owned by another task) is the first line of defense — it
 * already redirects logged-out visitors to `/login` and returns a plaintext
 * 403 for non-admin sessions on `/admin/*`. This helper is the *second* line:
 * every `app/admin/**` page and every `app/api/admin/**` route re-checks the
 * session here before doing anything else, so a future change to the
 * middleware matcher (or a route reached some other way) can't silently
 * expose admin data.
 *
 * Pure — takes the already-verified `SessionPayload | null` (from
 * `getSession()`), no I/O — so it's trivially unit-testable without mocking
 * `next/headers`.
 */
import type { SessionPayload } from "@/lib/auth";

/** True only for a present, unexpired session whose `isAdmin` flag is set. */
export function requireAdmin(
  session: SessionPayload | null | undefined,
): session is SessionPayload & { isAdmin: true } {
  return session != null && session.isAdmin === true;
}
