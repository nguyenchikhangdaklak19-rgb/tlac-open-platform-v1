import Link from "next/link";
import { VERTICAL_LABELS, type Vertical } from "./filter";

export type CapabilityCardProps = {
  name: string;
  slug: string;
  vertical: Vertical;
  shortDesc: string;
  /** Only passed on `/mcp` (spec AC: list shows "trạng thái" per item). */
  status?: "VISIBLE" | "HIDDEN";
};

/** One capability card — used on both the landing page and `/mcp`. */
export function CapabilityCard({
  name,
  slug,
  vertical,
  shortDesc,
  status,
}: CapabilityCardProps) {
  return (
    <Link
      href={`/mcp/${slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-primary-100 bg-white p-5 transition-colors hover:border-primary-300 hover:shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
          {VERTICAL_LABELS[vertical]}
        </span>
        {status ? (
          <span
            className={
              status === "VISIBLE"
                ? "inline-flex items-center rounded-full bg-success-light px-3 py-1 text-xs font-medium text-success-dark"
                : "inline-flex items-center rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/60"
            }
          >
            {status === "VISIBLE" ? "Hiển thị" : "Ẩn"}
          </span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-600">
        {name}
      </h3>
      <p className="text-sm text-foreground/70">{shortDesc}</p>
      <span className="mt-auto inline-flex items-center text-sm font-medium text-primary-600">
        Xem chi tiết →
      </span>
    </Link>
  );
}
