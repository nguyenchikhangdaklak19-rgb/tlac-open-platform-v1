"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

// Kept in sync with app/api/auth/register/route.ts's server-side check —
// this one blocks submission (and the network call) entirely on bad format,
// per spec: "sai định dạng → chặn submit + báo lỗi ngay tại field, không gọi
// hệ thống."
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setAlreadyRegistered(false);

    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setFieldError("Email không đúng định dạng. Vui lòng kiểm tra lại.");
      return;
    }
    setFieldError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (response.status === 409 && data.error === "already_registered") {
        setAlreadyRegistered(true);
        return;
      }
      if (!response.ok) {
        setFormError(data.message ?? "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      router.push(
        data.redirectTo ??
          `/verify?email=${encodeURIComponent(trimmed)}&purpose=register`,
      );
    } catch {
      setFormError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-primary-100 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Đăng ký tài khoản
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Nhập email để nhận mã xác thực. Không cần mật khẩu.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldError) setFieldError(null);
              }}
              className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="ban@vidu.com"
              aria-invalid={fieldError ? true : undefined}
            />
            {fieldError ? (
              <p className="mt-1.5 text-sm text-error">{fieldError}</p>
            ) : null}
          </div>

          {alreadyRegistered ? (
            <p className="rounded-lg bg-info-light px-3.5 py-2.5 text-sm text-info-dark">
              Email này đã đăng ký và xác thực.{" "}
              <Link href="/login" className="font-medium underline">
                Đăng nhập ngay
              </Link>
              .
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-lg bg-error-light px-3.5 py-2.5 text-sm text-error-dark">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang gửi mã..." : "Gửi mã xác thực"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/70">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
