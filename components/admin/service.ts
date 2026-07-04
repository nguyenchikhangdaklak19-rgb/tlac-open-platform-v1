/**
 * Admin CMS capability CRUD (spec section E), as plain functions over an
 * injected `PrismaClient`.
 *
 * Kept independent of `next/server`/`next/headers` so it can be exercised
 * directly in tests against a real (temp, migrated) SQLite database via
 * `createTestDb()` — no HTTP layer, no cookie mocking needed — while the
 * route handlers under `app/api/admin/capabilities/**` stay thin: parse the
 * request, call one of these, map the `ServiceResult` to a `NextResponse`.
 */
import type { Capability, Prisma, PrismaClient } from "../../prisma/generated/prisma/client";
import {
  type CapabilityFieldErrors,
  type CapabilityInput,
  hasFieldErrors,
  normalizeCapabilityInput,
  validateCapabilityInput,
} from "./validate";

export type ServiceError = {
  ok: false;
  status: number;
  error: string;
  message: string;
  fields?: CapabilityFieldErrors;
};

export type ServiceOk<T> = { ok: true; data: T };

export type ServiceResult<T> = ServiceOk<T> | ServiceError;

const VALIDATION_MESSAGE = "Vui lòng kiểm tra lại các trường được đánh dấu lỗi.";
const DUPLICATE_SLUG_MESSAGE = "Slug đã tồn tại, vui lòng chọn slug khác.";
const NOT_FOUND_MESSAGE = "Không tìm thấy năng lực.";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}

/** List every capability (both types, both statuses) for the admin list page. */
export async function listCapabilities(prisma: PrismaClient): Promise<Capability[]> {
  return prisma.capability.findMany({
    orderBy: [{ vertical: "asc" }, { name: "asc" }],
  });
}

export async function getCapabilityById(
  prisma: PrismaClient,
  id: string,
): Promise<Capability | null> {
  return prisma.capability.findUnique({ where: { id } });
}

function toCreateData(input: CapabilityInput): Prisma.CapabilityCreateInput {
  return { ...input };
}

/** Validate + create a capability. Returns field errors (400) or a duplicate-slug conflict (409). */
export async function createCapability(
  prisma: PrismaClient,
  rawInput: Partial<Record<keyof CapabilityInput, unknown>>,
): Promise<ServiceResult<Capability>> {
  const errors = validateCapabilityInput(rawInput);
  if (hasFieldErrors(errors)) {
    return { ok: false, status: 400, error: "validation", message: VALIDATION_MESSAGE, fields: errors };
  }

  const data = normalizeCapabilityInput(rawInput);
  try {
    const created = await prisma.capability.create({ data: toCreateData(data) });
    return { ok: true, data: created };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        status: 409,
        error: "duplicate_slug",
        message: DUPLICATE_SLUG_MESSAGE,
        fields: { slug: DUPLICATE_SLUG_MESSAGE },
      };
    }
    throw error;
  }
}

/** Validate + update a capability by id. 404 if missing, 400 on validation, 409 on duplicate slug. */
export async function updateCapability(
  prisma: PrismaClient,
  id: string,
  rawInput: Partial<Record<keyof CapabilityInput, unknown>>,
): Promise<ServiceResult<Capability>> {
  const errors = validateCapabilityInput(rawInput);
  if (hasFieldErrors(errors)) {
    return { ok: false, status: 400, error: "validation", message: VALIDATION_MESSAGE, fields: errors };
  }

  const data = normalizeCapabilityInput(rawInput);
  try {
    const updated = await prisma.capability.update({ where: { id }, data: { ...data } });
    return { ok: true, data: updated };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        status: 409,
        error: "duplicate_slug",
        message: DUPLICATE_SLUG_MESSAGE,
        fields: { slug: DUPLICATE_SLUG_MESSAGE },
      };
    }
    if (isNotFoundError(error)) {
      return { ok: false, status: 404, error: "not_found", message: NOT_FOUND_MESSAGE };
    }
    throw error;
  }
}

/** Flip VISIBLE <-> HIDDEN for a capability. 404 if the id doesn't exist. */
export async function toggleCapabilityStatus(
  prisma: PrismaClient,
  id: string,
): Promise<ServiceResult<Capability>> {
  const existing = await prisma.capability.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, status: 404, error: "not_found", message: NOT_FOUND_MESSAGE };
  }

  const updated = await prisma.capability.update({
    where: { id },
    data: { status: existing.status === "VISIBLE" ? "HIDDEN" : "VISIBLE" },
  });
  return { ok: true, data: updated };
}
