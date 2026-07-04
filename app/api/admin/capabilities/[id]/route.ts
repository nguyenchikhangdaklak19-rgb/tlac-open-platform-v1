/**
 * Admin CMS single-capability endpoint (spec section E). See
 * `app/api/admin/capabilities/route.ts` for why this route re-checks admin
 * itself rather than relying on `middleware.ts` (its matcher doesn't cover
 * `/api/*`).
 *
 * GET   -> fetch one capability (used by the edit form as a fallback / for
 *          tooling; the edit page itself reads Prisma directly).
 * PATCH -> update a capability's content fields.
 * PUT   -> alias of PATCH (spec allows either verb for "update by id").
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireAdmin } from "@/components/admin/require-admin";
import { getCapabilityById, updateCapability } from "@/components/admin/service";

const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "forbidden", message: FORBIDDEN_MESSAGE }, { status: 403 });
  }

  const { id } = await params;
  const capability = await getCapabilityById(prisma, id);
  if (!capability) {
    return NextResponse.json(
      { error: "not_found", message: "Không tìm thấy năng lực." },
      { status: 404 },
    );
  }

  return NextResponse.json({ capability });
}

async function handleUpdate(request: Request, { params }: RouteContext): Promise<Response> {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "forbidden", message: FORBIDDEN_MESSAGE }, { status: 403 });
  }

  const { id } = await params;

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
  const result = await updateCapability(prisma, id, input as Partial<Record<string, unknown>>);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message, fields: result.fields },
      { status: result.status },
    );
  }

  return NextResponse.json({ capability: result.data });
}

export const PATCH = handleUpdate;
export const PUT = handleUpdate;
