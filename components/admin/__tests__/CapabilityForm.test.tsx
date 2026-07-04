/**
 * Markup-level tests for the create/edit capability form (spec section E,
 * item 3). Uses `renderToStaticMarkup` (no extra deps, per task constraints)
 * rather than a full DOM test — `next/navigation`'s `useRouter` is mocked
 * since it needs an App Router context that isn't present under plain
 * server-side rendering.
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CapabilityForm from "@/components/admin/CapabilityForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("CapabilityForm", () => {
  it("renders every field from the spec (create mode)", () => {
    const html = renderToStaticMarkup(<CapabilityForm mode="create" />);
    for (const id of [
      "name",
      "type",
      "vertical",
      "slug",
      "shortDesc",
      "longDesc",
      "toolSchema",
      "examples",
      "configSnippet",
      "status",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("renders the 'Phase sau' runtime-config note near tool schema", () => {
    const html = renderToStaticMarkup(<CapabilityForm mode="create" />);
    expect(html).toContain("Phase sau");
    expect(html).toContain("Cấu hình runtime MCP server");
  });

  it("shows the Skills-still-coming-soon note only when type is SKILL", () => {
    const skillHtml = renderToStaticMarkup(
      <CapabilityForm mode="create" initialValues={{ type: "SKILL" }} />,
    );
    expect(skillHtml).toContain("Sắp ra mắt");

    const mcpHtml = renderToStaticMarkup(<CapabilityForm mode="create" />);
    expect(mcpHtml).not.toContain("Sắp ra mắt");
  });

  it("pre-fills fields from initialValues in edit mode", () => {
    const html = renderToStaticMarkup(
      <CapabilityForm
        mode="edit"
        capabilityId="abc123"
        initialValues={{ name: "Đặt vé tàu", slug: "dat-ve-tau" }}
      />,
    );
    expect(html).toContain("Đặt vé tàu");
    expect(html).toContain("dat-ve-tau");
  });

  it("has no ALL-CAPS button labels (verb-first per DS)", () => {
    const html = renderToStaticMarkup(<CapabilityForm mode="create" />);
    const buttonTexts = Array.from(html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)).map(
      ([, inner]) => inner.replace(/<[^>]+>/g, " ").trim(),
    );
    expect(buttonTexts.length).toBeGreaterThan(0);
    for (const label of buttonTexts) {
      expect(label).not.toMatch(/\b[A-Z]{4,}\b/);
    }
  });

  it("renders a save button and a cancel link back to /admin", () => {
    const html = renderToStaticMarkup(<CapabilityForm mode="create" />);
    expect(html).toContain("Lưu năng lực");
    expect(html).toContain('href="/admin"');
  });
});
