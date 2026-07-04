import { NextResponse } from "next/server";
import { createSession, isAdminEmail } from "@/lib/auth";
import prisma from "@/lib/db";
import { verifyOtp } from "@/lib/otp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Yêu cầu không hợp lệ." },
      { status: 400 },
    );
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const email =
    typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const code = typeof record.code === "string" ? record.code.trim() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Email không đúng định dạng." },
      { status: 400 },
    );
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "invalid_code", message: "Mã xác thực gồm 6 chữ số." },
      { status: 400 },
    );
  }

  const result = await verifyOtp(prisma, email, code);
  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "Mã đã hết hạn. Vui lòng gửi lại mã."
        : "Mã xác thực không đúng. Vui lòng thử lại.";
    return NextResponse.json({ error: result.reason, message }, { status: 400 });
  }

  // isAdmin is re-derived from ADMIN_EMAILS on every successful verify so an
  // account promoted/demoted via env config takes effect on next sign-in.
  const isAdmin = isAdminEmail(email);
  const user = await prisma.user.upsert({
    where: { email },
    update: { emailVerified: true, isAdmin },
    create: { email, emailVerified: true, isAdmin },
  });

  await createSession({ email: user.email, isAdmin: user.isAdmin });

  return NextResponse.json({ ok: true, redirectTo: "/account" });
}
