import { describe, expect, it } from "vitest";
import {
  hasFieldErrors,
  normalizeCapabilityInput,
  validateCapabilityInput,
  type CapabilityInput,
} from "@/components/admin/validate";

const VALID_INPUT: CapabilityInput = {
  name: "Đặt vé máy bay",
  type: "MCP",
  vertical: "TRAVEL",
  slug: "dat-ve-may-bay",
  shortDesc: "Tìm và đặt vé máy bay qua MCP TLAC.",
  longDesc: "Mô tả dài về năng lực.",
  toolSchema: '[{"name":"search_flights"}]',
  examples: "Ví dụ gọi tool.",
  configSnippet: "endpoint: ...",
  status: "VISIBLE",
};

describe("validateCapabilityInput", () => {
  it("passes for a fully valid input", () => {
    const errors = validateCapabilityInput(VALID_INPUT);
    expect(errors).toEqual({});
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("flags a missing name", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, name: "" });
    expect(errors.name).toBeTruthy();
  });

  it("flags a whitespace-only name as missing", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, name: "   " });
    expect(errors.name).toBeTruthy();
  });

  it("flags a missing vertical", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, vertical: undefined });
    expect(errors.vertical).toBeTruthy();
  });

  it("flags an out-of-range vertical", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, vertical: "SPORTS" });
    expect(errors.vertical).toBeTruthy();
  });

  it("flags a missing slug", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, slug: "" });
    expect(errors.slug).toBeTruthy();
  });

  it("flags a badly formatted slug (uppercase)", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, slug: "Dat-Ve-May-Bay" });
    expect(errors.slug).toBeTruthy();
  });

  it("flags a badly formatted slug (spaces)", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, slug: "dat ve may bay" });
    expect(errors.slug).toBeTruthy();
  });

  it("flags a badly formatted slug (double hyphen / leading hyphen)", () => {
    expect(validateCapabilityInput({ ...VALID_INPUT, slug: "dat--ve" }).slug).toBeTruthy();
    expect(validateCapabilityInput({ ...VALID_INPUT, slug: "-dat-ve" }).slug).toBeTruthy();
  });

  it("flags a missing shortDesc", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, shortDesc: "" });
    expect(errors.shortDesc).toBeTruthy();
  });

  it("allows an empty toolSchema", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, toolSchema: "" });
    expect(errors.toolSchema).toBeUndefined();
  });

  it("flags an invalid JSON toolSchema", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, toolSchema: "{not json" });
    expect(errors.toolSchema).toBeTruthy();
  });

  it("accepts a valid JSON toolSchema", () => {
    const errors = validateCapabilityInput({
      ...VALID_INPUT,
      toolSchema: '{"tools": []}',
    });
    expect(errors.toolSchema).toBeUndefined();
  });

  it("flags an invalid type", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, type: "WIDGET" });
    expect(errors.type).toBeTruthy();
  });

  it("accepts type SKILL", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, type: "SKILL" });
    expect(errors.type).toBeUndefined();
  });

  it("flags an invalid status", () => {
    const errors = validateCapabilityInput({ ...VALID_INPUT, status: "ARCHIVED" });
    expect(errors.status).toBeTruthy();
  });

  it("collects multiple errors at once", () => {
    const errors = validateCapabilityInput({});
    expect(errors.name).toBeTruthy();
    expect(errors.vertical).toBeTruthy();
    expect(errors.slug).toBeTruthy();
    expect(errors.shortDesc).toBeTruthy();
    expect(errors.type).toBeTruthy();
    expect(hasFieldErrors(errors)).toBe(true);
  });
});

describe("normalizeCapabilityInput", () => {
  it("trims whitespace on string fields", () => {
    const normalized = normalizeCapabilityInput({
      ...VALID_INPUT,
      name: "  Đặt vé máy bay  ",
      slug: "  dat-ve-may-bay  ",
    });
    expect(normalized.name).toBe("Đặt vé máy bay");
    expect(normalized.slug).toBe("dat-ve-may-bay");
  });

  it("falls back to safe enum defaults for garbage enum values", () => {
    const normalized = normalizeCapabilityInput({
      ...VALID_INPUT,
      type: "NOPE",
      vertical: "NOPE",
      status: "NOPE",
    });
    expect(normalized.type).toBe("MCP");
    expect(normalized.vertical).toBe("TRAVEL");
    expect(normalized.status).toBe("VISIBLE");
  });
});
