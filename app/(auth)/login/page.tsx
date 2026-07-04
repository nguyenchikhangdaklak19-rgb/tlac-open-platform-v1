"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginState =
  | { kind: "idle" }
  | { kind: "not_registered" }
  | { kind: "not_verified" }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [state, setState] = useState<LoginState>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  function validate(trimmed: string): boolean {
    if (!EMAIL_REGEX.test(trimmed)) {
      setFieldError("Email không đúng định dạng. Vui lòng kiểm tra lại.");
      return false;
    }
    setFieldError(null);
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "idle" });
    setResent(false);
    const trimmed = email.trim();
    if (!validate(trimmed)) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (response.ok) {
        router.push(
          data.redirectTo ??
            `/verify?email=${encodeURIComponent(trimmed)}&purpose=login`,
        );
        return;
      }
      if (data.error === "not_registered") {
        setState({ kind: "not_registered" });
        return;
      }
      if (data.error === "not_verified") {
        setState({ kind: "not_verified" });
        return;
      }
      setState({
        kind: "error",
        message: data.message ?? "Có lỗi xảy ra. Vui lòng thử lại.",
      });
    } catch {
      setState({
        kind: "error",
        message: "Không thể kết nối máy chủ. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    const trimmed = email.trim();
    if (!validate(trimmed)) return;

    setResending(true);
    setResent(false);
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (response.ok) {
        setResent(true);
        router.push(
          `/verify?email=${encodeURIComponent(trimmed)}&purpose=register`,
        );
        return;
      }
      setState({
        kind: "error",
        message: data.message ?? "Không gửi lại được mã. Vui lòng thử lại.",
      });
    } catch {
      setState({
        kind: "error",
        message: "Không thể kết nối máy chủ. Vui lòng thử lại.",
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-xl border border-primary-100 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-foreground">Đăng nhập</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Nhập email, chúng tôi sẽ gửi mã xác thực để đăng nhập.
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

          {state.kind === "not_registered" ? (
            <p className="rounded-lg bg-info-light px-3.5 py-2.5 text-sm text-info-dark">
              Email này chưa đăng ký.{" "}
              <Link href="/register" className="font-medium underline">
                Đăng ký tài khoản
              </Link>
              .
            </p>
          ) : null}

          {state.kind === "not_verified" ? (
            <div className="rounded-lg bg-warning-light px-3.5 py-2.5 text-sm text-warning-dark">
              <p>
                Email chưa được xác thực. Vui lòng xác thực trước khi đăng
                nhập.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-2 font-medium underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending ? "Đang gửi lại mã..." : "Gửi lại mã xác thực"}
              </button>
              {resent ? (
                <p className="mt-1 text-warning-dark">
                  Đã gửi mã mới, đang chuyển tới trang xác thực...
                </p>
              ) : null}
            </div>
          ) : null}

          {state.kind === "error" ? (
            <p className="rounded-lg bg-error-light px-3.5 py-2.5 text-sm text-error-dark">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang gửi mã..." : "Gửi mã đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/70">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
