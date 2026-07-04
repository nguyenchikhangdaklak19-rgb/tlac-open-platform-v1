import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import CapabilityForm from "@/components/admin/CapabilityForm";
import Forbidden from "@/components/admin/Forbidden";
import { requireAdmin } from "@/components/admin/require-admin";
import { getCapabilityById } from "@/components/admin/service";

export const metadata: Metadata = {
  title: "Sửa năng lực | TLAC Open Platform",
};

export const dynamic = "force-dynamic";

type EditCapabilityPageProps = {
  params: Promise<{ id: string }>;
};

/** Edit-capability page (spec section E, item 3). */
export default async function EditCapabilityPage({ params }: EditCapabilityPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!requireAdmin(session)) {
    return <Forbidden />;
  }

  const { id } = await params;
  const capability = await getCapabilityById(prisma, id);
  if (!capability) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
        Sửa năng lực: {capability.name}
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Thay đổi ở đây phản ánh ngay ở trang công khai tương ứng sau khi tải lại. Cấu
        hình runtime (endpoint, params, auth) chưa có ở v1.
      </p>
      <CapabilityForm
        mode="edit"
        capabilityId={capability.id}
        initialValues={{
          name: capability.name,
          type: capability.type,
          vertical: capability.vertical,
          slug: capability.slug,
          shortDesc: capability.shortDesc,
          longDesc: capability.longDesc,
          toolSchema: capability.toolSchema,
          examples: capability.examples,
          configSnippet: capability.configSnippet,
          status: capability.status,
        }}
      />
    </div>
  );
}
