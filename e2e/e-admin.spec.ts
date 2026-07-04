/**
 * Spec section E — Admin CMS (chỉ admin).
 *
 * Creates exactly one dedicated `e2e-`-prefixed capability for the
 * create/edit/hide assertions below. There is no DELETE endpoint for a
 * Capability (see app/api/admin/capabilities/**), so cleanup means leaving
 * it in the HIDDEN state at the end rather than removing the row — it's
 * never counted by any hard-coded "6 capabilities" assertion elsewhere
 * because those all key off the seeded slugs, not raw totals, and
 * `e2e/global-setup.ts` wipes `e2e.db` fresh on every suite run anyway.
 */
import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, USER_EMAIL } from "./helpers/env";
import { gotoReady } from "./helpers/nav";
import { sessionCookie } from "./helpers/session";

const UNIQUE_SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const E2E_SLUG = `e2e-admin-capability-${UNIQUE_SUFFIX}`;
const E2E_NAME = `E2E Admin Capability ${UNIQUE_SUFFIX}`;

test.describe("E. Admin CMS", () => {
  test("non-admin user is blocked from /admin", async ({ page, context }) => {
    await context.addCookies([sessionCookie(USER_EMAIL, false)]);
    const response = await gotoReady(page, "/admin");
    expect(response?.status()).toBe(403);
    await expect(page.getByText("Không có quyền truy cập trang quản trị").first()).toBeVisible();
  });

  test("admin sees the capability list with Hiển thị/Ẩn statuses", async ({ page, context }) => {
    await context.addCookies([sessionCookie(ADMIN_EMAIL, true)]);
    await gotoReady(page, "/admin");
    await expect(page.getByRole("heading", { name: "Quản lý năng lực" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Trạng thái" })).toBeVisible();
    await expect(page.getByText("Hiển thị").first()).toBeVisible();
  });

  test("creating with a missing required field (tên) blocks save and shows a field error", async ({
    page,
    context,
  }) => {
    await context.addCookies([sessionCookie(ADMIN_EMAIL, true)]);
    await gotoReady(page, "/admin/new");

    // Leave "Tên năng lực" empty; fill the rest so the only failure is the name.
    await page.getByLabel("Slug").fill(`e2e-missing-name-${UNIQUE_SUFFIX}`);
    await page.getByLabel("Mô tả ngắn").fill("Mô tả ngắn cho test thiếu tên.");
    await page.getByRole("button", { name: "Lưu năng lực" }).click();

    await expect(page.getByText("Vui lòng nhập tên năng lực.").first()).toBeVisible();
    await expect(page).toHaveURL("/admin/new");
  });

  test("no runtime-config fields — only 'Phase sau' note for endpoint/params/auth", async ({
    page,
    context,
  }) => {
    await context.addCookies([sessionCookie(ADMIN_EMAIL, true)]);
    await gotoReady(page, "/admin/new");

    await expect(page.getByText(/Phase sau/).first()).toBeVisible();
    await expect(page.locator('input[name="endpoint"]')).toHaveCount(0);
    await expect(page.locator('input[name="authKey"]')).toHaveCount(0);
    await expect(page.locator('input[name="apiKey"]')).toHaveCount(0);
  });

  test("create -> edit -> hide lifecycle for a dedicated e2e- capability", async ({
    page,
    context,
  }) => {
    await context.addCookies([sessionCookie(ADMIN_EMAIL, true)]);

    // 1) Create with a full set of fields, dedicated e2e- slug.
    await gotoReady(page, "/admin/new");
    await page.getByLabel("Tên năng lực").fill(E2E_NAME);
    await page.getByLabel("Loại", { exact: true }).selectOption("MCP");
    await page.getByLabel("Vertical").selectOption("TRAVEL");
    await page.getByLabel("Slug").fill(E2E_SLUG);
    await page.getByLabel("Mô tả ngắn").fill("Mô tả ngắn ban đầu cho e2e admin test.");
    await page.getByLabel("Trạng thái").selectOption("VISIBLE");
    await page.getByRole("button", { name: "Lưu năng lực" }).click();

    await expect(page).toHaveURL("/admin?saved=1");
    await expect(page.getByText(E2E_NAME).first()).toBeVisible();

    // Appears in the public catalog too (search by name).
    await gotoReady(page, `/mcp?q=${encodeURIComponent(E2E_NAME)}`);
    await expect(page.getByText(E2E_NAME).first()).toBeVisible();

    // 2) Edit shortDesc — public page reflects it after reload.
    await gotoReady(page, "/admin");
    const row = page.getByRole("row", { name: new RegExp(E2E_NAME) });
    await row.getByRole("link", { name: "Sửa" }).click();

    await expect(page.getByRole("heading", { name: `Sửa năng lực: ${E2E_NAME}` })).toBeVisible();
    const updatedShortDesc = `Mô tả ngắn đã cập nhật ${UNIQUE_SUFFIX}`;
    await page.getByLabel("Mô tả ngắn").fill(updatedShortDesc);
    await page.getByRole("button", { name: "Lưu năng lực" }).click();
    await expect(page).toHaveURL("/admin?saved=1");

    await gotoReady(page, `/mcp/${E2E_SLUG}`);
    await expect(page.getByText(updatedShortDesc).first()).toBeVisible();

    // 3) Toggle Ẩn — disappears from the public catalog and its detail 404s.
    await gotoReady(page, "/admin");
    const toggleRow = page.getByRole("row", { name: new RegExp(E2E_NAME) });
    await toggleRow.getByRole("button", { name: "Ẩn năng lực này" }).click();
    await expect(toggleRow.getByText("Ẩn", { exact: true })).toBeVisible();

    const hiddenDetailResponse = await gotoReady(page, `/mcp/${E2E_SLUG}`);
    expect(hiddenDetailResponse?.status()).toBe(404);

    await gotoReady(page, `/mcp?q=${encodeURIComponent(E2E_NAME)}`);
    await expect(page.getByText("Không tìm thấy năng lực").first()).toBeVisible();
  });
});
