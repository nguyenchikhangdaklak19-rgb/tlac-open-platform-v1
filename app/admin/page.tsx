import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import Forbidden from "@/components/admin/Forbidden";
import { requireAdmin } from "@/components/admin/require-admin";
import { StatusBadge, TypeBadge, VerticalLabel } from "@/components/admin/Badges";
import ToggleStatusButton from "@/components/admin/ToggleStatusButton";
import { listCapabilities } from "@/components/admin/service";

export const metadata: Metadata = {
  title: "Quản lý năng lực | TLAC Open Platform",
};

// Session-derived content (admin list) must never be cached across requests.
export const dynamic = "force-dynamic";

/**
 * Admin CMS list page (spec section E, item 2). Lists every capability —
 * both MCP and Skill, both Hiển thị and Ẩn — unlike the public catalog which
 * only ever shows VISIBLE rows.
 *
 * Re-checks admin here even though `middleware.ts` already gates `/admin/*`
 * (see `components/admin/require-admin.ts` for why this second check
 * exists).
 */
export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!requireAdmin(session)) {
    return <Forbidden />;
  }

  const capabilities = await listCapabilities(prisma);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Quản lý năng lực
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Toàn bộ năng lực MCP và Skill, kể cả bản đang ẩn khỏi trang công khai.
          </p>
        </div>
        <Link
          href="/admin/new"
          className="inline-flex items-center justify-center rounded-full bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          Tạo năng lực mới
        </Link>
      </div>

      {capabilities.length === 0 ? (
        <p className="mt-10 rounded-lg border border-primary-100 px-4 py-6 text-center text-sm text-foreground/60">
          Chưa có năng lực nào. Bấm &quot;Tạo năng lực mới&quot; để bắt đầu.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-primary-100">
          <table className="w-full min-w-[720px] divide-y divide-primary-100 text-left text-sm">
            <thead className="bg-primary-50/60 text-xs font-medium text-foreground/60">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Tên
                </th>
                <th scope="col" className="px-4 py-3">
                  Loại
                </th>
                <th scope="col" className="px-4 py-3">
                  Vertical
                </th>
                <th scope="col" className="px-4 py-3">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100 bg-white">
              {capabilities.map((capability) => (
                <tr key={capability.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{capability.name}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={capability.type} />
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    <VerticalLabel vertical={capability.vertical} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={capability.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/admin/${capability.id}/edit`}
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        Sửa
                      </Link>
                      <ToggleStatusButton id={capability.id} status={capability.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
