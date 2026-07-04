/**
 * MoMo Design System tokens for TLAC Open Platform.
 *
 * Source of truth for the color / radius / typography values mirrored in the
 * Tailwind v4 CSS-first theme (`app/globals.css` `@theme` block). Keep the two
 * in sync when either changes.
 *
 * NOTE: the pink scale below is derived from the required brand base
 * (`#eb2f96`, per spec/tlac-open-platform-v1.md section G) using a standard
 * tint/shade ramp. Pixel-perfect component values must still be verified
 * against the MoMo Figma UI Kit before shipping visual work (see spec
 * "Ghi chú / ràng buộc").
 */

export const primary = {
  50: "#fdf1f8",
  100: "#fbdcee",
  200: "#f8b8dd",
  300: "#f386c2",
  400: "#ee4fa8",
  500: "#eb2f96",
  600: "#c92277",
  700: "#a01a5f",
  800: "#781449",
  900: "#500d31",
} as const;

export const status = {
  success: {
    light: "#ecfdf5",
    base: "#17a479",
    dark: "#0d6b4f",
  },
  error: {
    light: "#fef2f2",
    base: "#d92d20",
    dark: "#8f1c13",
  },
  warning: {
    light: "#fffaeb",
    base: "#f79009",
    dark: "#93530b",
  },
  info: {
    light: "#eff6ff",
    base: "#2970ff",
    dark: "#1a48b0",
  },
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;

export const fontSans =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, sans-serif';

export const designTokens = {
  color: {
    primary,
    status,
  },
  radius,
  font: {
    sans: fontSans,
  },
} as const;

export type DesignTokens = typeof designTokens;

export default designTokens;
