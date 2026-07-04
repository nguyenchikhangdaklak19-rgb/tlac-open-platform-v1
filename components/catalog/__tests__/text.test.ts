import { describe, expect, it } from "vitest";
import { splitParagraphs } from "../text";

describe("splitParagraphs", () => {
  it("splits on a blank line and trims each paragraph", () => {
    expect(splitParagraphs("Đoạn 1.\n\nĐoạn 2.")).toEqual(["Đoạn 1.", "Đoạn 2."]);
  });

  it("collapses multiple consecutive blank lines into one boundary", () => {
    expect(splitParagraphs("A\n\n\n\nB")).toEqual(["A", "B"]);
  });

  it("returns an empty array for blank input", () => {
    expect(splitParagraphs("")).toEqual([]);
    expect(splitParagraphs("   \n  ")).toEqual([]);
  });

  it("returns a single paragraph when there is no blank line", () => {
    expect(splitParagraphs("Chỉ một đoạn duy nhất, không xuống dòng đôi.")).toEqual([
      "Chỉ một đoạn duy nhất, không xuống dòng đôi.",
    ]);
  });
});
