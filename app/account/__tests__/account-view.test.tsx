import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccountView, type AccountCapability } from "../account-view";

const fakeCapabilities: AccountCapability[] = [
  {
    slug: "dat-ve-may-bay",
    name: "Đặt vé máy bay",
    vertical: "TRAVEL",
    configSnippet: "mcpServers.tlac.url = https://fake.example/mcp",
  },
  {
    slug: "order-highlands",
    name: "Order Highlands",
    vertical: "FNB",
    configSnippet: "mcpServers.tlac.url = https://fake.example/fnb",
  },
];

describe("AccountView", () => {
  const html = renderToStaticMarkup(
    <AccountView email="dev@vidu.com" capabilities={fakeCapabilities} />,
  );

  it("greets the logged-in user by email", () => {
    expect(html).toContain("Xin chào, dev@vidu.com");
  });

  it("gathers connection info for every visible capability in one place", () => {
    expect(html).toContain("Thông tin kết nối");
    for (const capability of fakeCapabilities) {
      expect(html).toContain(capability.name);
      expect(html).toContain(capability.configSnippet);
      expect(html).toContain(`href="/mcp/${capability.slug}"`);
    }
  });

  it("shows the config unlocked (copy control, not the login CTA)", () => {
    expect(html).toContain("Sao chép");
    expect(html).not.toContain("Đăng nhập để lấy cấu hình");
  });

  it("renders a fallback when there are no visible capabilities", () => {
    const emptyHtml = renderToStaticMarkup(
      <AccountView email="dev@vidu.com" capabilities={[]} />,
    );
    expect(emptyHtml).toContain("chưa có năng lực nào");
  });

  it("shows the 3-step guide with a link to /docs", () => {
    expect(html).toContain("Cách kết nối 3 bước");
    expect(html).toContain('href="/docs"');
  });

  it('marks the API key section as "Sắp có", with no create/revoke action', () => {
    expect(html).toContain("API key");
    expect(html).toContain("Sắp có");
    expect(html).not.toMatch(/tạo (mới )?api key|thu hồi/i);
  });

  it("links to /support to request help", () => {
    expect(html).toContain('href="/support"');
    expect(html).toContain("Yêu cầu hỗ trợ");
  });

  it("renders a logout control with a verb-first, non-ALL-CAPS label", () => {
    expect(html).toContain("Đăng xuất");
    expect(html).not.toMatch(/\bĐĂNG XUẤT\b/);
  });

  it("uses no ALL-CAPS button/link labels", () => {
    const labels = [
      ...Array.from(html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)),
      ...Array.from(html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)),
    ].map(([, inner]) => inner.replace(/<[^>]+>/g, " ").trim());
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      const stripped = label.replace(/\b(TLAC|MCP|API)\b/g, " ");
      expect(stripped).not.toMatch(/\b[A-Z]{4,}\b/);
    }
  });

  it("escapes HTML in admin-authored capability content — no XSS via DB content", () => {
    const maliciousHtml = renderToStaticMarkup(
      <AccountView
        email="dev@vidu.com"
        capabilities={[
          {
            slug: "xss",
            name: '<img src=x onerror="alert(1)">',
            vertical: "TRAVEL",
            configSnippet: "irrelevant",
          },
        ]}
      />,
    );
    expect(maliciousHtml).not.toContain('<img src=x onerror="alert(1)">');
    expect(maliciousHtml).toContain("&lt;img");
  });
});
