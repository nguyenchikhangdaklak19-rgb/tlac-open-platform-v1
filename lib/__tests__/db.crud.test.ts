import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./db-test-helpers";

describe("Prisma schema CRUD round-trip", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.cleanup();
  });

  it("creates, reads, updates, and deletes a Capability", async () => {
    const { prisma } = db;

    const created = await prisma.capability.create({
      data: {
        type: "MCP",
        vertical: "TRAVEL",
        name: "Đặt vé máy bay",
        slug: "dat-ve-may-bay",
        shortDesc: "Năng lực đặt vé máy bay qua MCP TLAC.",
        longDesc: "Nội dung do Admin cập nhật qua CMS.",
        toolSchema: "[]",
        examples: "Nội dung do Admin cập nhật qua CMS.",
        configSnippet: "Nội dung do Admin cập nhật qua CMS.",
        status: "VISIBLE",
      },
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe("VISIBLE");

    const found = await prisma.capability.findUnique({ where: { slug: "dat-ve-may-bay" } });
    expect(found?.name).toBe("Đặt vé máy bay");

    const updated = await prisma.capability.update({
      where: { slug: "dat-ve-may-bay" },
      data: { status: "HIDDEN" },
    });
    expect(updated.status).toBe("HIDDEN");

    await prisma.capability.delete({ where: { slug: "dat-ve-may-bay" } });
    const afterDelete = await prisma.capability.findUnique({ where: { slug: "dat-ve-may-bay" } });
    expect(afterDelete).toBeNull();
  });

  it("creates, reads, updates, and deletes a User", async () => {
    const { prisma } = db;

    const created = await prisma.user.create({
      data: { email: "dev@example.com" },
    });
    expect(created.emailVerified).toBe(false);
    expect(created.isAdmin).toBe(false);

    const updated = await prisma.user.update({
      where: { id: created.id },
      data: { emailVerified: true, isAdmin: true },
    });
    expect(updated.emailVerified).toBe(true);
    expect(updated.isAdmin).toBe(true);

    const found = await prisma.user.findUnique({ where: { email: "dev@example.com" } });
    expect(found?.id).toBe(created.id);

    await prisma.user.delete({ where: { id: created.id } });
    expect(await prisma.user.findUnique({ where: { id: created.id } })).toBeNull();
  });

  it("creates, reads, and consumes an OtpCode", async () => {
    const { prisma } = db;

    const expiresAt = new Date(Date.now() + 5 * 60_000);
    const created = await prisma.otpCode.create({
      data: {
        email: "dev@example.com",
        codeHash: "hashed-value",
        expiresAt,
      },
    });
    expect(created.consumedAt).toBeNull();

    const consumed = await prisma.otpCode.update({
      where: { id: created.id },
      data: { consumedAt: new Date() },
    });
    expect(consumed.consumedAt).not.toBeNull();

    const byEmail = await prisma.otpCode.findMany({ where: { email: "dev@example.com" } });
    expect(byEmail).toHaveLength(1);

    await prisma.otpCode.delete({ where: { id: created.id } });
    expect(await prisma.otpCode.findMany({ where: { email: "dev@example.com" } })).toHaveLength(0);
  });
});
