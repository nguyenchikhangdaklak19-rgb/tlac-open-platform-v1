import Link from "next/link";
import type { Metadata } from "next";

// Public "coming soon" placeholder for Skills (spec Module F).
//
// v1 rule: this page is 100% static — it never queries the database and
// never reflects any admin-created Skill entries from the CMS. Even if an
// admin has drafted (but not published) a Skill in the admin CMS, the public
// route always renders "Sắp ra mắt" regardless. Keeping this component free
// of data fetching is what guarantees that invariant, so do not wire this up
// to any data source.
export const metadata: Metadata = {
  title: "Skills — Sắp ra mắt | TLAC Open Platform",
  description:
    "Skills của TLAC đang được chuẩn bị. Trong lúc chờ, khám phá các năng lực MCP đã sẵn sàng kết nối.",
};

export default function SkillsPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-600">
          Sắp ra mắt
        </span>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Skills đang được chuẩn bị
        </h1>

        <p className="mt-4 text-base text-foreground/70 sm:text-lg">
          Đội ngũ TLAC đang hoàn thiện các Skill để bạn có thể tích hợp trực
          tiếp vào agent của mình. Trang này sẽ mở khi Skill đầu tiên sẵn sàng
          công bố — hiện tại chưa có nội dung nào được publish.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
    </div>
  );
}
