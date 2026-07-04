"use client";

/**
 * Client-side copy control for the connection config (spec section C).
 * Deliberately dependency-free: `navigator.clipboard` + a small bit of local
 * state for the "Đã sao chép" toast, no new package.
 */
import { useState } from "react";

export type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or permission denied — fail silently,
      // the snippet is still selectable/copyable by hand from the <pre>.
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-full bg-primary-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
      >
        Sao chép
      </button>
      {copied ? (
        <span
          role="status"
          className="rounded-full bg-success-light px-3 py-1 text-xs font-medium text-success-dark"
        >
          Đã sao chép
        </span>
      ) : null}
    </div>
  );
}
