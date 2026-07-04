/**
 * Admin CMS capability collection endpoint (spec section E).
 *
 * GET  -> list every capability (MCP + Skill, Visible + Hidden).
 * POST -> create a capability.
 *
 * `middleware.ts` already gates `/api/admin/*`... actually it doesn't (its
 * matcher only covers page routes `/account/:path*` and `/admin/:path*`), so
 * this route is the *only* line of defense for the API surface: every
 * handler re-checks `getSession()` + `requireAdmin()` before touching
 * Prisma, and returns a 403 JSON body (not the plaintext middleware gives
 * pages) for non-admins.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireAdmin } from "@/components/admin/require-admin";
import { createCapability, listCapabilities } from "@/components/admin/service";

const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "forbidden", message: FORBIDDEN_MESSAGE }, { status: 403 });
  }

  const capabilities = await listCapabilities(prisma);
  return NextResponse.json({ capabilities });
}

export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "forbidden", message: FORBIDDEN_MESSAGE }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const input = typeof body === "object" && body !== null ? body : {};
  const result = await createCapability(
    prisma,
    input as Partial<Record<string, unknown>>,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message, fields: result.fields },
      { status: result.status },
    );
  }

  return NextResponse.json({ capability: result.data }, { status: 201 });
}
