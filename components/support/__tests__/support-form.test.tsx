import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupportForm from "@/components/support/support-form";

const capabilities = [
  { slug: "dat-ve-may-bay", name: "Đặt vé máy bay" },
  { slug: "order-highlands", name: "Order Highlands" },
];

describe("SupportForm", () => {
  it("renders all required fields: capability, error type, description, contact email", () => {
    const html = renderToStaticMarkup(
      <SupportForm capabilities={capabilities} defaultEmail="dev@vidu.com" />,
    );

    expect(html).toContain('id="capability"');
    expect(html).toContain('id="errorType"');
    expect(html).toContain('id="description"');
    expect(html).toContain('id="contactEmail"');

    expect(html).toContain("Năng lực liên quan");
    expect(html).toContain("Loại lỗi");
    expect(html).toContain("Mô tả");
    expect(html).toContain("Email liên hệ");
  });

  it("renders all four error type options in Vietnamese", () => {
    const html = renderToStaticMarkup(
      <SupportForm capabilities={capabilities} defaultEmail="dev@vidu.com" />,
    );

    expect(html).toContain("Không kết nối được");
    expect(html).toContain("Lỗi khi gọi tool");
    expect(html).toContain("Sai nội dung/tài liệu");
    expect(html).toContain("Khác");
  });

  it("renders every capability option passed in", () => {
    const html = renderToStaticMarkup(
      <SupportForm capabilities={capabilities} defaultEmail="dev@vidu.com" />,
    );

    expect(html).toContain("Đặt vé máy bay");
    expect(html).toContain("Order Highlands");
  });

  it("prefills the contact email from the session", () => {
    const html = renderToStaticMarkup(
      <SupportForm capabilities={capabilities} defaultEmail="dev@vidu.com" />,
    );

    expect(html).toContain('value="dev@vidu.com"');
  });

  it("preselects the capability given by ?capability=<slug>", () => {
    const html = renderToStaticMarkup(
      <SupportForm
        capabilities={capabilities}
        defaultEmail="dev@vidu.com"
        defaultCapabilitySlug="order-highlands"
      />,
    );

    // renderToStaticMarkup renders the matching <option> with `selected`.
    expect(html).toMatch(/<option value="order-highlands" selected(="")?>/);
  });

  it("submit button is verb-first and not ALL-CAPS", () => {
    const html = renderToStaticMarkup(
      <SupportForm capabilities={capabilities} defaultEmail="dev@vidu.com" />,
    );

    expect(html).toContain("Gửi yêu cầu hỗ trợ");
    expect(html).not.toMatch(/GỬI YÊU CẦU/);
  });
});
