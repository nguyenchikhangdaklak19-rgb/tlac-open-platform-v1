/**
 * Vietnamese display labels for Admin CMS enums (spec section E).
 *
 * Kept separate from `validate.ts` so both the form UI and the list page can
 * import just the labels without pulling in validation logic.
 */
import type { CapabilityStatusValue, CapabilityTypeValue, VerticalValue } from "./validate";

export const VERTICAL_LABELS: Record<VerticalValue, string> = {
  TRAVEL: "Du lịch",
  PHIM: "Phim",
  FNB: "F&B",
  PROMOTION: "Khuyến mãi",
};

export const CAPABILITY_TYPE_LABELS: Record<CapabilityTypeValue, string> = {
  MCP: "MCP",
  SKILL: "Skill",
};

export const CAPABILITY_STATUS_LABELS: Record<CapabilityStatusValue, string> = {
  VISIBLE: "Hiển thị",
  HIDDEN: "Ẩn",
};
