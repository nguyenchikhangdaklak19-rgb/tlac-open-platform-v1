import Link from "next/link";
import { VERTICAL_LABELS, type Vertical } from "@/components/catalog/filter";
import { ConfigBlock } from "@/components/config-block";
import { LogoutButton } from "./logout-button";

/**
 * Presentational body of `/account` (spec section C — "Kết nối"). Pulled out
 * of `page.tsx` so it can be unit-tested with fake data via
 * `renderToStaticMarkup`, without touching Prisma or `next/headers`.
 */
export type AccountCapability = {
  slug: string;
  name: string;
  vertical: Vertical;
  configSnippet: string;
};

export type AccountViewProps = {
  email: string;
  capabilities: AccountCapability[];
};

export function AccountView({ email, capabilities }: AccountViewProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Xin chào, {email}
          </h1>
          <p className="mt-2 text-sm text-foreground/70">
            Toàn bộ thông tin kết nối và hỗ trợ cho tài khoản của bạn ở một
            nơi.
          </p>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Thông tin kết nối
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          Endpoint và config kết nối của tất cả năng lực đang mở — không cần
          mở từng trang để tìm.
        </p>

        {capabilities.length === 0 ? (
          <p className="mt-4 rounded-xl border border-primary-100 bg-white p-6 text-sm text-foreground/60">
            Hiện chưa có năng lực nào được mở kết nối. Ghé lại sau khi TLAC
            công bố năng lực mới.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-6">
            {capabilities.map((capability) => (
              <li
                key={capability.slug}
                className="rounded-xl border border-primary-100 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                      {VERTICAL_LABELS[capability.vertical]}
                    </span>
                    <h3 className="text-base font-semibold text-foreground">
                      {capability.name}
                    </h3>
                  </div>
                  <Link
                    href={`/mcp/${capability.slug}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Xem tài liệu chi tiết →
                  </Link>
                </div>
                <div className="mt-4">
                  <ConfigBlock
                    configSnippet={capability.configSnippet}
                    isLoggedIn
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-primary-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Cách kết nối 3 bước
        </h2>
        <ol className="mt-3 flex flex-col gap-2 text-sm text-foreground/80">
          <li>1. Copy config kết nối của năng lực bạn cần ở phía trên.</li>
          <li>2. Dán config vào MCP client bạn đang dùng.</li>
          <li>3. Gọi thử một tool để xác nhận đã kết nối thành công.</li>
        </ol>
        <Link
          href="/docs"
          className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Xem hướng dẫn kết nối đầy đủ →
        </Link>
      </section>

      <section className="mt-10 rounded-xl border border-primary-100 bg-primary-50/40 p-6">
        <h2 className="text-sm font-semibold text-foreground">API key</h2>
        <p className="mt-1 text-sm text-foreground/70">
          Sắp có — v1 chưa cấp API key riêng cho từng tài khoản, dùng config
          kết nối chung ở mục &quot;Thông tin kết nối&quot; phía trên.
        </p>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary-100 bg-white p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">
            Cần hỗ trợ?
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Gặp lỗi khi kết nối hoặc sử dụng năng lực? Gửi yêu cầu, team sẽ
            liên hệ qua email.
          </p>
        </div>
        <Link
          href="/support"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          Yêu cầu hỗ trợ
        </Link>
      </section>
    </div>
  );
}
