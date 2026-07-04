import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { AccountView } from "./account-view";

/**
 * `/account` (spec section C — "Kết nối"). `middleware.ts` already redirects
 * unauthenticated requests to `/login` before this ever runs, but we call
 * `getSession()` again here anyway: defense in depth, and this is also how
 * the page gets the email to greet the user with and to know it's safe to
 * render the unlocked connection config.
 *
 * `force-dynamic` because the capability list (and each `configSnippet`) is
 * admin-managed content read fresh from the DB on every request — an Admin
 * edit must show up here on reload, same rule as `/mcp/:slug`.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tài khoản | TLAC Open Platform",
  description:
    "Xem lại thông tin kết nối, hướng dẫn sử dụng và yêu cầu hỗ trợ cho tài khoản TLAC Open Platform của bạn.",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Only ever list VISIBLE capabilities — same rule as the public catalog
  // (spec AC section A/E): an Admin-hidden capability must not surface
  // anywhere, including this "one place" connection summary.
  const capabilities = await prisma.capability.findMany({
    where: { status: "VISIBLE" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AccountView
      email={session.email}
      capabilities={capabilities.map((capability) => ({
        slug: capability.slug,
        name: capability.name,
        vertical: capability.vertical,
        configSnippet: capability.configSnippet,
      }))}
    />
  );
}
