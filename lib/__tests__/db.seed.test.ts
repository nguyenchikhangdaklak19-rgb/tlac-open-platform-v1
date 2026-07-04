import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seed } from "../../prisma/seed";
import { createTestDb, type TestDb } from "./db-test-helpers";

describe("prisma/seed.ts idempotency", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("creates exactly the 6 v1 capabilities", async () => {
    const { prisma } = db;
    await seed(prisma);

    const rows = await prisma.capability.findMany({ orderBy: { slug: "asc" } });
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.type === "MCP")).toBe(true);
    expect(rows.every((row) => row.status === "VISIBLE")).toBe(true);

    const slugs = rows.map((row) => row.slug).sort();
    expect(slugs).toEqual(
      [
        "dat-ve-may-bay",
        "dat-ve-tau",
        "dat-ve-xe-khach",
        "dat-ve-xem-phim",
        "order-highlands",
        "tim-kiem-voucher",
      ].sort(),
    );

    const verticalBySlug = Object.fromEntries(rows.map((row) => [row.slug, row.vertical]));
    expect(verticalBySlug["dat-ve-may-bay"]).toBe("TRAVEL");
    expect(verticalBySlug["dat-ve-tau"]).toBe("TRAVEL");
    expect(verticalBySlug["dat-ve-xe-khach"]).toBe("TRAVEL");
    expect(verticalBySlug["dat-ve-xem-phim"]).toBe("PHIM");
    expect(verticalBySlug["order-highlands"]).toBe("FNB");
    expect(verticalBySlug["tim-kiem-voucher"]).toBe("PROMOTION");
  });

  it("stays at 6 rows and does not duplicate when run twice", async () => {
    const { prisma } = db;
    await seed(prisma);
    await seed(prisma);

    const rows = await prisma.capability.findMany();
    expect(rows).toHaveLength(6);
  });

  it("does not fabricate tool schema / examples / config content", async () => {
    const { prisma } = db;
    await seed(prisma);

    const rows = await prisma.capability.findMany();
    for (const row of rows) {
      expect(row.toolSchema).toBe("[]");
      expect(row.longDesc).toContain("Admin");
      expect(row.examples).toContain("Admin");
      expect(row.configSnippet).toContain("Admin");
    }
  });
});
