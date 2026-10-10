# Video Admin

Website quản trị video (admin panel) viết bằng **HTML + CSS + JavaScript thuần**, kết nối **Supabase** (Auth, Postgres, Storage). Giao diện sáng (light mode), nền trắng.

Dự án dùng để học **Vibe Coding**: làm từng bước nhỏ cùng AI, mỗi bước đều có tài liệu và tiêu chí nghiệm thu rõ ràng.

---

## 1. Tính năng

| Nhóm | Trang | Mô tả ngắn |
|---|---|---|
| Xác thực | `login.html`, `register.html`, `forgot-password.html` (+ `reset-password.html`) | Đăng nhập, đăng ký, quên mật khẩu qua Supabase Auth |
| Dashboard | `dashboard.html` | Tổng số video, tổng lượt xem, dung lượng storage, biểu đồ cột top 10 video nhiều view nhất, biểu đồ line lượt xem theo ngày/tháng |
| Video | `videos.html` | Danh sách video: id, title, thumbnail, views, action (Edit, Delete) |
| Video | `video-form.html` | Thêm / sửa video (upload file hoặc dán URL) |

Chỉ tài khoản có role **ADMIN** mới vào được khu vực quản trị. Tài khoản **USER** đăng nhập sẽ bị từ chối.

## 2. Công nghệ

- HTML5, CSS3, JavaScript (ES Modules), **không dùng framework, không cần build**.
- Supabase: Auth, Postgres (có RLS), Storage.
- `@supabase/supabase-js` v2 và Chart.js nạp qua CDN.

## 3. Bộ tài liệu (đọc theo thứ tự)

| File | Nội dung | Khi nào đọc |
|---|---|---|
| `README.md` | Tổng quan (file này) | Đầu tiên |
| `AGENTS.md` | Quy tắc cho AI khi code dự án này | AI đọc đầu mỗi phiên |
| `CLAUDE.md` | Trỏ về `AGENTS.md` (dành cho Claude Code) | Tự động |
| `docs/PRD.md` | Yêu cầu sản phẩm: từng trang, quyền, validation, giả định | Trước khi code |
| `docs/ARCHITECTURE.md` | Cấu trúc thư mục, luồng dữ liệu, mẫu code | Trước khi code |
| `docs/DATABASE.md` | Schema, SQL, RLS, Storage, RPC, dữ liệu mẫu | Khi setup DB |
| `docs/SETUP_SUPABASE.md` | Hướng dẫn setup Supabase từng bước | Khi setup môi trường |
| `docs/UI_GUIDELINES.md` | Design token, component, wireframe | Khi làm giao diện |
| `docs/TASKS.md` | Danh sách task theo phase, có checkbox | Hằng ngày |
| `docs/PROMPTS.md` | Prompt mẫu để vibe coding từng phase | Khi làm việc với AI |
| `docs/TEST_CHECKLIST.md` | Test case thủ công theo module | Sau mỗi phase |

## 4. Cấu trúc thư mục dự kiến

```
video-admin/
├─ README.md
├─ AGENTS.md
├─ CLAUDE.md
├─ docs/
├─ index.html                  # chuyển hướng tới login hoặc dashboard
├─ login.html
├─ register.html
├─ forgot-password.html
├─ reset-password.html
├─ dashboard.html
├─ videos.html
├─ video-form.html
└─ assets/
   ├─ css/    (base.css, layout.css, components.css, auth.css)
   └─ js/
      ├─ config.js
      ├─ supabaseClient.js
      ├─ auth.js
      ├─ ui.js
      ├─ utils.js
      ├─ services/  (videoService.js, dashboardService.js, categoryService.js, storageService.js)
      └─ pages/     (login.js, register.js, forgotPassword.js, resetPassword.js, dashboard.js, videos.js, videoForm.js)
```

## 5. Chạy nhanh

1. Làm theo `docs/SETUP_SUPABASE.md` (tạo project, chạy SQL trong `docs/DATABASE.md`, tạo 2 tài khoản).
2. Điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` vào `assets/js/config.js`.
3. Chạy server tĩnh ở thư mục gốc (ES Modules **không chạy** khi mở bằng `file://`):
   - VS Code: extension **Live Server** (cổng 5500), hoặc
   - Terminal: `python3 -m http.server 5500`
4. Mở `http://localhost:5500/login.html`.

## 6. Tài khoản demo (chỉ dùng cho môi trường học/dev)

| username | email | password | role |
|---|---|---|---|
| admin1 | admin1@gmail.com | 123456 | ADMIN |
| user1 | user1@gmail.com | 123456 | USER |

> Mật khẩu `123456` quá yếu. Tuyệt đối không dùng khi triển khai thật.

## 7. Quy ước chung

- Code (tên biến, hàm, bảng, cột): tiếng Anh. Giao diện hiển thị và comment giải thích: tiếng Việt.
- Chỉ dùng khóa **anon/publishable** ở frontend. Không bao giờ đưa `service_role`/secret key vào mã nguồn.
- Bảo mật thật nằm ở **RLS trong database**, không phải ở code JavaScript phía client.
