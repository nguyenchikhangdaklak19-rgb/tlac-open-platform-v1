import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatSlackPayload,
  sendSupportRequest,
  validateSupportInput,
  WebhookError,
  type SupportRequestPayload,
} from "@/lib/webhook";

const samplePayload: SupportRequestPayload = {
  capabilityName: "Đặt vé máy bay",
  errorType: "Lỗi khi gọi tool",
  description: "Gọi tool book_flight bị timeout sau 30s.",
  contactEmail: "dev@vidu.com",
};

describe("validateSupportInput", () => {
  it("accepts a fully-filled, valid input", () => {
    const result = validateSupportInput(samplePayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(samplePayload);
    }
  });

  it("reports every missing required field", () => {
    const result = validateSupportInput({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.capabilityName).toBeTruthy();
      expect(result.errors.errorType).toBeTruthy();
      expect(result.errors.description).toBeTruthy();
      expect(result.errors.contactEmail).toBeTruthy();
    }
  });

  it("trims whitespace-only fields and still flags them as missing", () => {
    const result = validateSupportInput({
      capabilityName: "   ",
      errorType: "  ",
      description: "   ",
      contactEmail: "   ",
    });
    expect(result.ok).toBe(false);
  });

  it("flags a badly-formatted contact email", () => {
    const result = validateSupportInput({
      ...samplePayload,
      contactEmail: "not-an-email",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.contactEmail).toMatch(/định dạng/);
      expect(result.errors.capabilityName).toBeUndefined();
    }
  });

  it("ignores non-string values instead of throwing", () => {
    const result = validateSupportInput({
      capabilityName: 42,
      errorType: null,
      description: undefined,
      contactEmail: ["a@b.com"],
    });
    expect(result.ok).toBe(false);
  });
});

describe("formatSlackPayload", () => {
  it("builds a readable Vietnamese multi-line summary with all fields", () => {
    const { text } = formatSlackPayload(samplePayload);
    expect(text).toContain(samplePayload.contactEmail);
    expect(text).toContain(samplePayload.capabilityName);
    expect(text).toContain(samplePayload.errorType);
    expect(text).toContain(samplePayload.description);
    expect(text).toMatch(/Thời gian:/);
    // Roughly ISO-8601 timestamp somewhere in the text.
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

describe("sendSupportRequest", () => {
  const originalEnv = process.env.SUPPORT_WEBHOOK_URL;

  beforeEach(() => {
    delete process.env.SUPPORT_WEBHOOK_URL;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SUPPORT_WEBHOOK_URL;
    } else {
      process.env.SUPPORT_WEBHOOK_URL = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it("logs to console and succeeds when SUPPORT_WEBHOOK_URL is unset (dev path)", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchSpy = vi.fn();

    await expect(
      sendSupportRequest(samplePayload, { fetch: fetchSpy as unknown as typeof fetch }),
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[DEV] Support request:",
      expect.stringContaining(samplePayload.contactEmail),
    );
  });

  it("posts the Slack-compatible JSON payload to the configured webhook URL", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await sendSupportRequest(samplePayload, {
      fetch: fetchSpy as unknown as typeof fetch,
      webhookUrl: "https://hooks.example.com/services/T00/B00/xyz",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://hooks.example.com/services/T00/B00/xyz");
    expect(init.method).toBe("POST");
    const parsedBody = JSON.parse(init.body as string);
    expect(parsedBody.text).toContain(samplePayload.description);
  });

  it("throws WebhookError on a non-2xx response", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response("bad", { status: 500 }));

    await expect(
      sendSupportRequest(samplePayload, {
        fetch: fetchSpy as unknown as typeof fetch,
        webhookUrl: "https://hooks.example.com/services/T00/B00/xyz",
      }),
    ).rejects.toBeInstanceOf(WebhookError);
  });

  it("throws WebhookError when the fetch call itself throws (network error / timeout)", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(
      sendSupportRequest(samplePayload, {
        fetch: fetchSpy as unknown as typeof fetch,
        webhookUrl: "https://hooks.example.com/services/T00/B00/xyz",
      }),
    ).rejects.toBeInstanceOf(WebhookError);
  });
});
