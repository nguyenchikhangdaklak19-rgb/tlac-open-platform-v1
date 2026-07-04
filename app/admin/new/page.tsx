import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import CapabilityForm from "@/components/admin/CapabilityForm";
import Forbidden from "@/components/admin/Forbidden";
import { requireAdmin } from "@/components/admin/require-admin";

export const metadata: Metadata = {
  title: "Tạo năng lực mới | TLAC Open Platform",
};

export const dynamic = "force-dynamic";

/** Create-capability page (spec section E, item 3). */
export default async function NewCapabilityPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!requireAdmin(session)) {
    return <Forbidden />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
        Tạo năng lực mới
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Điền nội dung hiển thị cho năng lực MCP hoặc Skill. Cấu hình runtime (endpoint,
        params, auth) chưa có ở v1.
      </p>
      <CapabilityForm mode="create" />
    </div>
  );
}
