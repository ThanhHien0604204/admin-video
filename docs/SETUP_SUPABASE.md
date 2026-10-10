# SETUP_SUPABASE — Hướng dẫn cài đặt từng bước

Thời gian ước tính: 20–30 phút. Làm đúng thứ tự.

---

## Bước 1. Tạo project Supabase

1. Vào https://supabase.com → đăng ký / đăng nhập → **New project**.
2. Điền: **Name** (ví dụ `video-admin`), **Database Password** (lưu lại ở nơi an toàn), **Region** (gần Việt Nam nhất, thường là *Southeast Asia (Singapore)*).
3. Đợi project khởi tạo xong (1–2 phút).

## Bước 2. Lấy URL và khóa API

1. Vào **Project Settings → API** (hoặc mục **API Keys** tùy giao diện hiện tại).
2. Sao chép:
   - **Project URL** (dạng `https://xxxx.supabase.co`)
   - Khóa **anon / public** hoặc **publishable** (dùng một trong hai).
3. **Tuyệt đối không** dùng `service_role` hoặc `secret` key trong frontend.

Các giá trị này sẽ điền vào `assets/js/config.js` ở Bước 9.

## Bước 3. Cấu hình Authentication

1. **Authentication → Sign In / Providers → Email**: bật Email provider.
2. Tắt **Confirm email** (chỉ cho môi trường học/dev để đăng ký xong dùng được ngay).
3. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:5500`
   - **Redirect URLs**: thêm `http://localhost:5500/reset-password.html`
   (Nếu dùng cổng khác, đổi cho khớp.)
4. Độ dài mật khẩu tối thiểu mặc định là 6, vừa đủ cho `123456`.

## Bước 4. Chạy SQL tạo database

1. Mở **SQL Editor → New query**.
2. Mở `docs/DATABASE.md`, chạy lần lượt **Phần 1 → Phần 6** (mỗi phần dán vào một query và bấm **Run**).
3. Mỗi phần phải báo `Success`. Nếu có lỗi, xem mục Xử lý sự cố bên dưới.

> Phải chạy xong Phần 2 (trigger `on_auth_user_created`) **trước khi** tạo tài khoản ở Bước 5, nếu không bảng `users` sẽ không có hồ sơ.

## Bước 5. Tạo 2 tài khoản demo

**Authentication → Users → Add user → Create new user**, tạo lần lượt:

| Email | Password | Auto Confirm User |
|---|---|---|
| admin1@gmail.com | 123456 | Bật |
| user1@gmail.com | 123456 | Bật |

Trigger sẽ tự tạo hồ sơ trong `public.users` với username lấy từ phần trước dấu `@` (`admin1`, `user1`) và role `USER`.

## Bước 6. Cấp quyền ADMIN cho admin1 và seed dữ liệu

Chạy **Phần 7** trong `docs/DATABASE.md` (câu `update ... set role = 'ADMIN'` và dữ liệu mẫu).

Kiểm tra bằng:
```sql
select username, email, role from public.users;
```
Kết quả mong đợi:

| username | email | role |
|---|---|---|
| admin1 | admin1@gmail.com | ADMIN |
| user1 | user1@gmail.com | USER |

## Bước 7. Kiểm tra Storage

**Storage** phải có hai bucket `videos` và `thumbnails` (được tạo bởi Phần 5). Nếu chưa thấy, chạy lại Phần 5.

Lưu ý giới hạn: gói Free giới hạn **50 MB mỗi file**. Muốn upload file lớn hơn cần nâng gói và tăng giới hạn trong Storage settings.

## Bước 8. Tạo cấu trúc dự án

Tạo các thư mục và file theo `README.md` (mục 4). Có thể nhờ AI làm theo Task 0.2 trong `docs/TASKS.md`.

## Bước 9. Điền cấu hình

Sửa `assets/js/config.js`:
```js
export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-OR-PUBLISHABLE-KEY';
```

## Bước 10. Chạy thử trên máy

Mở terminal ở thư mục gốc dự án:
```bash
python3 -m http.server 5500
```
Hoặc dùng extension **Live Server** của VS Code (cổng 5500).

Mở `http://localhost:5500/login.html`. **Không** mở file bằng đường dẫn `file://`, vì ES Modules sẽ bị trình duyệt chặn.

---

## Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `relation "public.users" does not exist` | Chạy sai thứ tự SQL | Chạy lại từ Phần 1 |
| `Database error saving new user` | Trigger `handle_new_user` lỗi: username trùng hoặc không đúng định dạng (3–30 ký tự, chỉ chữ/số/gạch dưới) | Đổi username; kiểm tra email prefix hợp lệ |
| `Invalid login credentials` | Sai mật khẩu, hoặc user chưa Auto Confirm | Kiểm tra lại ở Authentication → Users; đặt lại mật khẩu |
| Đăng nhập được nhưng bị đẩy ra login | `role` chưa phải `ADMIN` hoặc `is_active = false` | Chạy lại câu `update ... set role = 'ADMIN'` |
| `permission denied for table ...` | Thiếu GRANT | Chạy lại Phần 6 |
| `new row violates row-level security policy` | Không đăng nhập bằng ADMIN, hoặc thiếu policy | Kiểm tra role; chạy lại Phần 4 |
| `forbidden` khi gọi RPC dashboard | Tài khoản không phải ADMIN | Đăng nhập admin1 |
| Trang trắng, lỗi CORS / module trong Console | Mở bằng `file://` | Chạy server tĩnh ở cổng 5500 |
| Upload lỗi `The object exceeded the maximum allowed size` | File lớn hơn 50 MB | Dùng file nhỏ hơn hoặc nâng gói |
| Upload lỗi `mime type ... is not supported` | Sai định dạng | Chỉ mp4, webm, mov (video); jpg, png, webp (ảnh) |
| Không nhận email quên mật khẩu | Giới hạn email của SMTP mặc định (rất thấp) | Đợi, hoặc cấu hình SMTP riêng ở Authentication → SMTP |
| Link đặt lại mật khẩu báo lỗi | Redirect URL chưa khai báo | Thêm vào URL Configuration (Bước 3) |

## Danh sách kiểm tra cuối

- [ ] Có 7 bảng trong **Table Editor**, tất cả bật RLS.
- [ ] Có 2 dòng trong `public.users`, đúng role.
- [ ] Có 2 bucket Storage.
- [ ] `config.js` đã điền đúng URL và khóa anon/publishable.
- [ ] Mở `http://localhost:5500/login.html` thấy trang đăng nhập, Console không có lỗi đỏ.
