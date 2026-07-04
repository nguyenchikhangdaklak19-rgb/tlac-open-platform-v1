import type { Metadata } from "next";
import prisma from "@/lib/db";
import { CapabilityList } from "@/components/catalog/capability-list";
import { SearchFilterForm } from "@/components/catalog/search-filter-form";
import { filterCapabilities } from "@/components/catalog/filter";

// Catalog list (spec section A, IA: `/mcp`). Search + vertical filter are
// plain `?q=&vertical=` URL search params handled server-side (see
// components/catalog/search-filter-form.tsx) — reads the DB on every
// request, so this can't be statically prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Năng lực MCP | TLAC Open Platform",
  description:
    "Tìm và lọc các năng lực MCP TLAC đang mở để kết nối vào agent của bạn.",
};

type McpListSearchParams = {
  q?: string | string[];
  vertical?: string | string[];
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function McpListPage({
  searchParams,
}: {
  searchParams: Promise<McpListSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = firstValue(resolvedSearchParams.q);
  const vertical = firstValue(resolvedSearchParams.vertical);

  // Only ever list VISIBLE MCP capabilities — Admin-hidden ones must not
  // appear here (spec AC: "biến mất khỏi catalog công khai").
  const capabilities = await prisma.capability.findMany({
    where: { type: "MCP", status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
  });

  const filtered = filterCapabilities(capabilities, q, vertical);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Năng lực MCP
        </h1>
        <p className="mt-2 text-sm text-foreground/70 sm:text-base">
          Tìm và lọc các năng lực TLAC đang mở để kết nối vào agent của bạn.
        </p>
      </div>

      <div className="mt-6">
        <SearchFilterForm q={q} vertical={vertical} />
      </div>

      <div className="mt-8">
        <CapabilityList
          capabilities={filtered.map((capability) => ({
            name: capability.name,
            slug: capability.slug,
            vertical: capability.vertical,
            shortDesc: capability.shortDesc,
            status: capability.status,
          }))}
        />
      </div>
    </div>
  );
}
