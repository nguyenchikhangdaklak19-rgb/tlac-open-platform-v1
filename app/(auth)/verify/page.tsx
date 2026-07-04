import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyForm from "./verify-form";

// `VerifyForm` reads `?email=&purpose=` via `useSearchParams`, which requires
// a Suspense boundary around it so Next can statically shell this route
// instead of forcing full-page dynamic rendering.
export const metadata: Metadata = {
  title: "Xác thực email | TLAC Open Platform",
  description: "Nhập mã xác thực 6 chữ số được gửi tới email của bạn.",
};

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
          <p className="text-sm text-foreground/60">Đang tải...</p>
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
