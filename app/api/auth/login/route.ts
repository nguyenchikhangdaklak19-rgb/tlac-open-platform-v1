import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { issueOtp, OtpRateLimitError } from "@/lib/otp";

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

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      {
        error: "not_registered",
        message: "Email chưa đăng ký. Vui lòng đăng ký tài khoản.",
      },
      { status: 404 },
    );
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error: "not_verified",
        message:
          "Email chưa được xác thực. Vui lòng xác thực email trước khi đăng nhập.",
      },
      { status: 403 },
    );
  }

  try {
    const { code } = await issueOtp(prisma, email);
    await sendOtpEmail({ email, code });
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      return NextResponse.json(
        { error: "rate_limited", message: error.message },
        { status: 429 },
      );
    }
    throw error;
  }

  return NextResponse.json({
    ok: true,
    email,
    redirectTo: `/verify?email=${encodeURIComponent(email)}&purpose=login`,
  });
}
