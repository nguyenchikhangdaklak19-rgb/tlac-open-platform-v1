# Spec: TLAC Open Platform (MCP Marketplace) — v1

> Bản v1. PO nghiệm thu ở UAT bằng cách **dùng thử**, không đọc code.
> Nội dung tool/schema/endpoint thật **do Engineering + BU cung cấp** từ định nghĩa MCP server thật — spec này chỉ định nghĩa khung hiển thị và luồng, **không bịa** nội dung.

---

## Mục tiêu

Cho phép **dev/agent bên ngoài** tự tìm hiểu và **tự lấy cấu hình để kết nối** vào MCP server thật của Trợ Lý Ăn Chơi (TLAC), theo mô hình BYOA — Bring Your Own Agent (Tier 1). Người dùng xem được các năng lực TLAC mở ra (đặt vé máy bay/tàu/xe, vé phim, order Highlands, tìm voucher), đăng ký bằng email, và copy config để cắm vào MCP client của họ. Admin nội bộ tự quản nội dung hiển thị của từng năng lực mà không cần đụng code.

## Người dùng & ngữ cảnh

| Vai trò | Ai | Dùng để làm gì |
|---------|-----|----------------|
| **Khách vãng lai** | Dev/agent builder bên ngoài chưa đăng ký | Browse catalog, đọc mô tả năng lực + docs để đánh giá có connect hay không |
| **User đã đăng nhập** | Dev/agent builder đã đăng ký email | Lấy connection config để cắm vào MCP client; gửi yêu cầu hỗ trợ khi gặp lỗi |
| **Admin** | Team TLAC (PO / nội bộ) | Tạo/sửa/ẩn nội dung hiển thị của từng năng lực (MCP + Skill) qua giao diện, không cần code |

## Phạm vi v1 (module)

| # | Module | Tóm tắt |
|---|--------|---------|
| A | Catalog công khai | Landing + danh sách năng lực + trang chi tiết. Không cần login. |
| B | Đăng ký / Đăng nhập | Email → xác thực → đăng nhập. |
| C | Kết nối (connection config) | User đăng nhập thấy endpoint + config snippet để copy-paste. **Chưa cấp API key** ở v1. |
| D | Yêu cầu hỗ trợ | Form gửi lỗi → đẩy về Slack/email team qua webhook. **Không** có ticket inbox trong app. |
| E | Admin CMS | Admin CRUD nội dung hiển thị của năng lực (MCP + Skill). Runtime config **để phase sau**. |
| F | Skills placeholder | Public hiển thị "Sắp ra mắt". Admin đã có thể tạo trước nhưng chưa publish. |

## Information Architecture / Sitemap

```
/                 Landing — hero + 6 capability card + "Cách kết nối 3 bước"
/mcp              Catalog — list năng lực, search + filter theo vertical
/mcp/:slug        Chi tiết 1 năng lực — mô tả, tool schema, ví dụ, config để copy
/skills           Placeholder "Sắp ra mắt"
/docs             Quickstart kết nối
/login            Đăng nhập email
/register         Đăng ký email → xác thực
/account          (cần login) Connection config + nút "Yêu cầu hỗ trợ"
/admin            (chỉ admin) Quản lý nội dung năng lực (CMS)
```

**6 năng lực v1 — gom theo 4 vertical (1 endpoint MCP TLAC phục vụ tất cả):**

| Vertical | Năng lực (capability card) | Nội dung thật lấy từ |
|----------|----------------------------|----------------------|
| Travel | Đặt vé máy bay · Đặt vé tàu · Đặt vé xe khách | Định nghĩa MCP server + BU Travel |
| Phim | Đặt vé xem phim | Định nghĩa MCP server + BU Phim |
| F&B | Order Highlands | Định nghĩa MCP server + BU Highlands |
| Promotion | Tìm kiếm voucher | Định nghĩa MCP server |

> Tên hiển thị, mô tả, schema, ví dụ, config snippet của mỗi năng lực **do Eng/BU đổ vào qua Admin CMS** — không hard-code, không bịa trong spec.

---

## Acceptance Criteria (PO nghiệm thu bằng cách DÙNG THỬ)

### A. Catalog công khai

- [ ] Khi mở `/` mà **chưa đăng nhập** → thấy landing với 6 capability card và mục "Cách kết nối 3 bước"; không bị chặn.
- [ ] Khi mở `/mcp` → thấy danh sách 6 năng lực, mỗi item có tên, vertical, mô tả ngắn, trạng thái.
- [ ] Khi gõ từ khoá vào ô search ở `/mcp` → danh sách lọc còn các năng lực khớp tên/mô tả; không khớp → hiện empty state "Không tìm thấy năng lực".
- [ ] Khi chọn filter 1 vertical (Travel/Phim/F&B/Promotion) → chỉ còn năng lực thuộc vertical đó.
- [ ] Khi click 1 card → vào `/mcp/:slug` thấy: mô tả đầy đủ, danh sách tool + schema (input/output), ví dụ gọi, và khối config kết nối.
- [ ] Khi ở trang chi tiết mà **chưa đăng nhập** → khối config hiển thị ở trạng thái khoá kèm CTA "Đăng nhập để lấy cấu hình"; đọc mô tả/schema/ví dụ vẫn được.
- [ ] Khi mở 1 năng lực đang bị Admin đặt **Ẩn** → không xuất hiện ở catalog công khai và truy cập thẳng URL trả về "Năng lực không tồn tại hoặc chưa mở".

### B. Đăng ký / Đăng nhập (email)

- [ ] Khi nhập email đúng định dạng ở `/register` → nhận được bước xác thực email (cơ chế OTP hay magic link **để Tech Lead quyết**).
- [ ] Khi nhập email **sai định dạng** → chặn submit + báo lỗi ngay tại field, không gọi hệ thống.
- [ ] Khi email **đã đăng ký** → không tạo trùng; hướng dẫn về trang đăng nhập.
- [ ] Khi hoàn tất xác thực → vào được `/account`.
- [ ] Khi mã/link xác thực **hết hạn hoặc sai** → báo rõ và cho **gửi lại**.
- [ ] Khi **chưa xác thực** mà cố đăng nhập → chặn + nhắc xác thực trước.
- [ ] Khi truy cập `/account` hoặc `/admin` mà **chưa đăng nhập** → redirect về `/login`.
- [ ] Khi đăng xuất → mất quyền vào `/account`, `/admin`; quay lại 2 trang này bị redirect login.

### C. Kết nối (connection config)

- [ ] Khi user **đã đăng nhập** mở trang chi tiết 1 năng lực → khối config mở khoá, thấy **endpoint URL + config snippet** đầy đủ để copy.
- [ ] Khi bấm nút "Copy" trên config → nội dung vào clipboard + hiện toast "Đã sao chép".
- [ ] Khi ở `/account` → thấy lại thông tin kết nối chung (endpoint + hướng dẫn) ở một nơi, không phải mò từng trang.
- [ ] Config hiển thị đúng nội dung Admin đang publish cho năng lực đó (đổi ở Admin → user thấy bản mới sau khi tải lại).
- [ ] v1 **không** có nút tạo/thu hồi API key (ghi rõ "Sắp có" nếu cần chỗ trống).

### D. Yêu cầu hỗ trợ

- [ ] Khi user đã đăng nhập bấm "Yêu cầu hỗ trợ" ở `/account` (hoặc trang chi tiết) → mở form gồm: năng lực liên quan (chọn), loại lỗi (chọn), mô tả (bắt buộc), email liên hệ (điền sẵn từ tài khoản, sửa được).
- [ ] Khi thiếu field bắt buộc → chặn gửi + báo tại field thiếu.
- [ ] Khi gửi thành công → hiện xác nhận "Đã gửi yêu cầu, team sẽ liên hệ qua email" và yêu cầu được **đẩy về Slack/email team qua webhook**.
- [ ] Khi gửi **thất bại** (webhook lỗi) → báo user thử lại và **giữ nguyên nội dung đã nhập**, không mất dữ liệu.
- [ ] v1 **không** có màn quản lý ticket trong app — team xử lý ở Slack/email (xác nhận không có route quản lý ticket nào).

### E. Admin CMS (chỉ admin)

- [ ] Khi user **thường** vào `/admin` → bị chặn (403 / "Không có quyền"), không thấy nội dung admin.
- [ ] Khi **admin** vào `/admin` → thấy danh sách năng lực (MCP + Skill) với trạng thái Hiển thị/Ẩn.
- [ ] Khi admin **tạo** năng lực mới → điền được: tên, vertical, mô tả ngắn, mô tả dài/docs, tool schema hiển thị, ví dụ, config snippet, trạng thái.
- [ ] Khi admin **sửa** 1 năng lực và lưu → thay đổi phản ánh đúng ở trang công khai tương ứng.
- [ ] Khi admin đặt 1 năng lực **Ẩn** → biến mất khỏi catalog công khai (khớp AC ở mục A).
- [ ] Khi admin lưu mà thiếu field bắt buộc (vd tên) → chặn lưu + báo field thiếu.
- [ ] Admin CMS v1 **chỉ sửa nội dung hiển thị**; **không** có ô chỉnh endpoint/params/auth runtime (phần này ghi "Phase sau").
- [ ] Cách một tài khoản trở thành admin **để Tech Lead quyết** (seed/whitelist); PO nghiệm thu bằng: 1 tài khoản được đánh dấu admin vào được `/admin`, tài khoản thường thì không.

### F. Skills placeholder

- [ ] Khi mở `/skills` (công khai) → thấy trạng thái "Sắp ra mắt", không lỗi, không trang trắng.
- [ ] Admin **có thể tạo trước** entry Skill ở CMS nhưng khi chưa publish → công khai vẫn hiển thị "Sắp ra mắt".

### G. Responsive & Design system

- [ ] Mở toàn bộ các trang trên khổ **375px / 768px / 1440px** → không vỡ layout, không tràn ngang, đọc được.
- [ ] Giao diện dùng đúng **MoMo Design System** (pink `#eb2f96`, SF Pro, radius/token theo `uiux-design-system-skill`); không dùng magenta PPTX `#A1185C`.
- [ ] Nút bấm verb-first, không ALL-CAPS; trạng thái lỗi/thành công dùng token status của design system.

---

## Ngoài phạm vi (v1 KHÔNG làm)

- Chỉnh **runtime config** MCP (endpoint/params/auth ảnh hưởng server live) — phase sau.
- **Nội dung Skill** thật — chỉ chừa chỗ "Sắp ra mắt".
- **API key / OAuth / thu hồi credential** — v1 chỉ copy-paste config.
- **Quota / rate-limit / metering / billing** ở tầng website.
- **Ticket inbox** quản lý hỗ trợ trong app.
- **Attribution dashboard / Brand Console / Tier 2 managed runtime.**
- **Đa ngôn ngữ (EN)** — v1 tiếng Việt. (Xem flag ở ràng buộc.)
- **Mô hình payment & attribution** khi agent ngoài tạo booking — thuộc MCP server + BU, không thuộc website.

## Ghi chú / ràng buộc

- **Design system**: bám `uiux-design-system-skill` (MoMo DS web). Dimensions pixel-level của component → mở Figma UI Kit verify trước khi ship. Đây là web sản phẩm, **không** dùng style/màu của deck PPTX.
- **Cơ chế xác thực email** (OTP vs magic link), **hạ tầng lưu nội dung CMS**, **cách gán quyền admin**, **cấu hình webhook** (URL, format payload Slack) → **để Tech Lead quyết**.
- **⚠ Rủi ro cần chốt trước khi GA (flag, không phải quyết định của website):** v1 là *self-serve + chưa có API key + endpoint giao dịch thật* → về nguyên tắc, **ai đăng ký cũng lấy được config gọi tool thật** (order/booking = tiền thật). Rate-limit / chống lạm dụng phải nằm ở **tầng MCP server**, và **payment/attribution khi agent ngoài tạo booking** phải được **BU + Tech Lead align** trước khi mở public. Khuyến nghị: v1 có thể ship để test nội bộ/beta hẹp, **không GA public** tới khi có guard này.
- **Anti-fabrication**: mọi nội dung năng lực (tên/mô tả/schema/ví dụ/config) đổ từ nguồn thật qua CMS; không hard-code số liệu/nội dung giả trong sản phẩm.

## Gợi ý Epic (tham khảo — để Tech Lead phân rã, KHÔNG chia task ở đây)

1. **Public Catalog** — landing, list, filter/search, trang chi tiết (khối config có trạng thái khoá/mở theo login).
2. **Auth email** — đăng ký, xác thực, đăng nhập, phân quyền user/admin, chặn route.
3. **Connection surface** — hiển thị endpoint + config snippet, copy-to-clipboard, trang `/account`.
4. **Support form + webhook** — form, validate, đẩy Slack/email, xử lý lỗi gửi.
5. **Admin CMS** — CRUD nội dung năng lực (MCP + Skill), trạng thái Hiển thị/Ẩn, chặn non-admin.
6. **Design system & responsive** — áp token MoMo DS, test 3 breakpoint.

---

*Câu giao việc gợi ý cho đội agent:* "Đọc `spec/tlac-open-platform-v1.md`, phân rã Epic + task, trình kế hoạch cho tôi duyệt trước khi build."
