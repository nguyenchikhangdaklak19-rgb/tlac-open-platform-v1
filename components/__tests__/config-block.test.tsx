import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfigBlock } from "../config-block";

describe("ConfigBlock", () => {
  it("shows a locked CTA and never leaks the config snippet when logged out", () => {
    const html = renderToStaticMarkup(
      <ConfigBlock configSnippet="super-secret-config-value" isLoggedIn={false} />,
    );
    expect(html).toContain("Đăng nhập để lấy cấu hình");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("super-secret-config-value");
  });

  it("shows the real config snippet and a copy control when logged in", () => {
    const html = renderToStaticMarkup(
      <ConfigBlock configSnippet="super-secret-config-value" isLoggedIn={true} />,
    );
    expect(html).toContain("super-secret-config-value");
    expect(html).not.toContain("Đăng nhập để lấy cấu hình");
    expect(html).toContain("Sao chép");
  });

  it("escapes HTML in the admin-authored snippet — no XSS via DB content", () => {
    const html = renderToStaticMarkup(
      <ConfigBlock
        configSnippet={'<img src=x onerror="alert(1)">'}
        isLoggedIn={true}
      />,
    );
    // React must render the snippet as inert text, never as a live tag.
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;img");
  });
});
