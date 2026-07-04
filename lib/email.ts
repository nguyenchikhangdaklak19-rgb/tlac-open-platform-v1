/**
 * Auth email delivery (OTP for register/login, spec section B).
 *
 * Zero SDK dependency by design: when `RESEND_API_KEY` is set we call the
 * Resend REST API directly with `fetch`; when it isn't set (local dev / UAT
 * without a provider configured) we log the code clearly to the server
 * console instead, so the flow is fully testable without any external
 * service. `sendOtpEmail` takes an optional `sender` so tests can inject a
 * fake one instead of hitting the network or stdout.
 */

export type OtpEmailParams = { email: string; code: string };
export type OtpEmailSender = (params: OtpEmailParams) => Promise<void>;

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendViaResend(params: OtpEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "TLAC Open Platform <no-reply@tlac.dev>";

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.email],
      subject: "Mã xác thực TLAC Open Platform",
      text: `Mã xác thực của bạn là ${params.code}. Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
      html: `<p>Mã xác thực của bạn là <strong>${params.code}</strong>.</p><p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}

async function logToDevConsole(params: OtpEmailParams): Promise<void> {
  // Deliberately visible/greppable in local + UAT logs when no email
  // provider is configured.
  console.log(`[DEV] OTP for ${params.email}: ${params.code}`);
}

const defaultSender: OtpEmailSender = async (params) => {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(params);
    return;
  }
  await logToDevConsole(params);
};

/** Send (or dev-log) an OTP email. Pass `sender` in tests to avoid I/O. */
export async function sendOtpEmail(
  params: OtpEmailParams,
  sender: OtpEmailSender = defaultSender,
): Promise<void> {
  await sender(params);
}
