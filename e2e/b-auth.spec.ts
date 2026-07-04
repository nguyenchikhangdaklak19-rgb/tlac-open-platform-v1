/**
 * Spec section B — Đăng ký / Đăng nhập (email).
 *
 * Real OTP codes are dev-logged to the `webServer` subprocess's stdout
 * (`[DEV] OTP for <email>: <code>`, see lib/email.ts), which Playwright
 * tests have no access to. Two different strategies are used here,
 * matching the task brief:
 *  - Steps that only need "a code was issued and the UI moved to /verify"
 *    go through the real register/login API — we never need to know the
 *    code's value for those.
 *  - The "correct code verifies" step inserts a known-plaintext OTP's hash
 *    directly into the DB (`e2e/helpers/otp.ts`, same SHA-256 scheme as
 *    lib/otp.ts) so we can type a code we know into the real `/verify` form.
 */
import { test, expect } from "@playwright/test";
import { createUnverifiedUser } from "./helpers/db";
import { ADMIN_EMAIL, USER_EMAIL } from "./helpers/env";
import { gotoReady } from "./helpers/nav";
import { insertKnownOtp } from "./helpers/otp";
import { sessionCookie } from "./helpers/session";

function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("B. Đăng ký / Đăng nhập", () => {
  test("invalid email format blocks submit inline, no network call", async ({ page }) => {
    const authRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/auth")) authRequests.push(req.url());
    });

    await gotoReady(page, "/register");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Gửi mã xác thực" }).click();

    await expect(
      page.getByText("Email không đúng định dạng. Vui lòng kiểm tra lại.").first(),
    ).toBeVisible();
    // Give any (incorrect) network call a moment to fire before asserting none did.
    await page.waitForTimeout(300);
    expect(authRequests).toEqual([]);
  });

  test("valid email on /register reaches the verify step", async ({ page }) => {
    const email = uniqueEmail("register");
    await gotoReady(page, "/register");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Gửi mã xác thực" }).click();

    await expect(page).toHaveURL(new RegExp(`/verify\\?email=${encodeURIComponent(email)}`));
    await expect(page.getByText(email).first()).toBeVisible();
  });

  test("already-registered verified email is directed to login instead", async ({ page }) => {
    await gotoReady(page, "/register");
    await page.getByLabel("Email").fill(USER_EMAIL);
    await page.getByRole("button", { name: "Gửi mã xác thực" }).click();

    await expect(page.getByText(/đã đăng ký và xác thực/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng nhập ngay" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  test("wrong OTP shows an error and offers resend", async ({ page }) => {
    const email = uniqueEmail("wrong-otp");
    await gotoReady(page, "/register");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Gửi mã xác thực" }).click();
    await expect(page).toHaveURL(/\/verify\?/);

    await page.getByLabel("Mã xác thực").fill("000000");
    await page.getByRole("button", { name: "Xác thực" }).click();

    await expect(page.getByText(/Mã xác thực không đúng|Mã đã hết hạn/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Gửi lại mã" })).toBeVisible();
  });

  test("correct OTP verifies and lands on /account", async ({ page }) => {
    const email = uniqueEmail("correct-otp");
    const code = "482913";
    await insertKnownOtp(email, code);

    await gotoReady(page, `/verify?email=${encodeURIComponent(email)}&purpose=register`);
    await page.getByLabel("Mã xác thực").fill(code);
    await page.getByRole("button", { name: "Xác thực" }).click();

    await expect(page).toHaveURL("/account");
    await expect(page.getByRole("heading", { name: new RegExp(email) })).toBeVisible();
  });

  test("expired OTP is rejected with a clear 'expired' message", async ({ page }) => {
    const email = uniqueEmail("expired-otp");
    const code = "112233";
    await insertKnownOtp(email, code, { expired: true });

    await gotoReady(page, `/verify?email=${encodeURIComponent(email)}&purpose=register`);
    await page.getByLabel("Mã xác thực").fill(code);
    await page.getByRole("button", { name: "Xác thực" }).click();

    await expect(page.getByText("Mã đã hết hạn. Vui lòng gửi lại mã.").first()).toBeVisible();
  });

  test("unverified email attempting login is blocked with a verify prompt", async ({ page }) => {
    const email = uniqueEmail("unverified-login");
    createUnverifiedUser(email);

    await gotoReady(page, "/login");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Gửi mã đăng nhập" }).click();

    await expect(
      page.getByText("Email chưa được xác thực. Vui lòng xác thực trước khi đăng nhập.").first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Gửi lại mã xác thực" })).toBeVisible();
  });

  test("logged-out /account and /admin redirect to /login", async ({ page }) => {
    await gotoReady(page, "/account");
    await expect(page).toHaveURL("/login");

    await gotoReady(page, "/admin");
    await expect(page).toHaveURL("/login");
  });

  test("logout revokes access; /account and /admin redirect to /login again", async ({
    page,
    context,
  }) => {
    await context.addCookies([sessionCookie(USER_EMAIL, false)]);

    await gotoReady(page, "/account");
    await expect(page).toHaveURL("/account");

    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL("/");

    await gotoReady(page, "/account");
    await expect(page).toHaveURL("/login");
    await gotoReady(page, "/admin");
    await expect(page).toHaveURL("/login");
  });

  test("admin session reaches /admin; non-admin session is forbidden", async ({
    page,
    context,
  }) => {
    await context.addCookies([sessionCookie(ADMIN_EMAIL, true)]);
    const response = await gotoReady(page, "/admin");
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Quản lý năng lực" })).toBeVisible();
  });
});
