/**
 * Rendered by `app/admin/**` pages when a valid (logged-in) session lacks
 * `isAdmin` — the in-page half of the "defense in depth" gate described in
 * `require-admin.ts`. In normal operation `middleware.ts` already stops a
 * non-admin before any admin page renders; this only fires if this page is
 * ever reached some other way.
 */
export default function Forbidden() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <span className="inline-flex items-center rounded-full bg-error-light px-4 py-1.5 text-sm font-medium text-error-dark">
        403 — Không có quyền
      </span>
      <h1 className="mt-6 text-2xl font-semibold text-foreground sm:text-3xl">
        Bạn không có quyền truy cập trang này
      </h1>
      <p className="mt-4 text-sm text-foreground/70">
        Trang quản trị chỉ dành cho tài khoản admin của TLAC. Nếu bạn cho rằng đây là
        nhầm lẫn, hãy liên hệ đội TLAC.
      </p>
    </div>
  );
}
