import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seed } from "../../prisma/seed";
import { createTestDb, type TestDb } from "./db-test-helpers";

/**
 * Edge cases beyond the engineer's seed/idempotency tests:
 * - the seed's `update` block only touches name/vertical, so re-running it
 *   must NOT clobber content an Admin has since edited via CMS;
 * - OtpCode has no unique constraint on `email`, so a re-request flow can hold
 *   several unconsumed codes for the same address at once.
 */
describe("seed re-run preserves admin-edited content", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("does not overwrite CMS-edited content fields on re-seed", async () => {
    const { prisma } = db;
    await seed(prisma);

    // Admin edits display content via CMS.
    await prisma.capability.update({
      where: { slug: "dat-ve-may-bay" },
      data: {
        longDesc: "Mô tả thật do BU Travel cung cấp.",
        toolSchema: '[{"name":"searchFlights"}]',
        configSnippet: "config thật",
        status: "HIDDEN",
      },
    });

    // Re-running the seed must be idempotent AND leave admin content intact.
    await seed(prisma);

    const row = await prisma.capability.findUniqueOrThrow({
      where: { slug: "dat-ve-may-bay" },
    });
    expect(row.longDesc).toBe("Mô tả thật do BU Travel cung cấp.");
    expect(row.toolSchema).toBe('[{"name":"searchFlights"}]');
    expect(row.configSnippet).toBe("config thật");
    expect(row.status).toBe("HIDDEN");

    const count = await prisma.capability.count();
    expect(count).toBe(6);
  });
});

describe("OtpCode allows multiple codes per email", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("supports several concurrent unconsumed codes for one email (re-request)", async () => {
    const { prisma } = db;
    const email = "dev@example.com";

    await prisma.otpCode.create({
      data: { email, codeHash: "hash-1", expiresAt: new Date(Date.now() + 60_000) },
    });
    await prisma.otpCode.create({
      data: { email, codeHash: "hash-2", expiresAt: new Date(Date.now() + 60_000) },
    });

    const codes = await prisma.otpCode.findMany({ where: { email, consumedAt: null } });
    expect(codes).toHaveLength(2);
    expect(new Set(codes.map((c) => c.codeHash))).toEqual(new Set(["hash-1", "hash-2"]));
  });
});
