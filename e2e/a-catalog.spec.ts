/**
 * Spec section A — Catalog công khai.
 *
 * All checks here run logged-out (no session cookie) except the one hidden-
 * capability toggle, which needs a signed Admin API request to flip status
 * and restore it — see e2e/helpers/api.ts.
 */
import { test, expect } from "@playwright/test";
import { newAuthedApiContext } from "./helpers/api";
import { ADMIN_EMAIL } from "./helpers/env";
import { gotoReady } from "./helpers/nav";

const CAPABILITY_LINK_SELECTOR = 'a[href^="/mcp/"]';

test.describe("A. Catalog công khai", () => {
  test("landing page (logged out): 6 capability card + Cách kết nối 3 bước", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.getByRole("heading", { name: "Cách kết nối 3 bước" })).toBeVisible();
    await expect(page.locator(CAPABILITY_LINK_SELECTOR)).toHaveCount(6);
    // Not blocked — no redirect to /login, no 403/error shell.
    await expect(page).toHaveURL("/");
  });

  test("/mcp lists 6 items with name, vertical, mô tả ngắn, trạng thái", async ({ page }) => {
    await gotoReady(page, "/mcp");
    const cards = page.locator(CAPABILITY_LINK_SELECTOR);
    await expect(cards).toHaveCount(6);

    const firstCard = cards.first();
    // Vertical badge, status badge, name (h3), and short description all
    // render inside every card (components/catalog/capability-card.tsx).
    await expect(firstCard.getByRole("heading", { level: 3 })).toBeVisible();
    await expect(firstCard.getByText(/Hiển thị|Ẩn/).first()).toBeVisible();
  });

  test("search filters by keyword; no match shows empty state", async ({ page }) => {
    await gotoReady(page, "/mcp?q=máy+bay");
    await expect(page.locator(CAPABILITY_LINK_SELECTOR)).toHaveCount(1);
    await expect(page.getByText("Đặt vé máy bay").first()).toBeVisible();

    await gotoReady(page, "/mcp?q=khong-ton-tai-xyz-123");
    await expect(page.locator(CAPABILITY_LINK_SELECTOR)).toHaveCount(0);
    await expect(page.getByText("Không tìm thấy năng lực").first()).toBeVisible();
  });

  test("vertical filter narrows to that vertical only", async ({ page }) => {
    await gotoReady(page, "/mcp?vertical=TRAVEL");
    const cards = page.locator(CAPABILITY_LINK_SELECTOR);
    await expect(cards).toHaveCount(3);
    for (const name of ["Đặt vé máy bay", "Đặt vé tàu", "Đặt vé xe khách"]) {
      await expect(page.getByText(name).first()).toBeVisible();
    }

    await gotoReady(page, "/mcp?vertical=PROMOTION");
    await expect(cards).toHaveCount(1);
    await expect(page.getByText("Tìm kiếm voucher").first()).toBeVisible();
  });

  test("detail page shows mô tả, tool schema, ví dụ, config block", async ({ page }) => {
    await gotoReady(page, "/mcp/dat-ve-may-bay");
    await expect(page.getByRole("heading", { name: "Đặt vé máy bay" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mô tả chi tiết" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tool & schema" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ví dụ gọi" })).toBeVisible();
    // Config block is present (locked state, covered by the next test).
    await expect(page.getByText("Đăng nhập để lấy cấu hình").first()).toBeVisible();
  });

  test("detail page logged-out: config block locked with CTA, but content still readable", async ({
    page,
  }) => {
    await gotoReady(page, "/mcp/dat-ve-may-bay");
    const cta = page.getByRole("link", { name: "Đăng nhập để lấy cấu hình" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/login");
    // No "Config kết nối" heading (that's the unlocked state) and no Copy button.
    await expect(page.getByRole("heading", { name: "Config kết nối" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sao chép" })).toHaveCount(0);
    // Description/schema/examples are still readable while logged out.
    await expect(page.getByRole("heading", { name: "Mô tả chi tiết" })).toBeVisible();
  });

  test("Admin-hidden capability disappears from catalog + direct URL 404s", async ({ page }) => {
    const adminApi = await newAuthedApiContext(ADMIN_EMAIL, true);
    try {
      // Look up the id via the admin list API (no direct DB import needed).
      const listResponse = await adminApi.get("/api/admin/capabilities");
      expect(listResponse.ok()).toBeTruthy();
      const { capabilities } = (await listResponse.json()) as {
        capabilities: { id: string; slug: string; status: string }[];
      };
      const target = capabilities.find((c) => c.slug === "tim-kiem-voucher");
      expect(target).toBeTruthy();
      const id = target!.id;

      // Toggle VISIBLE -> HIDDEN.
      const toggleResponse = await adminApi.post(`/api/admin/capabilities/${id}/toggle-status`);
      expect(toggleResponse.ok()).toBeTruthy();

      await gotoReady(page, "/mcp");
      await expect(page.locator(CAPABILITY_LINK_SELECTOR)).toHaveCount(5);
      await expect(page.getByText("Tìm kiếm voucher")).toHaveCount(0);

      const detailResponse = await gotoReady(page, "/mcp/tim-kiem-voucher");
      expect(detailResponse?.status()).toBe(404);
      await expect(
        page.getByRole("heading", { name: "Năng lực không tồn tại hoặc chưa mở" }),
      ).toBeVisible();

      // Restore VISIBLE so later specs (and reruns) see the full 6-item catalog again.
      const restoreResponse = await adminApi.post(`/api/admin/capabilities/${id}/toggle-status`);
      expect(restoreResponse.ok()).toBeTruthy();

      await gotoReady(page, "/mcp");
      await expect(page.locator(CAPABILITY_LINK_SELECTOR)).toHaveCount(6);
    } finally {
      await adminApi.dispose();
    }
  });
});
