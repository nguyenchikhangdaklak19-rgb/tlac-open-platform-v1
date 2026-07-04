"use client";

/**
 * Logout control for `/account` (spec section B/C). POSTs to the existing
 * `/api/auth/logout` route (clears the session cookie server-side via
 * `destroySession()`), then does a full navigation to `/` — a hard
 * `window.location` redirect rather than the router so the header/session
 * state everywhere else in the app is guaranteed fresh, not just this page.
 */
import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-primary-200 px-5 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
