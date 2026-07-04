import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TLAC Open Platform",
  description:
    "Danh mục năng lực MCP & Skill nội bộ TLAC — khám phá, kết nối và tích hợp.",
};

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/mcp", label: "MCP" },
  { href: "/skills", label: "Skills" },
  { href: "/docs", label: "Docs" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <header className="border-b border-primary-100">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="shrink-0 text-lg font-semibold text-primary-600"
            >
              TLAC Open Platform
            </Link>
            <nav
              aria-label="Điều hướng chính"
              className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-foreground/80 sm:justify-end"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-1 py-1 transition-colors hover:text-primary-600"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="rounded-full bg-primary-500 px-4 py-1.5 text-white transition-colors hover:bg-primary-600"
              >
                Đăng nhập
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="border-t border-primary-100">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-foreground/60 sm:px-6">
            <p>
              &copy; {new Date().getFullYear()} TLAC Open Platform. Nội bộ
              MoMo.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
