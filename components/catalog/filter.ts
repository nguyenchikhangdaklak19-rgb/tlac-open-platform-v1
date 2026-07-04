/**
 * Catalog filtering (spec section A — `/mcp` search + vertical filter).
 *
 * Pure, framework-free so it can be unit tested directly and reused from
 * both the list page (`app/mcp/page.tsx`, real Prisma rows) and its tests
 * (fake in-memory rows). Filtering happens server-side against the
 * `?q=&vertical=` URL search params — no client-side state.
 */

export const VERTICALS = ["TRAVEL", "PHIM", "FNB", "PROMOTION"] as const;

export type Vertical = (typeof VERTICALS)[number];

/** Vietnamese display labels for each vertical (spec IA table). */
export const VERTICAL_LABELS: Record<Vertical, string> = {
  TRAVEL: "Travel",
  PHIM: "Phim",
  FNB: "F&B",
  PROMOTION: "Promotion",
};

/** Minimal shape `filterCapabilities` needs — real rows carry more fields. */
export type CatalogCapability = {
  name: string;
  slug: string;
  shortDesc: string;
  vertical: Vertical;
};

function isVertical(value: string): value is Vertical {
  return (VERTICALS as readonly string[]).includes(value);
}

/**
 * Filter capabilities by a free-text keyword (matched case-insensitively
 * against `name` and `shortDesc`) and/or an exact vertical. An empty/blank
 * keyword and an empty/unknown vertical are both treated as "no filter" —
 * this is what lets `?q=&vertical=` (nothing selected) show everything.
 */
export function filterCapabilities<T extends CatalogCapability>(
  capabilities: T[],
  q?: string | null,
  vertical?: string | null,
): T[] {
  const keyword = (q ?? "").trim().toLowerCase();
  const verticalFilter = vertical && isVertical(vertical) ? vertical : null;

  return capabilities.filter((capability) => {
    const matchesKeyword =
      keyword === "" ||
      capability.name.toLowerCase().includes(keyword) ||
      capability.shortDesc.toLowerCase().includes(keyword);
    const matchesVertical =
      verticalFilter === null || capability.vertical === verticalFilter;
    return matchesKeyword && matchesVertical;
  });
}
