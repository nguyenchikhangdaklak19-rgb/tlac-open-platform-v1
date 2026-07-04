import { describe, expect, it } from "vitest";
import { filterCapabilities, type CatalogCapability } from "../filter";

const CAPS: CatalogCapability[] = [
  {
    name: "Đặt vé máy bay",
    slug: "dat-ve-may-bay",
    shortDesc: "Đặt vé máy bay nhanh chóng qua MCP TLAC",
    vertical: "TRAVEL",
  },
  {
    name: "Đặt vé tàu",
    slug: "dat-ve-tau",
    shortDesc: "Đặt vé tàu hoả qua MCP TLAC",
    vertical: "TRAVEL",
  },
  {
    name: "Đặt vé xem phim",
    slug: "dat-ve-xem-phim",
    shortDesc: "Đặt vé rạp chiếu phim qua MCP TLAC",
    vertical: "PHIM",
  },
  {
    name: "Order Highlands",
    slug: "order-highlands",
    shortDesc: "Đặt đồ uống Highlands qua MCP TLAC",
    vertical: "FNB",
  },
  {
    name: "Tìm kiếm voucher",
    slug: "tim-kiem-voucher",
    shortDesc: "Tìm voucher khuyến mãi qua MCP TLAC",
    vertical: "PROMOTION",
  },
];

describe("filterCapabilities", () => {
  it("returns everything when no keyword or vertical is given", () => {
    expect(filterCapabilities(CAPS)).toHaveLength(CAPS.length);
  });

  it("matches a keyword against the name, case-insensitively", () => {
    const result = filterCapabilities(CAPS, "MÁY BAY");
    expect(result.map((c) => c.slug)).toEqual(["dat-ve-may-bay"]);
  });

  it("matches a keyword against shortDesc, case-insensitively", () => {
    const result = filterCapabilities(CAPS, "rạp chiếu");
    expect(result.map((c) => c.slug)).toEqual(["dat-ve-xem-phim"]);
  });

  it("filters by vertical", () => {
    const result = filterCapabilities(CAPS, "", "TRAVEL");
    expect(result.map((c) => c.slug).sort()).toEqual([
      "dat-ve-may-bay",
      "dat-ve-tau",
    ]);
  });

  it("combines a keyword filter with a vertical filter", () => {
    const result = filterCapabilities(CAPS, "vé", "TRAVEL");
    expect(result.map((c) => c.slug).sort()).toEqual([
      "dat-ve-may-bay",
      "dat-ve-tau",
    ]);
  });

  it("returns an empty array when nothing matches the keyword", () => {
    expect(filterCapabilities(CAPS, "không tồn tại trong catalog")).toEqual([]);
  });

  it("returns an empty array when the vertical filter has no matches for the keyword", () => {
    expect(filterCapabilities(CAPS, "voucher", "TRAVEL")).toEqual([]);
  });

  it("ignores blank/whitespace-only keywords", () => {
    expect(filterCapabilities(CAPS, "   ")).toHaveLength(CAPS.length);
  });

  it("treats an unknown vertical value as 'no filter'", () => {
    const result = filterCapabilities(CAPS, "", "NOT_A_REAL_VERTICAL");
    expect(result).toHaveLength(CAPS.length);
  });
});
