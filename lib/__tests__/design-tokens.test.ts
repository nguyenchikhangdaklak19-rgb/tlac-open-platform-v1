import { describe, expect, it } from "vitest";
import designTokens, {
  primary,
  status,
  radius,
  fontSans,
} from "@/lib/design-tokens";

describe("design tokens", () => {
  it("exposes the MoMo brand primary color at the 500 step", () => {
    expect(primary[500]).toBe("#eb2f96");
  });

  it("exposes a full primary scale from 50 to 900", () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
    for (const step of steps) {
      expect(primary[step]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("exposes success/error/warning/info status tokens with base colors", () => {
    for (const key of ["success", "error", "warning", "info"] as const) {
      expect(status[key].base).toMatch(/^#[0-9a-f]{6}$/i);
      expect(status[key].light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(status[key].dark).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("exposes a border radius scale", () => {
    expect(radius).toMatchObject({
      sm: expect.any(String),
      md: expect.any(String),
      lg: expect.any(String),
      xl: expect.any(String),
      full: "9999px",
    });
  });

  it("uses the SF Pro system font stack", () => {
    expect(fontSans).toContain("-apple-system");
    expect(fontSans).toContain("SF Pro Text");
  });

  it("bundles everything under the default export", () => {
    expect(designTokens.color.primary).toBe(primary);
    expect(designTokens.color.status).toBe(status);
    expect(designTokens.radius).toBe(radius);
    expect(designTokens.font.sans).toBe(fontSans);
  });
});
