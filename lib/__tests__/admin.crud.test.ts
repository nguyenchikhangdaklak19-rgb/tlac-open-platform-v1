/**
 * CRUD + status-toggle round trip for the Admin CMS (spec section E),
 * exercised directly against a real, freshly migrated SQLite database (via
 * `createTestDb`, shared with the data-model task's tests — not modified
 * here) rather than through the Next.js route handlers, since those depend
 * on `next/headers` cookies. The route handlers themselves are thin wrappers
 * around these same `components/admin/service.ts` functions.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./db-test-helpers";
import {
  createCapability,
  getCapabilityById,
  listCapabilities,
  toggleCapabilityStatus,
  updateCapability,
} from "@/components/admin/service";
import type { CapabilityInput } from "@/components/admin/validate";

const VALID_INPUT: CapabilityInput = {
  name: "Đặt vé máy bay",
  type: "MCP",
  vertical: "TRAVEL",
  slug: "dat-ve-may-bay",
  shortDesc: "Tìm và đặt vé máy bay qua MCP TLAC.",
  longDesc: "Mô tả dài.",
  toolSchema: '[{"name":"search_flights"}]',
  examples: "Ví dụ gọi tool.",
  configSnippet: "endpoint: ...",
  status: "VISIBLE",
};

let db: TestDb;

beforeEach(() => {
  db = createTestDb();
});

afterEach(async () => {
  await db.cleanup();
});

describe("createCapability", () => {
  it("creates a capability when input is valid", async () => {
    const result = await createCapability(db.prisma, VALID_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.slug).toBe("dat-ve-may-bay");
    expect(result.data.status).toBe("VISIBLE");

    const all = await listCapabilities(db.prisma);
    expect(all).toHaveLength(1);
  });

  it("rejects with 400 + field errors when required fields are missing", async () => {
    const result = await createCapability(db.prisma, { ...VALID_INPUT, name: "" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.fields?.name).toBeTruthy();

    const all = await listCapabilities(db.prisma);
    expect(all).toHaveLength(0);
  });

  it("rejects with 409 + field error on duplicate slug", async () => {
    const first = await createCapability(db.prisma, VALID_INPUT);
    expect(first.ok).toBe(true);

    const second = await createCapability(db.prisma, {
      ...VALID_INPUT,
      name: "Đặt vé máy bay 2",
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.status).toBe(409);
    expect(second.error).toBe("duplicate_slug");
    expect(second.fields?.slug).toBeTruthy();

    const all = await listCapabilities(db.prisma);
    expect(all).toHaveLength(1);
  });

  it("creates a SKILL entry (admin can pre-create Skills, spec section F)", async () => {
    const result = await createCapability(db.prisma, {
      ...VALID_INPUT,
      type: "SKILL",
      slug: "goi-y-mon-an",
      name: "Gợi ý món ăn",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.type).toBe("SKILL");
  });
});

describe("updateCapability", () => {
  it("updates content fields and persists them", async () => {
    const created = await createCapability(db.prisma, VALID_INPUT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateCapability(db.prisma, created.data.id, {
      ...VALID_INPUT,
      shortDesc: "Mô tả ngắn đã cập nhật.",
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.data.shortDesc).toBe("Mô tả ngắn đã cập nhật.");

    const fetched = await getCapabilityById(db.prisma, created.data.id);
    expect(fetched?.shortDesc).toBe("Mô tả ngắn đã cập nhật.");
  });

  it("rejects with 400 + field errors when required fields are missing", async () => {
    const created = await createCapability(db.prisma, VALID_INPUT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateCapability(db.prisma, created.data.id, {
      ...VALID_INPUT,
      shortDesc: "",
    });
    expect(updated.ok).toBe(false);
    if (updated.ok) return;
    expect(updated.status).toBe(400);
    expect(updated.fields?.shortDesc).toBeTruthy();

    const unchanged = await getCapabilityById(db.prisma, created.data.id);
    expect(unchanged?.shortDesc).toBe(VALID_INPUT.shortDesc);
  });

  it("returns 409 when updating to a slug already used by another row", async () => {
    const first = await createCapability(db.prisma, VALID_INPUT);
    const second = await createCapability(db.prisma, {
      ...VALID_INPUT,
      slug: "dat-ve-tau",
      name: "Đặt vé tàu",
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const result = await updateCapability(db.prisma, second.data.id, {
      ...VALID_INPUT,
      slug: first.data.slug,
      name: second.data.name,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
  });

  it("returns 404 for a non-existent id", async () => {
    const result = await updateCapability(db.prisma, "does-not-exist", VALID_INPUT);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });
});

describe("toggleCapabilityStatus", () => {
  it("flips VISIBLE to HIDDEN and back", async () => {
    const created = await createCapability(db.prisma, VALID_INPUT);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.status).toBe("VISIBLE");

    const hidden = await toggleCapabilityStatus(db.prisma, created.data.id);
    expect(hidden.ok).toBe(true);
    if (!hidden.ok) return;
    expect(hidden.data.status).toBe("HIDDEN");

    const visibleAgain = await toggleCapabilityStatus(db.prisma, created.data.id);
    expect(visibleAgain.ok).toBe(true);
    if (!visibleAgain.ok) return;
    expect(visibleAgain.data.status).toBe("VISIBLE");
  });

  it("returns 404 for a non-existent id", async () => {
    const result = await toggleCapabilityStatus(db.prisma, "does-not-exist");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });
});

describe("listCapabilities", () => {
  it("lists both MCP and SKILL, both VISIBLE and HIDDEN", async () => {
    const mcp = await createCapability(db.prisma, VALID_INPUT);
    const skill = await createCapability(db.prisma, {
      ...VALID_INPUT,
      type: "SKILL",
      slug: "goi-y-mon-an",
      name: "Gợi ý món ăn",
      status: "HIDDEN",
    });
    expect(mcp.ok).toBe(true);
    expect(skill.ok).toBe(true);

    const all = await listCapabilities(db.prisma);
    expect(all).toHaveLength(2);
    expect(all.some((c) => c.type === "SKILL" && c.status === "HIDDEN")).toBe(true);
    expect(all.some((c) => c.type === "MCP" && c.status === "VISIBLE")).toBe(true);
  });
});
