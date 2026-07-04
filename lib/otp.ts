/**
 * Email OTP (one-time password) issuing/verification for TLAC Open Platform
 * auth (spec section B — Đăng ký / Đăng nhập; mechanism decided by Tech Lead:
 * 6-digit OTP, not magic link).
 *
 * Codes are never stored in plaintext — only a SHA-256 hash (`OtpCode.codeHash`,
 * see prisma/schema.prisma) — and every code is single-use: verifying a code
 * marks it consumed, and issuing a new code for an email invalidates any
 * still-active codes for that email (this is also what makes "resend"
 * behave correctly — resend just calls `issueOtp` again).
 */
import { createHash, randomInt } from "node:crypto";
import type { PrismaClient } from "../prisma/generated/prisma/client";

export const OTP_LENGTH = 6;
/** How long a freshly issued code stays redeemable. */
export const OTP_TTL_MS = 10 * 60 * 1000;
/** Minimum time between two issued codes for the same email. */
export const OTP_COOLDOWN_MS = 30 * 1000;
/** Max number of not-yet-expired, not-yet-consumed codes kept per email. */
export const OTP_MAX_ACTIVE = 5;

/** Thrown when an email is issuing OTPs faster than the rate limit allows. */
export class OtpRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpRateLimitError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Generate a random zero-padded 6-digit code, e.g. "004821". */
export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

/** SHA-256 hex digest of a code — the only form ever persisted. */
export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Issue a fresh OTP for `email`: enforces the cooldown + active-code cap,
 * invalidates any codes still active for that email, then creates + returns
 * a new one. Callers are responsible for emailing `code` to the user (see
 * `lib/email.ts`) — it is never returned by any other function once issued.
 */
export async function issueOtp(
  prisma: PrismaClient,
  email: string,
): Promise<{ code: string; expiresAt: Date }> {
  const normalizedEmail = normalizeEmail(email);

  const lastCode = await prisma.otpCode.findFirst({
    where: { email: normalizedEmail },
    orderBy: { createdAt: "desc" },
  });
  if (lastCode && Date.now() - lastCode.createdAt.getTime() < OTP_COOLDOWN_MS) {
    throw new OtpRateLimitError(
      "Bạn vừa yêu cầu mã. Vui lòng đợi ít phút rồi thử lại.",
    );
  }

  const activeCount = await prisma.otpCode.count({
    where: {
      email: normalizedEmail,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (activeCount >= OTP_MAX_ACTIVE) {
    throw new OtpRateLimitError(
      "Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau ít phút.",
    );
  }

  // Only the newest code should ever be redeemable — invalidate prior active
  // codes before creating the new one. This is also exactly the "resend"
  // behavior: resend is just another call to issueOtp.
  await prisma.otpCode.updateMany({
    where: { email: normalizedEmail, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpCode.create({
    data: {
      email: normalizedEmail,
      codeHash: hashOtpCode(code),
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export type RegisterOtpResult =
  | { status: "already_verified" }
  | { status: "issued"; code: string; expiresAt: Date };

/**
 * Registration entry point (spec: "email đã đăng ký → không tạo trùng;
 * hướng dẫn về trang đăng nhập"). If a verified User already exists for
 * `email`, no OTP is issued and no duplicate row is created. Otherwise a
 * User row is created (if missing) with `emailVerified: false` and a fresh
 * OTP is issued for it.
 */
export async function registerAndIssueOtp(
  prisma: PrismaClient,
  email: string,
): Promise<RegisterOtpResult> {
  const normalizedEmail = normalizeEmail(email);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing?.emailVerified) {
    return { status: "already_verified" };
  }
  if (!existing) {
    await prisma.user.create({
      data: { email: normalizedEmail, emailVerified: false },
    });
  }

  const { code, expiresAt } = await issueOtp(prisma, normalizedEmail);
  return { status: "issued", code, expiresAt };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Verify a submitted code for `email`. A match consumes the code (single-use)
 * and returns `{ ok: true }`. No match among still-unconsumed codes for that
 * email → "invalid"; a match that has since expired → "expired" (still
 * consumed, so it cannot be retried once flagged expired).
 */
export async function verifyOtp(
  prisma: PrismaClient,
  email: string,
  code: string,
): Promise<VerifyOtpResult> {
  const normalizedEmail = normalizeEmail(email);
  const codeHash = hashOtpCode(code.trim());

  const match = await prisma.otpCode.findFirst({
    where: { email: normalizedEmail, codeHash, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!match) {
    return { ok: false, reason: "invalid" };
  }

  if (match.expiresAt.getTime() < Date.now()) {
    await prisma.otpCode.update({
      where: { id: match.id },
      data: { consumedAt: new Date() },
    });
    return { ok: false, reason: "expired" };
  }

  await prisma.otpCode.update({
    where: { id: match.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}
