import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { primary, status, radius, fontSans } from "@/lib/design-tokens";

// Guard against the two sources of truth drifting apart: the CSS-first Tailwind
// theme in app/globals.css and the TS token module in lib/design-tokens.ts must
// declare identical values. If either changes, this test must be updated too.
const css = readFileSync(
  path.resolve(__dirname, "../../app/globals.css"),
  "utf8",
);

function cssVar(name: string): string | undefined {
  // First (concrete) declaration in :root wins for our purposes; the @theme
  // inline block only re-exposes the same custom properties.
  const match = css.match(
    new RegExp(`--${name}:\\s*([^;]+);`),
  );
  return match?.[1].trim();
}

describe("token consistency: globals.css <-> design-tokens.ts", () => {
  it("primary scale matches in both sources", () => {
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const) {
      expect(cssVar(`color-primary-${step}`)).toBe(primary[step]);
    }
  });

  it("brand base #eb2f96 is the primary-500 value in the CSS theme", () => {
    expect(cssVar("color-primary-500")).toBe("#eb2f96");
  });

  it("status tokens match in both sources", () => {
    for (const key of ["success", "error", "warning", "info"] as const) {
      expect(cssVar(`color-${key}`)).toBe(status[key].base);
      expect(cssVar(`color-${key}-light`)).toBe(status[key].light);
      expect(cssVar(`color-${key}-dark`)).toBe(status[key].dark);
    }
  });

  it("radius scale matches in both sources", () => {
    for (const key of ["sm", "md", "lg", "xl", "full"] as const) {
      expect(cssVar(`radius-${key}`)).toBe(radius[key]);
    }
  });

  it("font stack matches in both sources", () => {
    // CSS declares the stack across two physical lines; normalize whitespace.
    const cssFont = cssVar("font-sans-momo")?.replace(/\s+/g, " ");
    expect(cssFont).toBe(fontSans.replace(/\s+/g, " "));
  });
});
