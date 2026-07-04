/**
 * Known-OTP insertion helper (task T09, spec section B).
 *
 * `OtpCode.codeHash` is a SHA-256 hash — the app never stores or exposes the
 * plaintext code (see `lib/otp.ts`), and the dev-mode `[DEV] OTP for ...`
 * log line goes to the `webServer` subprocess's stdout, which Playwright
 * tests don't read. To exercise the *real* verify UI end-to-end with a code
 * we know in advance, we insert an `OtpCode` row directly (raw SQLite, see
 * `e2e/helpers/db.ts` for why — not the generated Prisma Client), hashed
 * with the exact same `hashOtpCode` the app uses, then type that known code
 * into the `/verify` form.
 *
 * Mirrors `issueOtp`'s "only the newest code is redeemable" invariant by
 * consuming any still-active codes for the email first, so this never
 * leaves two valid codes around.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";
import { hashOtpCode } from "../../lib/otp";

function openDb(): Database.Database {
  return new Database(path.resolve(process.cwd(), "e2e.db"));
}

export async function insertKnownOtp(
  email: string,
  code: string,
  options?: { expired?: boolean },
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = openDb();
  try {
    const now = Date.now();
    db.prepare(
      "UPDATE OtpCode SET consumedAt = ? WHERE email = ? AND consumedAt IS NULL",
    ).run(new Date(now).toISOString(), normalizedEmail);

    const expiresAt = new Date(options?.expired ? now - 60_000 : now + 10 * 60_000);
    db.prepare(
      "INSERT INTO OtpCode (id, email, codeHash, expiresAt, consumedAt, createdAt) VALUES (?, ?, ?, ?, NULL, ?)",
    ).run(
      randomUUID(),
      normalizedEmail,
      hashOtpCode(code),
      expiresAt.toISOString(),
      new Date(now).toISOString(),
    );
  } finally {
    db.close();
  }
}
