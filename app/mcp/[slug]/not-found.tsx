import Link from "next/link";

// Custom not-found UI for `/mcp/:slug` (spec AC: hidden or unknown slug →
// "Năng lực không tồn tại hoặc chưa mở"). Rendered automatically by Next.js
// whenever `notFound()` is called from this route segment's page.
export default function McpDetailNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="mx-auto w-full max-w-xl text-center">
        <span className="inline-flex items-center rounded-full bg-error-light px-4 py-1.5 text-sm font-medium text-error-dark">
          Không tìm thấy
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Năng lực không tồn tại hoặc chưa mở
        </h1>
        <p className="mt-4 text-base text-foreground/70">
          Đường dẫn này không khớp một năng lực đang mở — có thể đã bị Admin
          ẩn hoặc chưa từng tồn tại.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/mcp"
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            Khám phá năng lực khác
          </Link>
        </div>
      </div>
    </div>
  );
}
