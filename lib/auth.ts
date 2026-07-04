/**
 * Session management for TLAC Open Platform auth (spec section B).
 *
 * Sessions are a stateless, HMAC-signed cookie — no session table, no extra
 * dependency (Node's built-in `node:crypto`, no JWT/cookie-signing library).
 * The cookie value is `${base64url(payload-json)}.${base64url(hmac-sha256)}`;
 * `verifySessionToken` recomputes the signature with a timing-safe compare
 * before trusting the payload, and separately checks `exp`.
 *
 * `signSessionToken`/`verifySessionToken` are pure (no Next.js APIs) so they
 * can run in `middleware.ts` and be unit-tested directly. `createSession`,
 * `getSession`, and `destroySession` wrap them with `next/headers` `cookies()`
 * for use in Server Components and Route Handlers.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "tlac_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type SessionPayload = {
  email: string;
  isAdmin: boolean;
  /** Unix seconds. */
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set — required to sign/verify sessions.",
    );
  }
  return secret;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.email === "string" &&
    typeof candidate.isAdmin === "boolean" &&
    typeof candidate.exp === "number"
  );
}

/** Sign a session payload into a cookie-safe token. Pure, no Next.js APIs. */
export function signSessionToken(payload: SessionPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = sign(payloadB64, getSessionSecret());
  return `${payloadB64}.${signature}`;
}

/**
 * Verify a session token: bad signature, malformed payload, or expired
 * `exp` all return `null`. Pure, no Next.js APIs — safe for `middleware.ts`.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  let expectedSignature: string;
  try {
    expectedSignature = sign(payloadB64, getSessionSecret());
  } catch {
    return null;
  }

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!isSessionPayload(payload)) return null;
  if (payload.exp * 1000 < Date.now()) return null;

  return payload;
}

/** Derive admin status from the comma-separated `ADMIN_EMAILS` env var. */
export function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const admins = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

/** Sign a session for `{ email, isAdmin }` and set it as an httpOnly cookie. */
export async function createSession(params: {
  email: string;
  isAdmin: boolean;
}): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = signSessionToken({
    email: params.email,
    isAdmin: params.isAdmin,
    exp,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Read + verify the session cookie for the current request. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Clear the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
