import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./db-test-helpers";

const baseCapability = {
  type: "MCP" as const,
  vertical: "TRAVEL" as const,
  name: "Đặt vé máy bay",
  shortDesc: "Năng lực đặt vé máy bay qua MCP TLAC.",
  longDesc: "Nội dung do Admin cập nhật qua CMS.",
  toolSchema: "[]",
  examples: "Nội dung do Admin cập nhật qua CMS.",
  configSnippet: "Nội dung do Admin cập nhật qua CMS.",
  status: "VISIBLE" as const,
};

describe("Prisma schema constraints", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("rejects a duplicate Capability slug", async () => {
    const { prisma } = db;
    await prisma.capability.create({
      data: { ...baseCapability, slug: "dat-ve-may-bay" },
    });

    await expect(
      prisma.capability.create({
        data: { ...baseCapability, name: "Đặt vé máy bay (duplicate)", slug: "dat-ve-may-bay" },
      }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate User email", async () => {
    const { prisma } = db;
    await prisma.user.create({ data: { email: "dev@example.com" } });

    await expect(prisma.user.create({ data: { email: "dev@example.com" } })).rejects.toThrow();
  });

  it("rejects an invalid CapabilityType enum value", async () => {
    const { prisma } = db;

    await expect(
      prisma.capability.create({
        data: {
          ...baseCapability,
          slug: "invalid-type",
          // @ts-expect-error - intentionally invalid enum value to assert runtime validation
          type: "NOT_A_TYPE",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid Vertical enum value", async () => {
    const { prisma } = db;

    await expect(
      prisma.capability.create({
        data: {
          ...baseCapability,
          slug: "invalid-vertical",
          // @ts-expect-error - intentionally invalid enum value to assert runtime validation
          vertical: "NOT_A_VERTICAL",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects an invalid CapabilityStatus enum value", async () => {
    const { prisma } = db;

    await expect(
      prisma.capability.create({
        data: {
          ...baseCapability,
          slug: "invalid-status",
          // @ts-expect-error - intentionally invalid enum value to assert runtime validation
          status: "NOT_A_STATUS",
        },
      }),
    ).rejects.toThrow();
  });
});
