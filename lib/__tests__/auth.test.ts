import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAdminEmail, signSessionToken, verifySessionToken } from "@/lib/auth";

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
