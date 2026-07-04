/**
 * Small display badges for the admin capability list (spec section E). Plain
 * server-renderable components (no hooks, no "use client") so the list page
 * can stay a Server Component.
 */
import {
  CAPABILITY_STATUS_LABELS,
  CAPABILITY_TYPE_LABELS,
  VERTICAL_LABELS,
} from "./labels";
import type { CapabilityStatusValue, CapabilityTypeValue, VerticalValue } from "./validate";

export function TypeBadge({ type }: { type: CapabilityTypeValue }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600">
      {CAPABILITY_TYPE_LABELS[type]}
    </span>
  );
}

export function StatusBadge({ status }: { status: CapabilityStatusValue }) {
  const isVisible = status === "VISIBLE";
  return (
    <span
      className={
        isVisible
          ? "inline-flex items-center rounded-full bg-success-light px-2.5 py-0.5 text-xs font-medium text-success-dark"
          : "inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-0.5 text-xs font-medium text-foreground/60"
      }
    >
      {CAPABILITY_STATUS_LABELS[status]}
    </span>
  );
}

export function VerticalLabel({ vertical }: { vertical: VerticalValue }) {
  return <span>{VERTICAL_LABELS[vertical]}</span>;
}
