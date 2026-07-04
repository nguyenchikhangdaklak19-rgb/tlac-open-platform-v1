/**
 * Support-request webhook + validation (spec section D — Yêu cầu hỗ trợ).
 *
 * v1 has **no ticket inbox**: a support request is never persisted in the
 * database. It is only validated, formatted, and pushed to a Slack-compatible
 * incoming webhook (or logged in dev when `SUPPORT_WEBHOOK_URL` is unset).
 *
 * `sendSupportRequest` takes an injectable `fetch` so tests never hit the
 * network, and always applies a 5s timeout via `AbortSignal.timeout` so a
 * hung webhook can't hang the request handler forever.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SupportRequestPayload = {
  capabilityName: string;
  errorType: string;
  description: string;
  contactEmail: string;
};

export type SupportRequestInput = {
  capabilityName?: unknown;
  errorType?: unknown;
  description?: unknown;
  contactEmail?: unknown;
};

export type FieldErrors = Partial<
  Record<keyof SupportRequestPayload, string>
>;

export type ValidationResult =
  | { ok: true; value: SupportRequestPayload }
  | { ok: false; errors: FieldErrors };

/**
 * Pure validation shared by the API route (server-side, authoritative) and
 * exercised directly in tests. Every field is required; `contactEmail` must
 * additionally look like an email address.
 */
export function validateSupportInput(
  input: SupportRequestInput,
): ValidationResult {
  const errors: FieldErrors = {};

  const capabilityName =
    typeof input.capabilityName === "string" ? input.capabilityName.trim() : "";
  const errorType =
    typeof input.errorType === "string" ? input.errorType.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const contactEmail =
    typeof input.contactEmail === "string" ? input.contactEmail.trim() : "";

  if (!capabilityName) {
    errors.capabilityName = "Vui lòng chọn năng lực liên quan.";
  }
  if (!errorType) {
    errors.errorType = "Vui lòng chọn loại lỗi.";
  }
  if (!description) {
    errors.description = "Vui lòng mô tả vấn đề bạn gặp phải.";
  }
  if (!contactEmail) {
    errors.contactEmail = "Vui lòng nhập email liên hệ.";
  } else if (!EMAIL_REGEX.test(contactEmail)) {
    errors.contactEmail = "Email không đúng định dạng.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { capabilityName, errorType, description, contactEmail },
  };
}

/** Thrown when the webhook call fails (non-2xx, network error, or timeout). */
export class WebhookError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "WebhookError";
  }
}

/** Build the Slack-compatible payload: a single readable Vietnamese message. */
export function formatSlackPayload(payload: SupportRequestPayload): {
  text: string;
} {
  const timestamp = new Date().toISOString();
  const text = [
    "Yêu cầu hỗ trợ mới từ TLAC Open Platform",
    `- Email liên hệ: ${payload.contactEmail}`,
    `- Năng lực liên quan: ${payload.capabilityName}`,
    `- Loại lỗi: ${payload.errorType}`,
    `- Mô tả: ${payload.description}`,
    `- Thời gian: ${timestamp}`,
  ].join("\n");

  return { text };
}

const WEBHOOK_TIMEOUT_MS = 5000;

export type FetchLike = typeof fetch;

/**
 * Send a support request to `SUPPORT_WEBHOOK_URL`. When unset (dev/test),
 * logs the payload and resolves successfully instead of calling out.
 *
 * Throws `WebhookError` on a non-2xx response, a network error, or timeout.
 */
export async function sendSupportRequest(
  payload: SupportRequestPayload,
  options?: { fetch?: FetchLike; webhookUrl?: string },
): Promise<void> {
  const webhookUrl = options?.webhookUrl ?? process.env.SUPPORT_WEBHOOK_URL;
  const doFetch = options?.fetch ?? fetch;
  const body = formatSlackPayload(payload);

  if (!webhookUrl) {
    console.log("[DEV] Support request:", body.text);
    return;
  }

  let response: Response;
  try {
    response = await doFetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
  } catch (error) {
    throw new WebhookError("Không gửi được yêu cầu hỗ trợ tới webhook.", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new WebhookError(
      `Webhook trả về lỗi (status ${response.status}).`,
    );
  }
}
