/**
 * Route guards for `/account/*` and `/admin/*` (spec section B).
 *
 * Uses `node:crypto` (via `lib/auth.ts`'s pure `verifySessionToken`) to check
 * the HMAC-signed session cookie, so this runs on the Node.js runtime rather
 * than the default Edge runtime.
 *
 * - No/invalid/expired session on `/account/*` or `/admin/*` → redirect to
 *   `/login`.
 * - Valid session but not admin on `/admin/*` → 403 (the real admin UI is a
 *   separate task's file; this is just the gate).
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAccountRoute =
    pathname === "/account" || pathname.startsWith("/account/");

  if (!isAdminRoute && !isAccountRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !session.isAdmin) {
    return new NextResponse(
      "403 — Bạn không có quyền truy cập trang quản trị.",
      {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
