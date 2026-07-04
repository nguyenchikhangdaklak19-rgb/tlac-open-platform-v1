import Link from "next/link";
import type { Metadata } from "next";

// Public quickstart docs (spec Module A/C, "Cách kết nối 3 bước").
//
// Anti-fabrication: this page must not hard-code any real endpoint URL, tool
// name, or schema — those come from Eng/BU through the Admin CMS on the
// `/mcp/:slug` detail pages, not here. Where an example config would go, show
// a neutral placeholder that makes clear the real value only appears after
// login.
export const metadata: Metadata = {
  title: "Docs — Cách kết nối | TLAC Open Platform",
  description:
    "Hướng dẫn nhanh 3 bước để kết nối MCP client của bạn với TLAC Open Platform.",
};

const steps = [
  {
    title: "Đăng ký tài khoản",
    description:
      "Tạo tài khoản bằng email tại trang đăng ký. Bạn cần xác thực email trước khi đăng nhập.",
    cta: { href: "/register", label: "Đăng ký tài khoản" },
  },
  {
    title: "Đăng nhập để lấy config kết nối",
    description:
      "Sau khi đăng nhập, vào trang chi tiết một năng lực hoặc trang tài khoản để xem endpoint và config kết nối dành cho bạn.",
    cta: { href: "/mcp", label: "Xem danh sách năng lực" },
  },
  {
    title: "Dán config vào MCP client của bạn",
    description:
      "Copy config kết nối và dán vào MCP client bạn đang dùng (Claude, Cursor, hoặc agent tự xây) để bắt đầu gọi năng lực TLAC.",
  },
] as const;

export default function DocsPage() {
  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Cách kết nối 3 bước
          </h1>
          <p className="mt-4 text-base text-foreground/70 sm:text-lg">
            Kết nối MCP client của bạn với TLAC Open Platform chỉ mất 3 bước
            đơn giản.
          </p>
        </div>

        <ol className="mt-12 flex flex-col gap-6">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-primary-100 bg-white p-5 sm:gap-5 sm:p-6"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h2>
                <p className="mt-1 text-sm text-foreground/70 sm:text-base">
                  {step.description}
                </p>
                {"cta" in step && step.cta ? (
                  <Link
                    href={step.cta.href}
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {step.cta.label} →
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-xl border border-primary-100 bg-primary-50/40 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Ví dụ cấu trúc config
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Nội dung thật (endpoint, tên năng lực, schema) chỉ hiện ra sau khi
            bạn đăng nhập, ở trang chi tiết từng năng lực. Ví dụ dưới đây chỉ
            minh hoạ hình dạng, không phải giá trị thật:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-foreground/5 p-4 text-xs text-foreground/80 sm:text-sm">
            <code>{`{
  "mcpServers": {
    "tlac": {
      "url": "<endpoint do TLAC cung cấp sau khi đăng nhập>"
    }
  }
}`}</code>
          </pre>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            Đăng ký tài khoản
          </Link>
          <Link
            href="/mcp"
            className="inline-flex items-center justify-center rounded-full border border-primary-200 px-6 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            Khám phá năng lực MCP
          </Link>
        </div>
      </div>
    </div>
  );
}
