import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DocsPage from "@/app/docs/page";

const pageSource = readFileSync(
  fileURLToPath(new URL("../page.tsx", import.meta.url)),
  "utf8",
);

describe("DocsPage", () => {
  const html = renderToStaticMarkup(<DocsPage />);

  it("renders the quickstart heading", () => {
    expect(html).toContain("Cách kết nối 3 bước");
  });

  it("renders all 3 steps in Vietnamese", () => {
    expect(html).toContain("Đăng ký tài khoản");
    expect(html).toContain("Đăng nhập để lấy config kết nối");
    expect(html).toContain("Dán config vào MCP client của bạn");
  });

  it("links to /register and /mcp", () => {
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="/mcp"');
  });

  it("uses a neutral placeholder instead of a fabricated real endpoint", () => {
    expect(html).toContain(
      "&lt;endpoint do TLAC cung cấp sau khi đăng nhập&gt;",
    );
    // Anti-fabrication guard: no concrete protocol/host should ever be
    // hard-coded here — the real endpoint only appears after login on the
    // capability detail pages.
    expect(html).not.toMatch(/https?:\/\/(?!.*<)/);
  });

  it("hard-codes no fabricated endpoint/tool identifiers in the source", () => {
    // Source-level anti-fabrication guard: no real URL and no likely
    // fabricated tool/endpoint names. The only "url" allowed is the
    // placeholder value inside angle brackets.
    expect(pageSource).not.toMatch(/https?:\/\//);
    expect(pageSource).not.toMatch(/\.momo\.vn/i);
    expect(pageSource).not.toMatch(/\bapi\.tlac\b/i);
    // The angle-bracket placeholder is the single sanctioned stand-in.
    expect(pageSource).toContain("<endpoint do TLAC cung cấp sau khi đăng nhập>");
  });

  it("uses no ALL-CAPS button/link labels", () => {
    // Verb-first, sentence-case per DS. Inspect only anchor (CTA) text so we
    // don't flag sanctioned brand acronyms (TLAC, MCP) that appear in body
    // copy. A CTA label rendered in ALL-CAPS is a DS violation.
    const linkTexts = Array.from(
      html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g),
    ).map(([, inner]) => inner.replace(/<[^>]+>/g, " ").trim());
    expect(linkTexts.length).toBeGreaterThan(0);
    for (const label of linkTexts) {
      // Strip allowed acronyms, then assert no remaining 4+ letter caps word.
      const stripped = label.replace(/\b(TLAC|MCP)\b/g, " ");
      expect(stripped).not.toMatch(/\b[A-Z]{4,}\b/);
    }
  });
});
