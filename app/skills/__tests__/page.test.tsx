import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SkillsPage from "@/app/skills/page";

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
});
