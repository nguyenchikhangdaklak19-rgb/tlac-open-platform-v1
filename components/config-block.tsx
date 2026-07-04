import Link from "next/link";
import { CopyButton } from "./catalog/copy-button";

/**
 * Connection config block (spec section C). Locked/unlocked is decided by
 * the caller (a Server Component reading `getSession()` from `lib/auth.ts`)
 * and passed in as `isLoggedIn` — this component itself does no auth.
 */
export type ConfigBlockProps = {
  configSnippet: string;
  isLoggedIn: boolean;
};

export function ConfigBlock({ configSnippet, isLoggedIn }: ConfigBlockProps) {
  if (!isLoggedIn) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-primary-100 bg-white p-6">
        <div aria-hidden="true" className="pointer-events-none select-none blur-sm">
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-foreground/5 p-4 text-xs text-foreground/60 sm:text-sm">
            {`{\n  "mcpServers": {\n    "tlac": { "url": "..." }\n  }\n}`}
          </pre>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 px-4 text-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-8 w-8 text-primary-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-12v-1a4 4 0 10-8 0v1"
            />
          </svg>
          <p className="text-sm font-medium text-foreground/70">
            Đăng nhập để xem endpoint và config kết nối đầy đủ.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            Đăng nhập để lấy cấu hình
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-100 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Config kết nối</h3>
        <CopyButton text={configSnippet} />
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-foreground/5 p-4 text-xs text-foreground/80 sm:text-sm">
        {configSnippet}
      </pre>
    </div>
  );
}
