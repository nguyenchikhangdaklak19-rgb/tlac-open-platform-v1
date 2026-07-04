import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SkillsPage from "@/app/skills/page";

const pageSource = readFileSync(
  fileURLToPath(new URL("../page.tsx", import.meta.url)),
  "utf8",
);

describe("SkillsPage", () => {
  const html = renderToStaticMarkup(<SkillsPage />);

  it("renders the Vietnamese 'coming soon' heading", () => {
    expect(html).toContain("Sắp ra mắt");
    expect(html).toContain("Skills đang được chuẩn bị");
  });

  it("does not render any capability/skill data, only the static placeholder", () => {
    // Guard against future regressions where someone wires this page up to
    // a CMS data source — v1 must always show "Sắp ra mắt" regardless of
    // unpublished admin-created Skill entries.
    expect(html).not.toContain("prisma");
    expect(html).not.toMatch(/vertical/i);
  });

  it("links to the /mcp catalog as the CTA", () => {
    expect(html).toContain('href="/mcp"');
    expect(html).toContain("Khám phá năng lực MCP");
  });

  it("links to /docs for the connection quickstart", () => {
    expect(html).toContain('href="/docs"');
  });

  it("never fetches data — the placeholder must stay 100% static", () => {
    // Source-level guard: the invariant is that this page cannot leak an
    // unpublished admin-created Skill because it has no data source at all.
    // Markup checks can miss this if a fetch resolves to nothing, so assert
    // against the source itself.
    expect(pageSource).not.toMatch(/prisma/i);
    expect(pageSource).not.toMatch(/\bfetch\s*\(/);
    expect(pageSource).not.toMatch(/\basync\b/);
    expect(pageSource).not.toMatch(/\bawait\b/);
    expect(pageSource).not.toMatch(/from\s+["']@\/lib/);
  });

  it("renders no fabricated endpoint URL", () => {
    expect(html).not.toMatch(/https?:\/\//);
  });
});
