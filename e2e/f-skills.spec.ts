/**
 * Spec section F — Skills placeholder.
 *
 * `/skills` is a fully static "Sắp ra mắt" page (app/skills/page.tsx never
 * queries the DB, by design — see its file comment) so it must stay
 * unchanged even after Admin creates a SKILL capability in the CMS.
 */
import { test, expect } from "@playwright/test";
import { newAuthedApiContext } from "./helpers/api";
import { ADMIN_EMAIL } from "./helpers/env";
import { gotoReady } from "./helpers/nav";

test.describe("F. Skills placeholder", () => {
  test("/skills (public) shows 'Sắp ra mắt', no error, no blank page", async ({ page }) => {
    const response = await gotoReady(page, "/skills");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByText("Sắp ra mắt").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Skills đang được chuẩn bị" }),
    ).toBeVisible();
  });

  test("Admin creating a SKILL entry doesn't change the public placeholder", async ({ page }) => {
    const adminApi = await newAuthedApiContext(ADMIN_EMAIL, true);
    try {
      const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      const createResponse = await adminApi.post("/api/admin/capabilities", {
        data: {
          name: `E2E Skill ${suffix}`,
          type: "SKILL",
          vertical: "FNB",
          slug: `e2e-skill-${suffix}`,
          shortDesc: "Skill nội bộ do E2E tạo trước, chưa publish.",
          longDesc: "",
          toolSchema: "",
          examples: "",
          configSnippet: "",
          status: "VISIBLE",
        },
      });
      expect(createResponse.ok()).toBeTruthy();

      const response = await gotoReady(page, "/skills");
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByText("Sắp ra mắt").first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Skills đang được chuẩn bị" }),
      ).toBeVisible();
    } finally {
      await adminApi.dispose();
    }
  });
});
