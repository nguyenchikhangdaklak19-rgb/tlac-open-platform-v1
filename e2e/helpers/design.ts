/**
 * Responsive / design-system assertions shared by `e2e/g-responsive.spec.ts`
 * (spec section G).
 */
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Spec AC: "không vỡ layout, không tràn ngang" — the page's scrollable width
 * must never exceed the viewport width (a 1px tolerance absorbs sub-pixel
 * rounding from scrollbars/fonts).
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, viewportWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(
    scrollWidth,
    `document.documentElement.scrollWidth (${scrollWidth}) should not exceed viewport width (${viewportWidth})`,
  ).toBeLessThanOrEqual(viewportWidth + 1);
}

/** Spec AC: "đọc được" — the page must render some visible text, not a blank shell. */
export async function assertHasVisibleText(page: Page): Promise<void> {
  const text = await page.evaluate(() => document.body.innerText.trim());
  expect(text.length).toBeGreaterThan(0);
}

/**
 * Spec AC (section G): "không dùng magenta PPTX #A1185C" — the deck's magenta
 * (`#A1185C` === `rgb(161, 24, 92)`) must never appear as a rendered color on
 * a product page; the web product uses MoMo pink `#eb2f96` instead. Scans
 * every element's computed text/background/border colors for that exact value.
 */
export async function assertNoPptxMagenta(page: Page): Promise<void> {
  const offenders = await page.evaluate(() => {
    const FORBIDDEN = "rgb(161, 24, 92)";
    const props = [
      "color",
      "backgroundColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
    ] as const;
    const hits: string[] = [];
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const style = getComputedStyle(el);
      for (const prop of props) {
        if (style[prop] === FORBIDDEN) {
          hits.push(`${el.tagName.toLowerCase()}.${prop}`);
          break;
        }
      }
    }
    return hits;
  });
  expect(
    offenders,
    `Found PPTX magenta #A1185C on: ${offenders.join(", ")}`,
  ).toEqual([]);
}

/**
 * Spec AC: "Nút bấm verb-first, không ALL-CAPS" — no button/link should use
 * `text-transform: uppercase` (the MoMo design system relies on natural
 * casing, not CSS-driven all-caps).
 */
export async function assertNoUppercaseButtonsOrLinks(page: Page): Promise<void> {
  const offenders = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("button, a"));
    return elements
      .filter((el) => getComputedStyle(el).textTransform === "uppercase")
      .map((el) => el.textContent?.trim() ?? "");
  });
  expect(offenders, `Found uppercase button/link text: ${offenders.join(", ")}`).toEqual([]);
}
