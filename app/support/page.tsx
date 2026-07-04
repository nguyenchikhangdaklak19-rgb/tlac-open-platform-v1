import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import SupportForm from "@/components/support/support-form";

// `/support` requires a logged-in session (spec section D — "Yêu cầu hỗ trợ"
// is reached from `/account` or a capability detail page, both of which
// require login). `middleware.ts` only guards `/account` and `/admin`, so
// this route enforces its own redirect via `getSession()`.
export const metadata: Metadata = {
  title: "Yêu cầu hỗ trợ | TLAC Open Platform",
  description:
    "Gửi yêu cầu hỗ trợ khi gặp lỗi kết nối hoặc sử dụng năng lực MCP của TLAC.",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ capability?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { capability } = await searchParams;

  const capabilities = await prisma.capability.findMany({
    where: { status: "VISIBLE" },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  return (
    <div className="flex flex-1 justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Yêu cầu hỗ trợ
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Gặp lỗi khi kết nối hoặc sử dụng năng lực? Gửi thông tin cho team,
          chúng tôi sẽ liên hệ lại qua email.
        </p>

        <div className="mt-6 rounded-xl border border-primary-100 bg-white p-6 sm:p-8">
          <SupportForm
            capabilities={capabilities}
            defaultEmail={session.email}
            defaultCapabilitySlug={capability}
          />
        </div>
      </div>
    </div>
  );
}
