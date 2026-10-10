# TASKS — Danh sách công việc

Quy ước: làm **từng task một**, từ trên xuống. Chỉ tick `[x]` khi bạn đã tự chạy và xác nhận kết quả đúng tiêu chí nghiệm thu.

Trạng thái hiện tại: **Đã hoàn thành toàn bộ hệ thống MVP và kiểm thử E2E tự động thành công 100% (15/15 tests PASS).**

---

## Phase 0 — Chuẩn bị

- [x] 0.1 Soạn tài liệu: README, AGENTS, CLAUDE, PRD, ARCHITECTURE, DATABASE, SETUP_SUPABASE, UI_GUIDELINES, TASKS, PROMPTS, TEST_CHECKLIST
- [x] 0.2 Tạo cấu trúc thư mục và file rỗng theo `README.md` mục 4
- [x] 0.3 Tạo project Supabase, cấu hình Auth (theo `SETUP_SUPABASE.md` bước 1–3)
- [x] 0.4 Chạy SQL Phần 1–6 (`DATABASE.md`)
- [x] 0.5 Tạo 2 tài khoản, chạy seed Phần 7

## Phase 1 — Nền tảng frontend

- [x] 1.1 `base.css`, `components.css`, `layout.css`, `auth.css` theo `UI_GUIDELINES.md`
- [x] 1.2 `config.js`, `supabaseClient.js`, `utils.js` (mẫu trong `ARCHITECTURE.md`)
- [x] 1.3 `ui.js`: toast, confirm modal, render sidebar + topbar dùng chung

## Phase 2 — Xác thực

- [x] 2.1 `auth.js`: `requireAdmin()`, `redirectIfLoggedIn()`, `signOut()`
- [x] 2.2 `login.html` + `login.js`
- [x] 2.3 `register.html` + `register.js` (kiểm tra username bằng RPC, validate form)
- [x] 2.4 `forgot-password.html` + `forgotPassword.js`
- [x] 2.5 `reset-password.html` + `resetPassword.js`
- [x] 2.6 `index.html` chuyển hướng theo session
- [x] 2.7 Chạy `TEST_CHECKLIST.md` nhóm AUTH, REG, FP

## Phase 3 — Khung trang admin

- [x] 3.1 Layout sidebar/topbar dùng chung, nút Đăng xuất, tên người dùng, menu mobile

## Phase 4 — List Video

- [x] 4.1 `videoService.listVideos` + `categoryService.listCategories`
- [x] 4.2 `videos.html` + `videos.js`: bảng id/thumbnail/title/views/action, loading/empty/error
- [x] 4.3 Phân trang, tìm kiếm (debounce), lọc category, sắp xếp
- [x] 4.4 Delete: modal xác nhận, xóa bản ghi và file Storage (nếu upload)

## Phase 5 — Video Form

- [x] 5.1 `storageService` (upload/remove) và `videoService` (get/create/update/delete)
- [x] 5.2 `video-form.html` + `videoForm.js`: chế độ thêm, validate
- [x] 5.3 Nguồn URL và nguồn Upload; xem trước thumbnail
- [x] 5.4 Chế độ sửa; dọn file cũ khi đổi/ xóa file
- [x] 5.5 Chống bấm Lưu nhiều lần; xử lý lỗi upload

## Phase 6 — Dashboard

- [x] 6.1 `dashboardService` (3 RPC)
- [x] 6.2 `dashboard.html`: 3 thẻ số liệu
- [x] 6.3 Biểu đồ cột top 10
- [x] 6.4 Biểu đồ line với công tắc Ngày/Tháng
- [x] 6.5 Loading/empty/error cho từng khối

## Phase 7 — Hoàn thiện và kiểm thử

- [x] 7.1 Responsive 375/768/1280px
- [x] 7.2 Chạy toàn bộ `TEST_CHECKLIST.md`
- [x] 7.3 Rà soát bảo mật: XSS, khóa API, RLS (nhóm SEC)
- [x] 7.4 Dọn Console, đặt tên file/biến cho nhất quán
- [x] 7.5 Cập nhật cấu hình hoàn tất
