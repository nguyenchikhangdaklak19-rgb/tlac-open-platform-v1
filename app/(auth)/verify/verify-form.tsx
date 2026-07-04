"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const purpose = searchParams.get("purpose") === "login" ? "login" : "register";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!email) {
      setError("Thiếu email. Vui lòng quay lại bước đăng ký hoặc đăng nhập.");
      return;
    }
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("Mã xác thực gồm 6 chữ số.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: trimmedCode }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (response.ok) {
        router.push(data.redirectTo ?? "/account");
        return;
      }
      setError(
        data.error === "expired"
          ? "Mã đã hết hạn. Vui lòng gửi lại mã."
          : "Mã xác thực không đúng. Vui lòng thử lại.",
      );
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Thiếu email. Vui lòng quay lại bước đăng ký hoặc đăng nhập.");
      return;
    }
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const data = (await response.json()) as { message?: string };

      if (response.ok) {
        setCode("");
        setInfo("Đã gửi lại mã xác thực mới tới email của bạn.");
        return;
      }
      setError(data.message ?? "Không gửi lại được mã. Vui lòng thử lại.");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-primary-100 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Xác thực email
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          {email ? (
            <>
              Nhập mã 6 chữ số vừa gửi tới{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : (
            "Thiếu email. Vui lòng quay lại bước đăng ký hoặc đăng nhập."
          )}
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-foreground"
            >
              Mã xác thực
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="mt-1.5 w-full rounded-lg border border-primary-200 px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="000000"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-error-light px-3.5 py-2.5 text-sm text-error-dark">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-lg bg-success-light px-3.5 py-2.5 text-sm text-success-dark">
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !email}
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang xác thực..." : "Xác thực"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? "Đang gửi lại..." : "Gửi lại mã"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/70">
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
