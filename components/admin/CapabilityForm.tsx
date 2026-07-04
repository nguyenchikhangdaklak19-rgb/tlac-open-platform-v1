"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CAPABILITY_STATUS_LABELS, CAPABILITY_TYPE_LABELS, VERTICAL_LABELS } from "./labels";
import {
  CAPABILITY_STATUSES,
  CAPABILITY_TYPES,
  VERTICALS,
  hasFieldErrors,
  validateCapabilityInput,
  type CapabilityFieldErrors,
  type CapabilityInput,
} from "./validate";

export type CapabilityFormProps = {
  mode: "create" | "edit";
  capabilityId?: string;
  initialValues?: Partial<CapabilityInput>;
};

const DEFAULT_VALUES: CapabilityInput = {
  name: "",
  type: "MCP",
  vertical: "TRAVEL",
  slug: "",
  shortDesc: "",
  longDesc: "",
  toolSchema: "",
  examples: "",
  configSnippet: "",
  status: "VISIBLE",
};

/**
 * Create/edit form for a Capability (spec section E, item 3). Shared by
 * `app/admin/new/page.tsx` and `app/admin/[id]/edit/page.tsx`.
 *
 * Validation runs client-side via the shared `validateCapabilityInput` before
 * ever calling the API (blocks submit + shows inline Vietnamese errors per
 * field), and the API re-validates the same way server-side — so a request
 * sent some other way (or a duplicate slug race) still surfaces a proper
 * per-field error here instead of a raw failure.
 */
export default function CapabilityForm({ mode, capabilityId, initialValues }: CapabilityFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CapabilityInput>({ ...DEFAULT_VALUES, ...initialValues });
  const [fieldErrors, setFieldErrors] = useState<CapabilityFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof CapabilityInput>(key: K, value: CapabilityInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateCapabilityInput(values);
    if (hasFieldErrors(errors)) {
      setFieldErrors(errors);
      setFormError("Vui lòng kiểm tra lại các trường được đánh dấu lỗi bên dưới.");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint =
        mode === "create" ? "/api/admin/capabilities" : `/api/admin/capabilities/${capabilityId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (data?.fields) {
          setFieldErrors(data.fields as CapabilityFieldErrors);
        }
        setFormError(data?.message ?? "Không lưu được năng lực. Vui lòng thử lại.");
        return;
      }

      router.push("/admin?saved=1");
      router.refresh();
    } catch {
      setFormError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Tên năng lực
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Ví dụ: Đặt vé máy bay"
            aria-invalid={fieldErrors.name ? true : undefined}
          />
          {fieldErrors.name ? <p className="mt-1.5 text-sm text-error">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-foreground">
            Loại
          </label>
          <select
            id="type"
            name="type"
            value={values.type}
            onChange={(event) => setField("type", event.target.value as CapabilityInput["type"])}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {CAPABILITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {CAPABILITY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {fieldErrors.type ? <p className="mt-1.5 text-sm text-error">{fieldErrors.type}</p> : null}
          {values.type === "SKILL" ? (
            <p className="mt-1.5 text-sm text-foreground/60">
              Lưu ý: trang công khai /skills vẫn hiển thị &quot;Sắp ra mắt&quot; ở v1 — tạo
              trước ở đây, chưa publish công khai.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="vertical" className="block text-sm font-medium text-foreground">
            Vertical
          </label>
          <select
            id="vertical"
            name="vertical"
            value={values.vertical}
            onChange={(event) =>
              setField("vertical", event.target.value as CapabilityInput["vertical"])
            }
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {VERTICALS.map((vertical) => (
              <option key={vertical} value={vertical}>
                {VERTICAL_LABELS[vertical]}
              </option>
            ))}
          </select>
          {fieldErrors.vertical ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.vertical}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="slug" className="block text-sm font-medium text-foreground">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={values.slug}
            onChange={(event) => setField("slug", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="dat-ve-may-bay"
            aria-invalid={fieldErrors.slug ? true : undefined}
          />
          <p className="mt-1.5 text-sm text-foreground/60">
            Chỉ chữ thường, số và dấu gạch ngang; dùng trong URL /mcp/&lt;slug&gt; và phải
            là duy nhất.
          </p>
          {fieldErrors.slug ? <p className="mt-1.5 text-sm text-error">{fieldErrors.slug}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="shortDesc" className="block text-sm font-medium text-foreground">
            Mô tả ngắn
          </label>
          <input
            id="shortDesc"
            name="shortDesc"
            type="text"
            value={values.shortDesc}
            onChange={(event) => setField("shortDesc", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Hiện ở card danh mục, tối đa 1-2 câu"
            aria-invalid={fieldErrors.shortDesc ? true : undefined}
          />
          {fieldErrors.shortDesc ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.shortDesc}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="longDesc" className="block text-sm font-medium text-foreground">
            Mô tả dài / docs
          </label>
          <textarea
            id="longDesc"
            name="longDesc"
            rows={5}
            value={values.longDesc}
            onChange={(event) => setField("longDesc", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Nội dung đầy đủ hiển thị ở trang chi tiết năng lực"
          />
          {fieldErrors.longDesc ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.longDesc}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="toolSchema" className="block text-sm font-medium text-foreground">
            Tool schema
          </label>
          <textarea
            id="toolSchema"
            name="toolSchema"
            rows={6}
            value={values.toolSchema}
            onChange={(event) => setField("toolSchema", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 font-mono text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder='JSON mô tả tool + input/output schema, ví dụ: [{"name": "search_flights", ...}]'
          />
          <p className="mt-1.5 text-sm text-foreground/60">
            Để trống hoặc nhập JSON hợp lệ — đây là schema hiển thị công khai, không phải
            cấu hình runtime.
          </p>
          {fieldErrors.toolSchema ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.toolSchema}</p>
          ) : null}

          <div className="mt-3 rounded-lg bg-info-light px-3.5 py-2.5 text-sm text-info-dark">
            Cấu hình runtime MCP server (endpoint, params, auth) — Phase sau. CMS v1 chỉ
            chỉnh nội dung hiển thị.
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="examples" className="block text-sm font-medium text-foreground">
            Ví dụ
          </label>
          <textarea
            id="examples"
            name="examples"
            rows={4}
            value={values.examples}
            onChange={(event) => setField("examples", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Ví dụ gọi tool, hiển thị ở trang chi tiết"
          />
          {fieldErrors.examples ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.examples}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="configSnippet" className="block text-sm font-medium text-foreground">
            Config snippet
          </label>
          <textarea
            id="configSnippet"
            name="configSnippet"
            rows={5}
            value={values.configSnippet}
            onChange={(event) => setField("configSnippet", event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 font-mono text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Nội dung copy-paste cho user đã đăng nhập ở trang chi tiết / /account"
          />
          {fieldErrors.configSnippet ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.configSnippet}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground">
            Trạng thái
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={(event) => setField("status", event.target.value as CapabilityInput["status"])}
            className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {CAPABILITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CAPABILITY_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {fieldErrors.status ? (
            <p className="mt-1.5 text-sm text-error">{fieldErrors.status}</p>
          ) : null}
        </div>
      </div>

      {formError ? (
        <p className="rounded-lg bg-error-light px-3.5 py-2.5 text-sm text-error-dark">{formError}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Đang lưu..." : "Lưu năng lực"}
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-full border border-primary-200 px-6 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
        >
          Hủy
        </Link>
      </div>
    </form>
  );
}
