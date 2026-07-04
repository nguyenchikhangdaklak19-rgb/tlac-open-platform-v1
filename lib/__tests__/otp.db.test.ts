import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hashOtpCode,
  issueOtp,
  OTP_MAX_ACTIVE,
  OtpRateLimitError,
  registerAndIssueOtp,
  verifyOtp,
} from "@/lib/otp";
import { createTestDb, type TestDb } from "./db-test-helpers";
import type { PrismaClient } from "../../prisma/generated/prisma/client";

let db: TestDb;
let prisma: PrismaClient;

beforeEach(() => {
  db = createTestDb();
  prisma = db.prisma;
});

afterEach(async () => {
  await db.cleanup();
});

describe("issueOtp", () => {
  it("creates a single-use, hash-only OTP row with a ~10 minute expiry", async () => {
    const before = Date.now();
    const { code, expiresAt } = await issueOtp(prisma, "user@example.com");

    expect(code).toMatch(/^\d{6}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(before + 9 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(before + 10 * 60 * 1000 + 1000);

    const row = await prisma.otpCode.findFirstOrThrow({
      where: { email: "user@example.com" },
    });
    expect(row.codeHash).toBe(hashOtpCode(code));
    expect(row.codeHash).not.toBe(code);
    expect(row.consumedAt).toBeNull();
  });

  it("normalizes email casing/whitespace", async () => {
    await issueOtp(prisma, "  User@Example.com  ");
    const rows = await prisma.otpCode.findMany({});
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("user@example.com");
  });

  it("enforces a cooldown between two issues for the same email", async () => {
    await issueOtp(prisma, "cooldown@example.com");
    await expect(issueOtp(prisma, "cooldown@example.com")).rejects.toBeInstanceOf(
      OtpRateLimitError,
    );
  });

  it("does not rate-limit issuing codes for two different emails back to back", async () => {
    await issueOtp(prisma, "a@example.com");
    await expect(issueOtp(prisma, "b@example.com")).resolves.toBeTruthy();
  });

  it("blocks issuing once the active-code cap is reached", async () => {
    const email = "capped@example.com";
    const past = new Date(Date.now() - 60 * 60 * 1000); // 1h ago: clears cooldown
    const future = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.otpCode.createMany({
      data: Array.from({ length: OTP_MAX_ACTIVE }, (_, i) => ({
        email,
        codeHash: hashOtpCode(String(i).padStart(6, "0")),
        expiresAt: future,
        createdAt: past,
      })),
    });

    await expect(issueOtp(prisma, email)).rejects.toBeInstanceOf(OtpRateLimitError);
  });

  it("resend invalidates the previously active code for that email", async () => {
    const email = "resend@example.com";
    const first = await issueOtp(prisma, email);

    // Simulate enough time passing to clear the cooldown, without touching
    // expiresAt (the code is still otherwise "active").
    await prisma.otpCode.updateMany({
      where: { email },
      data: { createdAt: new Date(Date.now() - 40 * 1000) },
    });

    const second = await issueOtp(prisma, email);
    expect(second.code).not.toBe(first.code);

    // Old code no longer verifies...
    const oldResult = await verifyOtp(prisma, email, first.code);
    expect(oldResult).toEqual({ ok: false, reason: "invalid" });

    // ...but the new one does.
    const newResult = await verifyOtp(prisma, email, second.code);
    expect(newResult).toEqual({ ok: true });
  });
});

describe("verifyOtp", () => {
  it("accepts the correct code once", async () => {
    const email = "once@example.com";
    const { code } = await issueOtp(prisma, email);

    await expect(verifyOtp(prisma, email, code)).resolves.toEqual({ ok: true });
    // Single-use: the same code cannot be redeemed twice.
    await expect(verifyOtp(prisma, email, code)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a wrong code as invalid", async () => {
    const email = "wrong@example.com";
    const { code } = await issueOtp(prisma, email);
    const wrongCode = code === "000000" ? "111111" : "000000";

    await expect(verifyOtp(prisma, email, wrongCode)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an expired code as expired, then consumes it", async () => {
    const email = "expired@example.com";
    const { code } = await issueOtp(prisma, email);

    await prisma.otpCode.updateMany({
      where: { email },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(verifyOtp(prisma, email, code)).resolves.toEqual({
      ok: false,
      reason: "expired",
    });
    // Expired codes are also single-use once flagged.
    await expect(verifyOtp(prisma, email, code)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("treats emails as case-insensitive at verification time", async () => {
    const { code } = await issueOtp(prisma, "MixedCase@Example.com");
    await expect(
      verifyOtp(prisma, "mixedcase@example.com", code),
    ).resolves.toEqual({ ok: true });
  });
});

describe("registerAndIssueOtp", () => {
  it("creates a new unverified User and issues an OTP for a brand-new email", async () => {
    const result = await registerAndIssueOtp(prisma, "new@example.com");
    expect(result.status).toBe("issued");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "new@example.com" },
    });
    expect(user.emailVerified).toBe(false);
  });

  it("does not duplicate the User row when re-registering before verification", async () => {
    await registerAndIssueOtp(prisma, "pending@example.com");
    // Bypass cooldown so the second registerAndIssueOtp call can issue.
    await prisma.otpCode.updateMany({
      where: { email: "pending@example.com" },
      data: { createdAt: new Date(Date.now() - 40 * 1000) },
    });

    const second = await registerAndIssueOtp(prisma, "pending@example.com");
    expect(second.status).toBe("issued");

    const users = await prisma.user.findMany({
      where: { email: "pending@example.com" },
    });
    expect(users).toHaveLength(1);
  });

  it("blocks duplicate registration and issues no OTP when the email is already verified", async () => {
    await prisma.user.create({
      data: { email: "verified@example.com", emailVerified: true },
    });

    const result = await registerAndIssueOtp(prisma, "verified@example.com");
    expect(result).toEqual({ status: "already_verified" });

    const otpRows = await prisma.otpCode.findMany({
      where: { email: "verified@example.com" },
    });
    expect(otpRows).toHaveLength(0);

    const users = await prisma.user.findMany({
      where: { email: "verified@example.com" },
    });
    expect(users).toHaveLength(1);
  });
});
