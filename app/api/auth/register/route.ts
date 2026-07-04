import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { OtpRateLimitError, registerAndIssueOtp } from "@/lib/otp";

// Same permissive-but-strict pattern as the client-side check in the
// register page — kept in sync deliberately (see app/(auth)/register/page.tsx).
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

  const rawEmail =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : undefined;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Email không đúng định dạng." },
      { status: 400 },
    );
  }

  let result;
  try {
    result = await registerAndIssueOtp(prisma, email);
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", message: error.message },
        { status: 429 },
      );
    }
    throw error;
  }

  if (result.status === "already_verified") {
    return NextResponse.json(
      {
        error: "already_registered",
        message: "Email này đã đăng ký và xác thực. Vui lòng đăng nhập.",
      },
      { status: 409 },
    );
  }

  await sendOtpEmail({ email, code: result.code });

  return NextResponse.json({
    ok: true,
    email,
    redirectTo: `/verify?email=${encodeURIComponent(email)}&purpose=register`,
  });
}
