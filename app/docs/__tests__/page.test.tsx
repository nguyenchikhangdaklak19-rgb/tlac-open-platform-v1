import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DocsPage from "@/app/docs/page";

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
});
