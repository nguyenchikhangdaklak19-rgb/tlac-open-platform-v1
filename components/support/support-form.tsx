"use client";

import { useState, type FormEvent } from "react";

// Kept in sync with lib/webhook.ts's `validateSupportInput` — this blocks
// submission (and the network call) client-side on bad email format, mirroring
// the pattern used by app/(auth)/register/page.tsx.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_TYPES = [
  "Không kết nối được",
  "Lỗi khi gọi tool",
  "Sai nội dung/tài liệu",
  "Khác",
] as const;

export type SupportFormCapability = {
  slug: string;
  name: string;
};

type FieldErrors = {
  capabilityName?: string;
  errorType?: string;
  description?: string;
  contactEmail?: string;
};

export type SupportFormProps = {
  capabilities: SupportFormCapability[];
  defaultEmail: string;
  defaultCapabilitySlug?: string;
};

export default function SupportForm({
  capabilities,
  defaultEmail,
  defaultCapabilitySlug,
}: SupportFormProps) {
  const initialSlug =
    defaultCapabilitySlug &&
    capabilities.some((capability) => capability.slug === defaultCapabilitySlug)
      ? defaultCapabilitySlug
      : (capabilities[0]?.slug ?? "");

  const [capabilitySlug, setCapabilitySlug] = useState(initialSlug);
  const [errorType, setErrorType] = useState<string>(ERROR_TYPES[0]);
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const capability = capabilities.find((item) => item.slug === capabilitySlug);

    if (!capability) {
      errors.capabilityName = "Vui lòng chọn năng lực liên quan.";
    }
    if (!errorType) {
      errors.errorType = "Vui lòng chọn loại lỗi.";
    }
    if (!description.trim()) {
      errors.description = "Vui lòng mô tả vấn đề bạn gặp phải.";
    }
    const trimmedEmail = contactEmail.trim();
    if (!trimmedEmail) {
      errors.contactEmail = "Vui lòng nhập email liên hệ.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.contactEmail = "Email không đúng định dạng.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccess(false);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const capability = capabilities.find((item) => item.slug === capabilitySlug);

    setSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilityName: capability?.name ?? "",
          errorType,
          description: description.trim(),
          contactEmail: contactEmail.trim(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          fieldErrors?: FieldErrors;
        };
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setFormError(
          data.message ?? "Gửi yêu cầu thất bại. Vui lòng thử lại.",
        );
        return;
      }

      setSuccess(true);
      setDescription("");
      setFieldErrors({});
    } catch {
      // Network error — keep all entered values intact so the user doesn't
      // have to retype anything before retrying (spec: "giữ nguyên nội dung
      // đã nhập").
      setFormError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <div>
        <label
          htmlFor="capability"
          className="block text-sm font-medium text-foreground"
        >
          Năng lực liên quan
        </label>
        <select
          id="capability"
          name="capability"
          value={capabilitySlug}
          onChange={(event) => {
            setCapabilitySlug(event.target.value);
            setFieldErrors((prev) => ({ ...prev, capabilityName: undefined }));
          }}
          className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-invalid={fieldErrors.capabilityName ? true : undefined}
        >
          {capabilities.length === 0 ? (
            <option value="">Chưa có năng lực nào</option>
          ) : null}
          {capabilities.map((capability) => (
            <option key={capability.slug} value={capability.slug}>
              {capability.name}
            </option>
          ))}
        </select>
        {fieldErrors.capabilityName ? (
          <p className="mt-1.5 text-sm text-error">
            {fieldErrors.capabilityName}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="errorType"
          className="block text-sm font-medium text-foreground"
        >
          Loại lỗi
        </label>
        <select
          id="errorType"
          name="errorType"
          value={errorType}
          onChange={(event) => {
            setErrorType(event.target.value);
            setFieldErrors((prev) => ({ ...prev, errorType: undefined }));
          }}
          className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-invalid={fieldErrors.errorType ? true : undefined}
        >
          {ERROR_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {fieldErrors.errorType ? (
          <p className="mt-1.5 text-sm text-error">{fieldErrors.errorType}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setFieldErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Mô tả chi tiết lỗi bạn gặp phải, các bước đã thử..."
          className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          aria-invalid={fieldErrors.description ? true : undefined}
        />
        {fieldErrors.description ? (
          <p className="mt-1.5 text-sm text-error">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="block text-sm font-medium text-foreground"
        >
          Email liên hệ
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          autoComplete="email"
          value={contactEmail}
          onChange={(event) => {
            setContactEmail(event.target.value);
            setFieldErrors((prev) => ({ ...prev, contactEmail: undefined }));
          }}
          className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          placeholder="ban@vidu.com"
          aria-invalid={fieldErrors.contactEmail ? true : undefined}
        />
        {fieldErrors.contactEmail ? (
          <p className="mt-1.5 text-sm text-error">
            {fieldErrors.contactEmail}
          </p>
        ) : null}
      </div>

      {success ? (
        <p className="rounded-lg bg-success-light px-3.5 py-2.5 text-sm text-success-dark">
          Đã gửi yêu cầu, team sẽ liên hệ qua email.
        </p>
      ) : null}

      {formError ? (
        <p className="rounded-lg bg-error-light px-3.5 py-2.5 text-sm text-error-dark">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Đang gửi..." : "Gửi yêu cầu hỗ trợ"}
      </button>
    </form>
  );
}
