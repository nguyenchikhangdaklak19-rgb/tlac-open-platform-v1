/**
 * Spec section G — Responsive & Design system.
 */
import { test, expect } from "@playwright/test";
import {
  assertHasVisibleText,
  assertNoHorizontalOverflow,
  assertNoPptxMagenta,
  assertNoUppercaseButtonsOrLinks,
} from "./helpers/design";
import { gotoReady } from "./helpers/nav";

const VIEWPORTS = [
  { name: "375x812 (mobile)", width: 375, height: 812 },
  { name: "768x1024 (tablet)", width: 768, height: 1024 },
  { name: "1440x900 (desktop)", width: 1440, height: 900 },
] as const;

const PAGES = ["/", "/mcp", "/mcp/dat-ve-may-bay", "/docs", "/skills", "/login", "/register"] as const;

test.describe("G. Responsive & Design system", () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`viewport ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const path of PAGES) {
        test(`${path} — no horizontal overflow, has visible text`, async ({ page }) => {
          await gotoReady(page, path);
          await assertNoHorizontalOverflow(page);
          await assertHasVisibleText(page);
        });
      }

      test("no button/link uses ALL-CAPS text-transform", async ({ page }) => {
        await gotoReady(page, "/");
        await assertNoUppercaseButtonsOrLinks(page);
      });
    });
  }

  test("PPTX magenta #A1185C never appears on landing or a detail page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoReady(page, "/");
    await assertNoPptxMagenta(page);
    await gotoReady(page, "/mcp/dat-ve-may-bay");
    await assertNoPptxMagenta(page);
  });

  test("MoMo pink #eb2f96 appears on the landing page's primary CTA", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoReady(page, "/");
    const cta = page.getByRole("link", { name: "Khám phá năng lực MCP" }).first();
    const backgroundColor = await cta.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).toBe("rgb(235, 47, 150)");
  });
});
