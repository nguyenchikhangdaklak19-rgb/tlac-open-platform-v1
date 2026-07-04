/**
 * Spec section D — Yêu cầu hỗ trợ.
 *
 * The success path exercises the real `/api/support` route: `webServer.env`
 * (playwright.config.ts) force-unsets `SUPPORT_WEBHOOK_URL`, so
 * `sendSupportRequest` (lib/webhook.ts) takes the dev-log branch and always
 * succeeds — matching the "webhook unset" UAT condition. The webhook
 * *failure* path can't be exercised live without a second webServer env
 * (the URL is read once from `process.env` at server start), so we simulate
 * it with `page.route` intercepting `/api/support` with a 502 — this still
 * faithfully checks the client's "keep entered values, show an error"
 * contract (support-form.tsx's catch/`finally` never clears field state).
 */
import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, USER_EMAIL } from "./helpers/env";
import { gotoReady } from "./helpers/nav";
import { sessionCookie } from "./helpers/session";

test.describe("D. Yêu cầu hỗ trợ", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([sessionCookie(USER_EMAIL, false)]);
  });

  test("form has capability/error-type selects, required mô tả, prefilled email", async ({
    page,
  }) => {
    await gotoReady(page, "/support");
    await expect(page.getByLabel("Năng lực liên quan")).toBeVisible();
    await expect(page.getByLabel("Loại lỗi")).toBeVisible();
    await expect(page.getByLabel("Mô tả")).toBeVisible();
    await expect(page.getByLabel("Email liên hệ")).toHaveValue(USER_EMAIL);
  });

  test("missing required mô tả blocks submit and shows a field error", async ({ page }) => {
    await gotoReady(page, "/support");
    // Leave "Mô tả" empty; everything else has a usable default.
    await page.getByRole("button", { name: "Gửi yêu cầu hỗ trợ" }).click();

    await expect(page.getByText("Vui lòng mô tả vấn đề bạn gặp phải.").first()).toBeVisible();
    await expect(page.getByText("Đã gửi yêu cầu, team sẽ liên hệ qua email.")).toHaveCount(0);
  });

  test("successful submit (webhook unset) shows the confirmation message", async ({ page }) => {
    await gotoReady(page, "/support");
    await page.getByLabel("Mô tả").fill("E2E: không kết nối được MCP client.");
    await page.getByRole("button", { name: "Gửi yêu cầu hỗ trợ" }).click();

    await expect(page.getByText("Đã gửi yêu cầu, team sẽ liên hệ qua email.").first()).toBeVisible();
  });

  test("webhook failure keeps entered values and shows a retry error", async ({ page }) => {
    await page.route("**/api/support", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error: "webhook_failed",
          message: "Không gửi được yêu cầu hỗ trợ. Vui lòng thử lại.",
        }),
      }),
    );

    await gotoReady(page, "/support");
    const description = "E2E: mô tả cần được giữ nguyên sau khi gửi thất bại.";
    await page.getByLabel("Mô tả").fill(description);
    await page.getByRole("button", { name: "Gửi yêu cầu hỗ trợ" }).click();

    await expect(page.getByText("Không gửi được yêu cầu hỗ trợ. Vui lòng thử lại.").first()).toBeVisible();
    await expect(page.getByLabel("Mô tả")).toHaveValue(description);
    await expect(page.getByLabel("Email liên hệ")).toHaveValue(USER_EMAIL);
  });

  test("no ticket-management route exists in the app", async ({ page, context }) => {
    await context.addCookies([sessionCookie(ADMIN_EMAIL, true)]);
    const response = await gotoReady(page, "/admin/tickets");
    expect(response?.status()).toBe(404);
  });
});
