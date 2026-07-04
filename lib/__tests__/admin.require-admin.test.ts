import { describe, expect, it } from "vitest";
import { requireAdmin } from "@/components/admin/require-admin";
import type { SessionPayload } from "@/lib/auth";

const EXP = Math.floor(Date.now() / 1000) + 3600;

describe("requireAdmin", () => {
  it("returns false for a null session (logged out)", () => {
    expect(requireAdmin(null)).toBe(false);
  });

  it("returns false for an undefined session", () => {
    expect(requireAdmin(undefined)).toBe(false);
  });

  it("returns false for a logged-in, non-admin session", () => {
    const session: SessionPayload = { email: "user@example.com", isAdmin: false, exp: EXP };
    expect(requireAdmin(session)).toBe(false);
  });

  it("returns true for a logged-in admin session", () => {
    const session: SessionPayload = { email: "admin@tlac.dev", isAdmin: true, exp: EXP };
    expect(requireAdmin(session)).toBe(true);
  });
});
