"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CapabilityStatusValue } from "./validate";

/**
 * Quick Hiển thị/Ẩn toggle on the admin list page (spec section E). Posts to
 * the toggle-status API, then `router.refresh()`s the (Server Component)
 * list page so the new status shows immediately — no client-side cache to
 * invalidate, matches the "no extra caching" rule for admin/public content.
 */
export default function ToggleStatusButton({
  id,
  status,
}: {
  id: string;
  status: CapabilityStatusValue;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actionLabel = status === "VISIBLE" ? "Ẩn năng lực này" : "Hiển thị năng lực này";

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/capabilities/${id}/toggle-status`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.message ?? "Không đổi được trạng thái. Vui lòng thử lại.");
        return;
      }
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang cập nhật..." : actionLabel}
      </button>
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </div>
  );
}
