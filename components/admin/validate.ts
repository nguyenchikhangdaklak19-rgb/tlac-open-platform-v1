/**
 * Pure validation for the Admin CMS capability form (spec section E).
 *
 * Deliberately has no Next.js / Prisma / DOM imports so it can run both in
 * the client form (`CapabilityForm.tsx`, blocking submit + showing inline
 * Vietnamese errors) and server-side in the API route handlers (returning a
 * 400 with the same field errors) — one source of truth for "what makes a
 * capability valid," per the task brief.
 *
 * Required fields: `name`, `vertical`, `slug`, `shortDesc` — these are the
 * only fields flagged by the "missing required field" acceptance criterion
 * (spec: "Khi admin lưu mà thiếu field bắt buộc (vd tên) → chặn lưu + báo
 * field thiếu"). `type` and `status` are selects with enum defaults but are
 * still range-checked here as a defense against malformed API calls.
 * `longDesc`, `toolSchema`, `examples`, `configSnippet` are optional; when
 * `toolSchema` is non-empty it must parse as JSON.
 */

export const CAPABILITY_TYPES = ["MCP", "SKILL"] as const;
export type CapabilityTypeValue = (typeof CAPABILITY_TYPES)[number];

export const VERTICALS = ["TRAVEL", "PHIM", "FNB", "PROMOTION"] as const;
export type VerticalValue = (typeof VERTICALS)[number];

export const CAPABILITY_STATUSES = ["VISIBLE", "HIDDEN"] as const;
export type CapabilityStatusValue = (typeof CAPABILITY_STATUSES)[number];

/** Kebab-case only: lowercase letters, digits, single hyphens between groups. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CapabilityInput = {
  name: string;
  type: CapabilityTypeValue;
  vertical: VerticalValue;
  slug: string;
  shortDesc: string;
  longDesc: string;
  toolSchema: string;
  examples: string;
  configSnippet: string;
  status: CapabilityStatusValue;
};

export type CapabilityFieldErrors = Partial<Record<keyof CapabilityInput, string>>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Validate an (untrusted, `Partial`) capability payload. Returns a map of
 * field name → Vietnamese error message; an empty object means the input is
 * valid. Never throws — malformed/missing fields simply become errors.
 */
export function validateCapabilityInput(
  input: Partial<Record<keyof CapabilityInput, unknown>>,
): CapabilityFieldErrors {
  const errors: CapabilityFieldErrors = {};

  if (!isNonEmptyString(input.name)) {
    errors.name = "Vui lòng nhập tên năng lực.";
  }

  const type = input.type;
  if (typeof type !== "string" || !CAPABILITY_TYPES.includes(type as CapabilityTypeValue)) {
    errors.type = "Vui lòng chọn loại năng lực (MCP hoặc Skill).";
  }

  const vertical = input.vertical;
  if (typeof vertical !== "string" || !VERTICALS.includes(vertical as VerticalValue)) {
    errors.vertical = "Vui lòng chọn vertical.";
  }

  const slug = asString(input.slug).trim();
  if (!slug) {
    errors.slug = "Vui lòng nhập slug.";
  } else if (!SLUG_REGEX.test(slug)) {
    errors.slug =
      "Slug chỉ gồm chữ thường, số và dấu gạch ngang, ví dụ: dat-ve-may-bay.";
  }

  if (!isNonEmptyString(input.shortDesc)) {
    errors.shortDesc = "Vui lòng nhập mô tả ngắn.";
  }

  const toolSchema = asString(input.toolSchema).trim();
  if (toolSchema) {
    try {
      JSON.parse(toolSchema);
    } catch {
      errors.toolSchema = "Tool schema phải là JSON hợp lệ hoặc để trống.";
    }
  }

  const status = input.status;
  if (
    status !== undefined &&
    (typeof status !== "string" || !CAPABILITY_STATUSES.includes(status as CapabilityStatusValue))
  ) {
    errors.status = "Trạng thái không hợp lệ.";
  }

  return errors;
}

export function hasFieldErrors(errors: CapabilityFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Normalize a raw (untrusted) payload into a well-typed `CapabilityInput`,
 * trimming string fields and falling back to safe defaults for enum fields.
 * Callers must still run `validateCapabilityInput` on the *raw* input first —
 * this only shapes data for persistence once validation has passed.
 */
export function normalizeCapabilityInput(
  input: Partial<Record<keyof CapabilityInput, unknown>>,
): CapabilityInput {
  return {
    name: asString(input.name).trim(),
    type: CAPABILITY_TYPES.includes(input.type as CapabilityTypeValue)
      ? (input.type as CapabilityTypeValue)
      : "MCP",
    vertical: VERTICALS.includes(input.vertical as VerticalValue)
      ? (input.vertical as VerticalValue)
      : "TRAVEL",
    slug: asString(input.slug).trim(),
    shortDesc: asString(input.shortDesc).trim(),
    longDesc: asString(input.longDesc).trim(),
    toolSchema: asString(input.toolSchema).trim(),
    examples: asString(input.examples).trim(),
    configSnippet: asString(input.configSnippet).trim(),
    status: CAPABILITY_STATUSES.includes(input.status as CapabilityStatusValue)
      ? (input.status as CapabilityStatusValue)
      : "VISIBLE",
  };
}
