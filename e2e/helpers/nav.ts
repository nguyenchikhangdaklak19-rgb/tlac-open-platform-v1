/**
 * Navigation helper (task T09).
 *
 * Waits for `networkidle` after navigation so client JS has finished
 * loading before a test interacts with the page — Playwright's default
 * actionability waits (visible + enabled + stable) don't wait for React to
 * hydrate and attach event listeners, and clicking a submit button too
 * early lets the browser's native (uncontrolled) form submission fire
 * instead of the React `onSubmit` handler.
 */
import type { Page, Response } from "@playwright/test";

export async function gotoReady(page: Page, url: string): Promise<Response | null> {
  const response = await page.goto(url);
  await page.waitForLoadState("networkidle");
  return response;
}
