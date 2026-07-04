/**
 * Quick Hiển thị/Ẩn toggle for the admin list page (spec section E). Flips
 * `status` between VISIBLE and HIDDEN without touching any other field.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireAdmin } from "@/components/admin/require-admin";
import { toggleCapabilityStatus } from "@/components/admin/service";

const FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "forbidden", message: FORBIDDEN_MESSAGE }, { status: 403 });
  }

  const { id } = await params;
  const result = await toggleCapabilityStatus(prisma, id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ capability: result.data });
}
