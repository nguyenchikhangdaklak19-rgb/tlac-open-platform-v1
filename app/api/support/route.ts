/**
 * POST /api/support — spec section D (Yêu cầu hỗ trợ).
 *
 * Requires a logged-in session. Validates the body, then pushes the request
 * to Slack/email via `lib/webhook.ts`. v1 has **no ticket inbox** — nothing
 * here is persisted to the database; a webhook failure is the only failure
 * mode the client needs to handle (retry, keep the form filled in).
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  sendSupportRequest,
  validateSupportInput,
  WebhookError,
  type SupportRequestInput,
} from "@/lib/webhook";

export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized", message: "Vui lòng đăng nhập để gửi yêu cầu hỗ trợ." },
      { status: 401 },
    );
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

  const input: SupportRequestInput =
    typeof body === "object" && body !== null ? (body as SupportRequestInput) : {};

  const result = validateSupportInput(input);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: "invalid_input",
        message: "Vui lòng kiểm tra lại các trường bắt buộc.",
        fieldErrors: result.errors,
      },
      { status: 400 },
    );
  }

  try {
    await sendSupportRequest(result.value);
  } catch (error) {
    if (error instanceof WebhookError) {
      return NextResponse.json(
        {
          error: "webhook_failed",
          message: "Không gửi được yêu cầu hỗ trợ. Vui lòng thử lại.",
        },
        { status: 502 },
      );
    }
    throw error;
  }

  return NextResponse.json({
    ok: true,
    message: "Đã gửi yêu cầu, team sẽ liên hệ qua email.",
  });
}
