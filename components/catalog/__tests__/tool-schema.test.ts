import { describe, expect, it } from "vitest";
import {
  parseToolSchema,
  toolDescription,
  toolHasIoSchema,
  toolLabel,
} from "../tool-schema";

describe("parseToolSchema", () => {
  it("treats the seeded placeholder '[]' as no tools yet (not a crash)", () => {
    expect(parseToolSchema("[]")).toEqual({ kind: "empty" });
  });

  it("treats a blank/empty string as no tools yet", () => {
    expect(parseToolSchema("")).toEqual({ kind: "empty" });
    expect(parseToolSchema("   ")).toEqual({ kind: "empty" });
    expect(parseToolSchema(null)).toEqual({ kind: "empty" });
    expect(parseToolSchema(undefined)).toEqual({ kind: "empty" });
  });

  it("never throws on malformed JSON — resolves to 'invalid'", () => {
    expect(() => parseToolSchema("{not valid json")).not.toThrow();
    expect(parseToolSchema("{not valid json").kind).toBe("invalid");
  });

  it("parses a valid array of tool objects", () => {
    const raw = JSON.stringify([
      {
        name: "search_flights",
        description: "Tìm chuyến bay theo tuyến và ngày",
        input: { from: "string", to: "string" },
        output: { flights: "array" },
      },
    ]);
    const result = parseToolSchema(raw);
    expect(result.kind).toBe("tools");
    if (result.kind !== "tools") throw new Error("expected kind 'tools'");
    expect(result.tools).toHaveLength(1);
    expect(toolLabel(result.tools[0], 0)).toBe("search_flights");
    expect(toolDescription(result.tools[0])).toBe(
      "Tìm chuyến bay theo tuyến và ngày",
    );
    expect(toolHasIoSchema(result.tools[0])).toBe(true);
  });

  it("falls back to a numbered label and null description when absent", () => {
    const result = parseToolSchema(JSON.stringify([{}]));
    expect(result.kind).toBe("tools");
    if (result.kind !== "tools") throw new Error("expected kind 'tools'");
    expect(toolLabel(result.tools[0], 0)).toBe("Tool 1");
    expect(toolDescription(result.tools[0])).toBeNull();
    expect(toolHasIoSchema(result.tools[0])).toBe(false);
  });

  it("treats an array of non-object entries as invalid", () => {
    expect(parseToolSchema(JSON.stringify(["a", "b"])).kind).toBe("invalid");
  });
});
