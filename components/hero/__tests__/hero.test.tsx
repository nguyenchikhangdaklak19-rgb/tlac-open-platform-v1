import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "../hero";

describe("Hero", () => {
  const html = renderToStaticMarkup(<Hero />);

  it("renders the MCP badge and headline", () => {
    expect(html).toContain("MCP · Model Context Protocol");
    expect(html).toContain("Trợ Lý Ăn Chơi");
  });

  it("stays within the 6 real v1 capabilities in its subcopy (anti-fabrication)", () => {
    expect(html).toContain("máy bay");
    expect(html).toContain("tàu");
    expect(html).toContain("xe khách");
    expect(html).toContain("vé phim");
    expect(html).toContain("Highlands");
    expect(html).toContain("voucher");
  });

  it("renders the primary pink CTA with the exact label/href e2e asserts on", () => {
    // e2e/g-responsive.spec.ts looks up this link by accessible name and
    // asserts its computed background-color is MoMo pink rgb(235, 47, 150),
    // i.e. the `bg-primary-500` utility. Keep label/class/href in lockstep.
    expect(html).toMatch(
      /<a class="[^"]*bg-primary-500[^"]*" href="\/mcp">Khám phá năng lực MCP<\/a>/,
    );
  });

  it("renders a secondary outline CTA linking to /docs", () => {
    expect(html).toMatch(/<a class="[^"]*" href="\/docs">Xem tài liệu<\/a>/);
  });

  it("renders the 4 capability nodes in the illustration", () => {
    for (const label of ["Travel", "Phim", "F&amp;B", "Voucher"]) {
      expect(html).toContain(label);
    }
  });

  it("renders the mascot image via next/image from the public asset", () => {
    expect(html).toContain("tlac-icon.png");
  });

  it("renders the 4-item feature strip with spec-true claims", () => {
    expect(html).toContain("Một endpoint MCP duy nhất");
    expect(html).toContain("4 vertical năng lực");
    expect(html).toContain("Copy config là chạy");
    expect(html).toContain("Đăng ký email miễn phí");
  });

  it("uses no ALL-CAPS button/link labels", () => {
    const linkTexts = Array.from(
      html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g),
    ).map(([, inner]) => inner.replace(/<[^>]+>/g, " ").trim());
    expect(linkTexts.length).toBeGreaterThan(0);
    for (const label of linkTexts) {
      const stripped = label.replace(/\b(TLAC|MCP)\b/g, " ");
      expect(stripped).not.toMatch(/\b[A-Z]{4,}\b/);
    }
  });
});
