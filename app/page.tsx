import Link from "next/link";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { CapabilityList } from "@/components/catalog/capability-list";

// Landing page (spec section A, IA: `/` — hero + 6 capability card + "Cách
// kết nối 3 bước"). Reads the live catalog from the DB, so this can never be
// statically prerendered with stale data at build time — force dynamic
// rendering (see also app/mcp/page.tsx and app/mcp/[slug]/page.tsx).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TLAC Open Platform",
  description:
    "BYOA — kết nối agent của bạn vào MCP server TLAC: đặt vé máy bay, tàu, xe khách, vé phim, order Highlands, tìm voucher.",
};

const CONNECT_STEPS = [
  {
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản bằng email để bắt đầu tìm hiểu các năng lực TLAC.",
  },
  {
    title: "Đăng nhập lấy config",
    description:
      "Đăng nhập rồi mở một năng lực bất kỳ để lấy endpoint và config kết nối dành cho bạn.",
  },
  {
    title: "Dán vào MCP client",
    description:
      "Dán config vào MCP client bạn đang dùng (Claude, Cursor, hoặc agent tự xây) và bắt đầu gọi năng lực TLAC.",
  },
] as const;

export default async function Home() {
  // Anti-fabrication: only real, admin-published rows are rendered — no
  // invented capability, stat, or schema content (spec "Anti-fabrication").
  const capabilities = await prisma.capability.findMany({
    where: { type: "MCP", status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-primary-100 bg-primary-50/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
            BYOA — Bring Your Own Agent
          </span>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Kết nối agent của bạn vào MCP server TLAC
          </h1>
          <p className="max-w-2xl text-base text-foreground/70 sm:text-lg">
            TLAC Open Platform là nơi bạn tự tìm hiểu các năng lực MCP của Trợ
            Lý Ăn Chơi (TLAC) và tự lấy cấu hình để cắm vào MCP client của
            mình.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/mcp"
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              Khám phá năng lực MCP
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-full border border-primary-200 px-6 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
            >
              Xem hướng dẫn kết nối
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Năng lực đang mở
            </h2>
            <p className="mt-2 text-sm text-foreground/70 sm:text-base">
              Các năng lực MCP TLAC theo 4 nhóm: Travel, Phim, F&amp;B,
              Promotion.
            </p>
          </div>
          <Link
            href="/mcp"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-8">
          <CapabilityList
            capabilities={capabilities.map((capability) => ({
              name: capability.name,
              slug: capability.slug,
              vertical: capability.vertical,
              shortDesc: capability.shortDesc,
            }))}
            emptyMessage="Chưa có năng lực nào được publish."
          />
        </div>
      </section>

      <section className="border-t border-primary-100 bg-primary-50/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Cách kết nối 3 bước
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {CONNECT_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-primary-100 bg-white p-5 sm:p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-foreground/70">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              Xem hướng dẫn chi tiết
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
