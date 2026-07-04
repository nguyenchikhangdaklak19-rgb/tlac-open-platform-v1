<p align="center">
  <img src="public/tlac-icon.png" width="96" alt="TLAC mascot" />
</p>

# TLAC Open Platform — MCP Marketplace (v1)

Website mở của **Trợ Lý Ăn Chơi (TLAC)** cho dev/agent builder bên ngoài theo mô hình **BYOA — Bring Your Own Agent**: tự tìm hiểu các năng lực TLAC mở ra qua MCP, đăng ký bằng email, và copy config để cắm vào MCP client của mình. Admin nội bộ quản toàn bộ nội dung hiển thị qua CMS, không cần đụng code.

Spec gốc: [`spec/tlac-open-platform-v1.md`](spec/tlac-open-platform-v1.md)

## Năng lực v1 (6 capability, 4 vertical, 1 endpoint MCP)

| Vertical | Năng lực |
|---|---|
| Travel | Đặt vé máy bay · Đặt vé tàu · Đặt vé xe khách |
| Phim | Đặt vé xem phim |
| F&B | Order Highlands |
| Promotion | Tìm kiếm voucher |

> **Anti-fabrication**: nội dung thật của từng năng lực (mô tả, tool schema, ví dụ, config) do Eng/BU nhập qua Admin CMS — seed chỉ tạo khung với placeholder, không hard-code nội dung giả.

## Module đã ship

- **A. Catalog công khai** — landing (hero MCP + 6 capability card + "Cách kết nối 3 bước"), `/mcp` với search + filter vertical, `/mcp/:slug` chi tiết; năng lực Ẩn → 404.
- **B. Auth email OTP** — đăng ký → OTP 6 số → xác thực → đăng nhập (passwordless); session HMAC httpOnly; middleware chặn `/account`, `/admin`; admin theo whitelist `ADMIN_EMAILS`.
- **C. Connection config** — khối config khoá khi chưa login, mở khi login; `/account` tổng hợp config mọi năng lực một nơi + copy-to-clipboard; API key ghi "Sắp có" (v1 chưa cấp key).
- **D. Yêu cầu hỗ trợ** — form validate từng field, đẩy Slack webhook (`SUPPORT_WEBHOOK_URL`), gửi lỗi giữ nguyên dữ liệu; **không** có ticket inbox trong app.
- **E. Admin CMS** — CRUD nội dung năng lực (MCP + Skill), toggle Hiển thị/Ẩn, chặn non-admin 403 ở cả page lẫn API; **không** chỉnh runtime config (Phase sau).
- **F. Skills** — public luôn hiển thị "Sắp ra mắt"; admin có thể tạo trước entry Skill.
- **G. Design system** — MoMo DS (pink `#eb2f96`, SF Pro, radius token), tiếng Việt, verb-first, không ALL-CAPS, responsive 375/768/1440.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 (token qua `@theme`) · Prisma 7 + SQLite (driver adapter better-sqlite3) · Vitest (unit) · Playwright (e2e) · Zero dependency ngoài cho auth/webhook (Node crypto + fetch).

## Chạy local

```bash
npm install                 # postinstall tự chạy prisma generate

# .env (xem .env.example)
# DATABASE_URL="file:./dev.db"
# SESSION_SECRET=<chuỗi bí mật>
# ADMIN_EMAILS=you@example.com     # email được cấp quyền admin
# RESEND_API_KEY=                  # bỏ trống -> OTP in ra console (dev mode)
# SUPPORT_WEBHOOK_URL=             # bỏ trống -> support request log ra console

npm run db:migrate && npm run db:seed
npm run dev
```

- **OTP dev mode**: chưa có `RESEND_API_KEY` thì mã OTP in ra log server dạng `[DEV] OTP for <email>: 123456` — dùng mã **mới nhất** (mỗi lần gửi lại, mã cũ bị huỷ).
- **Thành admin**: đăng ký bằng email nằm trong `ADMIN_EMAILS`, xác thực xong là vào được `/admin`.

## Test

```bash
npm run lint        # ESLint
npm test            # Vitest — 187 unit tests
npm run test:e2e    # Playwright — 60 e2e tests phủ toàn bộ AC A–G + responsive 3 breakpoint
```

E2E chạy trên port 3100 với DB riêng (`e2e.db`, tự migrate + seed mỗi lần chạy), không đụng `dev.db`.

## Quy trình phát triển

Repo vận hành theo mô hình **autonomous engineering team** (xem [`CLAUDE.md`](CLAUDE.md)): spec-first trong `spec/`, `tech-lead` phân rã task với file ownership tách bạch, mỗi task một `engineer` làm trên git worktree + branch riêng, `reviewer` review đối kháng + viết edge-case test và gate mọi merge. Definition of Done: AC đạt + test xanh + lint sạch + reviewer approve. v1 được build qua 10 task (T01–T10), tất cả đều qua reviewer gate.

## Ngoài phạm vi v1

Runtime config MCP (endpoint/params/auth) · nội dung Skill thật · API key/OAuth · quota/rate-limit/billing tầng website · ticket inbox · đa ngôn ngữ · attribution dashboard.

## ⚠️ Lưu ý trước khi GA

v1 là *self-serve + chưa có API key + endpoint giao dịch thật* → ai đăng ký cũng lấy được config gọi tool thật (order/booking = tiền thật). **Chỉ phù hợp test nội bộ / beta hẹp** cho tới khi: (1) tầng MCP server có rate-limit/chống lạm dụng, (2) BU + Tech Lead align xong payment & attribution khi agent ngoài tạo booking. Chi tiết ở mục "Ghi chú / ràng buộc" trong spec.
