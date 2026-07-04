/**
 * Spec section C — Kết nối (connection config).
 */
import { test, expect } from "@playwright/test";
import { newAuthedApiContext } from "./helpers/api";
import { countVisibleCapabilities, getCapabilityBySlug } from "./helpers/db";
import { ADMIN_EMAIL, USER_EMAIL } from "./helpers/env";
import { gotoReady } from "./helpers/nav";
import { sessionCookie } from "./helpers/session";

test.describe("C. Kết nối (connection config)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([sessionCookie(USER_EMAIL, false)]);
  });

  test("logged-in detail page: config block unlocked with endpoint/snippet to copy", async ({
    page,
  }) => {
    const capability = getCapabilityBySlug("dat-ve-may-bay");

    await gotoReady(page, "/mcp/dat-ve-may-bay");
    await expect(page.getByRole("heading", { name: "Config kết nối" })).toBeVisible();
    await expect(page.locator("pre")).toContainText(capability.configSnippet);
    await expect(page.getByRole("button", { name: "Sao chép" })).toBeVisible();
  });

  test("Copy button copies the snippet to the clipboard and shows a toast", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const capability = getCapabilityBySlug("dat-ve-may-bay");

    await gotoReady(page, "/mcp/dat-ve-may-bay");
    await page.getByRole("button", { name: "Sao chép" }).click();

    await expect(page.getByRole("status")).toHaveText("Đã sao chép");
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(capability.configSnippet);
  });

  test("/account shows connection info for every visible capability in one place", async ({
    page,
  }) => {
    const visibleCount = countVisibleCapabilities();

    await gotoReady(page, "/account");
    await expect(page.getByRole("heading", { name: "Thông tin kết nối" })).toBeVisible();
    // One "Config kết nối" block per visible capability, all on this single page.
    await expect(page.getByRole("heading", { name: "Config kết nối" })).toHaveCount(visibleCount);
  });

  test("Admin-published config changes show up after the user reloads", async ({ page }) => {
    const adminApi = await newAuthedApiContext(ADMIN_EMAIL, true);
    const newSnippet = `e2e-updated-config-${Date.now()}`;
    let capabilityId = "";
    let originalConfigSnippet = "";

    try {
      const listResponse = await adminApi.get("/api/admin/capabilities");
      const { capabilities } = (await listResponse.json()) as {
        capabilities: Record<string, unknown>[];
      };
      const target = capabilities.find((c) => c.slug === "dat-ve-tau")!;
      capabilityId = target.id as string;
      originalConfigSnippet = target.configSnippet as string;

      const patchResponse = await adminApi.patch(`/api/admin/capabilities/${capabilityId}`, {
        data: { ...target, configSnippet: newSnippet },
      });
      expect(patchResponse.ok()).toBeTruthy();

      await gotoReady(page, "/mcp/dat-ve-tau");
      await expect(page.locator("pre")).toContainText(newSnippet);
    } finally {
      if (capabilityId) {
        const listResponse = await adminApi.get(`/api/admin/capabilities/${capabilityId}`);
        const { capability } = (await listResponse.json()) as { capability: Record<string, unknown> };
        await adminApi.patch(`/api/admin/capabilities/${capabilityId}`, {
          data: { ...capability, configSnippet: originalConfigSnippet },
        });
      }
      await adminApi.dispose();
    }
  });

  test("no API key create/revoke control — only a 'Sắp có' placeholder", async ({ page }) => {
    await gotoReady(page, "/account");
    await expect(page.getByRole("heading", { name: "API key" })).toBeVisible();
    await expect(page.getByText("Sắp có").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /tạo.*api key/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /thu hồi/i })).toHaveCount(0);
  });
});
