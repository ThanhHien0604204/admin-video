# AGENTS.md — Quy tắc cho AI khi làm dự án Video Admin

Bạn đang hỗ trợ một người học Vibe Coding xây dựng website admin quản lý video. Hãy giải thích ngắn gọn, rõ ràng, bằng **tiếng Việt**.

## 1. Đọc trước khi làm

Đầu mỗi phiên, đọc theo thứ tự: `docs/PRD.md` → `docs/ARCHITECTURE.md` → `docs/DATABASE.md` → `docs/UI_GUIDELINES.md` → `docs/TASKS.md`.
Nếu yêu cầu mâu thuẫn với tài liệu, **hỏi lại** thay vì tự quyết.

## 2. Ràng buộc công nghệ (bắt buộc)

- Chỉ dùng **HTML, CSS, JavaScript thuần**. Không React/Vue/Tailwind/Bootstrap, không bundler, không npm build.
- JavaScript dùng **ES Modules** (`<script type="module">`), `async/await`.
- Thư viện chỉ nạp qua CDN: `@supabase/supabase-js@2` (qua `esm.sh`) và `chart.js` (qua `jsdelivr`).
- Giao diện **light mode**, nền trắng. Không làm dark mode trừ khi được yêu cầu.
- Backend là **Supabase** (Auth, Postgres, Storage). Không tạo server riêng.

## 3. Quy tắc Supabase và bảo mật

1. Chỉ dùng `anon`/`publishable` key trong `assets/js/config.js`. **Cấm** `service_role`/secret key trong code.
2. Mọi bảng đều bật RLS. Không viết code giả định "client đã kiểm tra quyền là đủ".
3. Kiểm tra quyền ở client (`requireAdmin()`) chỉ để UX; quyền thật do RLS/RPC quyết định.
4. Chống XSS: hiển thị dữ liệu người dùng bằng `textContent` hoặc `createElement`. Nếu bắt buộc dùng `innerHTML` thì phải qua `escapeHtml()` trong `utils.js`.
5. Không lưu token/mật khẩu vào `localStorage` thủ công. Phiên đăng nhập do `supabase-js` quản lý.
6. Không log mật khẩu hoặc token ra console.
7. Thay đổi schema DB phải cập nhật `docs/DATABASE.md` trong cùng lượt làm việc.

## 4. Quy ước code

- Tên file JS: `camelCase.js`. Tên file HTML: `kebab-case.html`. Tên bảng/cột DB: `snake_case`.
- Mỗi trang = 1 file HTML + 1 file JS trong `assets/js/pages/`. Logic gọi Supabase đặt trong `assets/js/services/`, **không** viết thẳng trong file page.
- Không dùng `onclick="..."` inline. Dùng `addEventListener`.
- Mọi lời gọi Supabase phải kiểm tra `error` và hiển thị thông báo thân thiện bằng `toast` (không `alert`).
- Mỗi trang phải xử lý đủ 3 trạng thái: **loading**, **empty**, **error**.
- CSS dùng biến trong `assets/css/base.css`. Không hard-code màu rải rác.
- Hàm ngắn, một việc. Comment tiếng Việt khi logic không hiển nhiên.
- Định dạng: 2 dấu cách, dấu nháy đơn trong JS, có dấu chấm phẩy.

## 5. Quy trình làm việc

1. Mỗi lượt chỉ làm **một task** trong `docs/TASKS.md`.
2. Trước khi code: nêu ngắn gọn kế hoạch (file nào sẽ tạo/sửa).
3. Sau khi code: hướng dẫn cách test thủ công (các bước + kết quả mong đợi) và đối chiếu `docs/TEST_CHECKLIST.md`.
4. Tick `- [x]` task đã hoàn thành trong `docs/TASKS.md` **chỉ khi người dùng xác nhận** đã chạy được.
5. Gặp lỗi: yêu cầu người dùng cung cấp thông báo lỗi trong Console/Network, không đoán mò.
6. Thiếu thông tin: hỏi lại, không tự bịa số liệu hoặc giả định ngầm. Nếu buộc phải giả định, ghi rõ "Giả định cần xác nhận".
7. Đề xuất ngoài phạm vi: nêu dưới nhãn **"Đề xuất thêm"** và không tự làm khi chưa được đồng ý.

## 6. Định nghĩa "Xong" (Definition of Done)

- [ ] Chạy được trên `http://localhost:5500`, không có lỗi trong Console.
- [ ] Có đủ trạng thái loading / empty / error.
- [ ] Đã validate form phía client và xử lý lỗi từ Supabase.
- [ ] Không có XSS (dữ liệu hiển thị an toàn).
- [ ] Hiển thị đúng ở 375px, 768px, 1280px.
- [ ] Tài liệu liên quan đã được cập nhật.
- [ ] Người dùng đã tự test theo hướng dẫn và xác nhận.

## 7. Tài khoản dev

| email | password | role |
|---|---|---|
| admin1@gmail.com | 123456 | ADMIN |
| user1@gmail.com | 123456 | USER |

Chỉ dùng cho môi trường học tập.
