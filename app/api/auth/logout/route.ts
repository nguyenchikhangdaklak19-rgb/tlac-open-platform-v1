import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(): Promise<Response> {
  await destroySession();
  return NextResponse.json({ ok: true });
}
