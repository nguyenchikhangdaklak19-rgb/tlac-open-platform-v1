import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAdminEmail, signSessionToken, verifySessionToken } from "@/lib/auth";

/** Forge a token that carries a genuinely valid HMAC signature over `payload`
 * (so it passes the timing-safe compare) — used to prove the payload-shape
 * guard, not just the signature, gates trust. */
function signArbitraryPayload(payload: unknown, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

const ORIGINAL_SECRET = process.env.SESSION_SECRET;
const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-do-not-use-in-prod";
});

afterEach(() => {
  process.env.SESSION_SECRET = ORIGINAL_SECRET;
  process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
});

describe("signSessionToken / verifySessionToken", () => {
  it("round-trips a valid, unexpired payload", () => {
    const payload = {
      email: "user@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = signSessionToken(payload);
    expect(verifySessionToken(token)).toEqual(payload);
  });

  it("rejects a token with a tampered payload", () => {
    const payload = {
      email: "user@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = signSessionToken(payload);
    const [, signature] = token.split(".");

    // Tamper: swap in an admin payload but keep the original signature.
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...payload, isAdmin: true }),
      "utf8",
    ).toString("base64url");
    const forgedToken = `${forgedPayload}.${signature}`;

    expect(verifySessionToken(forgedToken)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const payload = {
      email: "user@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = signSessionToken(payload);

    process.env.SESSION_SECRET = "a-completely-different-secret";
    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects an expired token", () => {
    const payload = {
      email: "user@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) - 10,
    };
    const token = signSessionToken(payload);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifySessionToken("not-a-real-token")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("a.b.c")).toBeNull();
  });

  it("rejects a syntactically-plausible token with a non-matching signature", () => {
    const payloadB64 = Buffer.from(
      JSON.stringify({ email: "x@example.com" }),
      "utf8",
    ).toString("base64url");
    expect(verifySessionToken(`${payloadB64}.deadbeef`)).toBeNull();
  });

  it("rejects a correctly-signed token whose payload is missing required fields", () => {
    const secret = process.env.SESSION_SECRET as string;
    // Signature is valid, but payload has no `exp` / `isAdmin` — the shape
    // guard (isSessionPayload) must still reject it rather than trust it.
    const forged = signArbitraryPayload({ email: "attacker@example.com" }, secret);
    expect(verifySessionToken(forged)).toBeNull();
  });

  it("rejects a correctly-signed token whose isAdmin/exp have the wrong types", () => {
    const secret = process.env.SESSION_SECRET as string;
    const forged = signArbitraryPayload(
      { email: "x@example.com", isAdmin: "yes", exp: "soon" },
      secret,
    );
    expect(verifySessionToken(forged)).toBeNull();
  });

  it("returns null (does not throw) when SESSION_SECRET is unset", () => {
    // middleware.ts runs verifySessionToken on every guarded request; a missing
    // secret must degrade to 'no session' (→ redirect), never a 500.
    const payload = {
      email: "user@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = signSessionToken(payload);
    delete process.env.SESSION_SECRET;
    expect(() => verifySessionToken(token)).not.toThrow();
    expect(verifySessionToken(token)).toBeNull();
  });
});

describe("isAdminEmail", () => {
  it("returns true for an email present in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "admin@example.com,other@example.com";
    expect(isAdminEmail("admin@example.com")).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    process.env.ADMIN_EMAILS = " Admin@Example.com , other@example.com ";
    expect(isAdminEmail("admin@example.com")).toBe(true);
    expect(isAdminEmail("ADMIN@EXAMPLE.COM")).toBe(true);
  });

  it("returns false for an email not present in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    expect(isAdminEmail("user@example.com")).toBe(false);
  });

  it("returns false for everyone when ADMIN_EMAILS is unset/empty", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("admin@example.com")).toBe(false);
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("admin@example.com")).toBe(false);
  });
});
