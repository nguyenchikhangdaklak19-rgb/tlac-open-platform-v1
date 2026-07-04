import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "../hero";
import { HeroIllustration } from "../hero-illustration";
import { FeatureStrip } from "../feature-strip";

// Reviewer edge-case coverage (test files only): structural invariants of the
// self-built illustration and anti-fabrication guards on the hero markup.
describe("Hero (edge cases)", () => {
  const heroHtml = renderToStaticMarkup(<Hero />);
  const illustrationHtml = renderToStaticMarkup(<HeroIllustration />);
  const stripHtml = renderToStaticMarkup(<FeatureStrip />);

  it("ships no external/remote image or the Luckin reference screenshot", () => {
    // The Luckin screenshot (app/luckincofffee.png) must never be referenced or
    // shipped, and the hero must inline only the local mascot asset.
    expect(heroHtml.toLowerCase()).not.toContain("luckin");
    expect(heroHtml).not.toMatch(/src="https?:\/\//);
  });

  it("draws exactly 4 connecting lines and 4 capability nodes", () => {
    const lines = illustrationHtml.match(/<line\b/g) ?? [];
    expect(lines).toHaveLength(4);
    for (const label of ["Travel", "Phim", "F&amp;B", "Voucher"]) {
      expect(illustrationHtml).toContain(label);
    }
  });

  it("renders the mascot from the public path (not a static import URL)", () => {
    // next/image on a public asset resolves to /_next/image?url=%2Ftlac-icon.png;
    // a broken static-import config would instead emit a hashed /_next/static path.
    expect(illustrationHtml).toContain("tlac-icon.png");
    expect(illustrationHtml).toContain('alt="Trợ Lý Ăn Chơi"');
  });

  it("respects reduced motion (animation gated behind no-preference)", () => {
    expect(illustrationHtml).toContain(
      "prefers-reduced-motion: no-preference",
    );
  });

  it("renders exactly 4 feature-strip items", () => {
    const items = stripHtml.match(/<li\b/g) ?? [];
    expect(items).toHaveLength(4);
  });

  it("keeps capability node glyphs decorative (aria-hidden)", () => {
    // Emoji glyphs must not be announced as content to screen readers.
    expect(illustrationHtml).toMatch(/aria-hidden="true">✈️|aria-hidden="true">🎬/);
  });
});
