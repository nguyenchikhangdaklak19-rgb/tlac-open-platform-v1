/**
 * Seed the v1 capability catalog (6 năng lực, spec section "Information
 * Architecture / Sitemap").
 *
 * Anti-fabrication rule (spec/tlac-open-platform-v1.md — "Anti-fabrication"):
 * real tool schemas, endpoints, and examples come from Eng/BU via the Admin
 * CMS, never hard-coded here. Every long-form / structured field below is
 * seeded with a clearly-marked placeholder so the catalog renders without
 * inventing product content. `status` is VISIBLE so `/mcp` has real rows to
 * list; `shortDesc` names only the capability, no invented details.
 *
 * Idempotent: upserts by `slug`, so running this script multiple times still
 * results in exactly the 6 rows below (no duplicates, no drift beyond what's
 * defined here).
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

const PLACEHOLDER = "Nội dung do Admin cập nhật qua CMS.";

type SeedCapability = {
  slug: string;
  name: string;
  vertical: "TRAVEL" | "PHIM" | "FNB" | "PROMOTION";
};

const CAPABILITIES: SeedCapability[] = [
  { slug: "dat-ve-may-bay", name: "Đặt vé máy bay", vertical: "TRAVEL" },
  { slug: "dat-ve-tau", name: "Đặt vé tàu", vertical: "TRAVEL" },
  { slug: "dat-ve-xe-khach", name: "Đặt vé xe khách", vertical: "TRAVEL" },
  { slug: "dat-ve-xem-phim", name: "Đặt vé xem phim", vertical: "PHIM" },
  { slug: "order-highlands", name: "Order Highlands", vertical: "FNB" },
  { slug: "tim-kiem-voucher", name: "Tìm kiếm voucher", vertical: "PROMOTION" },
];

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export async function seed(prisma: PrismaClient): Promise<void> {
  for (const capability of CAPABILITIES) {
    await prisma.capability.upsert({
      where: { slug: capability.slug },
      update: {
        name: capability.name,
        vertical: capability.vertical,
      },
      create: {
        type: "MCP",
        vertical: capability.vertical,
        name: capability.name,
        slug: capability.slug,
        shortDesc: `Năng lực ${capability.name} qua MCP TLAC.`,
        longDesc: PLACEHOLDER,
        toolSchema: "[]",
        examples: PLACEHOLDER,
        configSnippet: PLACEHOLDER,
        status: "VISIBLE",
      },
    });
  }
}

async function main() {
  const prisma = createPrismaClient();
  try {
    await seed(prisma);
    console.log(`Seeded ${CAPABILITIES.length} capabilities.`);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run automatically when invoked as a script (e.g. `prisma db seed`),
// not when imported by tests.
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
