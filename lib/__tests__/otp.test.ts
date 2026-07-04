import { describe, expect, it } from "vitest";
import {
  generateOtpCode,
  hashOtpCode,
  OTP_LENGTH,
} from "@/lib/otp";

describe("generateOtpCode", () => {
  it("returns a zero-padded 6-digit numeric string", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toHaveLength(OTP_LENGTH);
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("produces varied output (not a constant code)", () => {
    const codes = new Set(Array.from({ length: 30 }, () => generateOtpCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("hashOtpCode", () => {
  it("is deterministic for the same input", () => {
    expect(hashOtpCode("123456")).toBe(hashOtpCode("123456"));
  });

  it("produces different hashes for different codes", () => {
    expect(hashOtpCode("123456")).not.toBe(hashOtpCode("654321"));
  });

  it("never stores/returns the raw code — output is a 64-char hex sha256 digest", () => {
    const hash = hashOtpCode("000000");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("000000");
  });
});
