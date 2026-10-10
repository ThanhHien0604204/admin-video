# PRD — Video Admin

Tài liệu yêu cầu sản phẩm. Là nguồn sự thật cho **làm gì** (còn **làm thế nào** xem `ARCHITECTURE.md`).

---

## 1. Mục tiêu

Xây dựng website admin giúp quản trị viên theo dõi và quản lý kho video: xem thống kê tổng quan, xem danh sách, thêm/sửa/xóa video.

**Tiêu chí thành công**
- Admin đăng nhập, xem Dashboard và quản lý video không cần chạm vào database thủ công.
- Số liệu Dashboard khớp với dữ liệu thật trong database.
- User thường không truy cập được khu vực admin, kể cả khi gọi API trực tiếp.

## 2. Vai trò và phân quyền

| Hành động | Chưa đăng nhập | USER | ADMIN |
|---|---|---|---|
| Xem trang login / register / forgot password | Có | Có | Có |
| Đăng ký tài khoản | Có | — | — |
| Vào Dashboard, List Video, Video Form | Không | **Không** | Có |
| Thêm / sửa / xóa video | Không | Không | Có |
| Upload file lên Storage | Không | Không | Có |

Quy tắc: USER đăng nhập thành công ở tầng Auth nhưng bị từ chối ở tầng ứng dụng (hiển thị thông báo "Bạn không có quyền truy cập khu vực quản trị" rồi đăng xuất).

## 3. Phạm vi

**Trong phạm vi (MVP)**
- 3 trang xác thực + trang đặt lại mật khẩu (bắt buộc để luồng quên mật khẩu hoạt động).
- Dashboard, List Video, Video Form (thêm/sửa).
- Database: `users`, `videos`, `video_categories`, `tags`, `video_tags`, `video_views`, `activity_logs`.
- Storage: bucket `videos`, `thumbnails`.

**Ngoài phạm vi MVP (xem mục Mở rộng trong `TASKS.md`)**
- Trang quản lý users, trang quản lý categories, nhật ký hoạt động giao diện, dark mode, trình phát video công khai.

## 4. Đặc tả từng trang

### 4.1 Login (`login.html`)
- Trường: Email, Mật khẩu (có nút hiện/ẩn).
- Nút "Đăng nhập"; link tới Register và Forgot Password.
- Luồng: `signInWithPassword` → đọc `public.users` theo `auth.uid()` → nếu `role = 'ADMIN'` và `is_active = true` thì chuyển `dashboard.html`; ngược lại đăng xuất và báo không có quyền.
- Sai email hoặc mật khẩu: một thông báo chung "Email hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại hay không).
- Đã đăng nhập hợp lệ mà mở lại trang login: tự chuyển tới Dashboard.
- Nút disabled và hiện trạng thái "Đang đăng nhập..." khi đang gọi API.

### 4.2 Register (`register.html`)
- Trường: Username, Email, Mật khẩu, Xác nhận mật khẩu.
- Gọi `isUsernameAvailable` (RPC) trước khi đăng ký, sau đó `signUp` với `options.data = { username }`.
- Tài khoản mới luôn có role **USER** (do trigger trong DB gán, client không thể chọn).
- Thành công: thông báo và chuyển về `login.html`.
- Lưu ý: tài khoản USER không vào được khu vực admin (xem mục 2).

### 4.3 Forgot Password (`forgot-password.html`)
- Trường: Email. Gọi `resetPasswordForEmail(email, { redirectTo: <origin>/reset-password.html })`.
- Luôn hiển thị cùng một thông báo: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu".
- Chặn bấm liên tiếp (disable nút 60 giây sau khi gửi) vì Supabase giới hạn số email.

### 4.4 Reset Password (`reset-password.html`) — trang bổ sung
- Người dùng đến từ link trong email, Supabase tạo phiên khôi phục (sự kiện `PASSWORD_RECOVERY`).
- Trường: Mật khẩu mới, Xác nhận. Gọi `updateUser({ password })`. Thành công: đăng xuất và chuyển về login.
- Link không hợp lệ hoặc hết hạn: hiển thị thông báo và link quay lại Forgot Password.

### 4.5 Dashboard (`dashboard.html`)
**Ba thẻ số liệu**

| Thẻ | Nguồn | Định dạng |
|---|---|---|
| Tổng số video | `get_dashboard_stats().total_videos` | Số nguyên, phân tách hàng nghìn |
| Tổng lượt xem | `get_dashboard_stats().total_views` | Số nguyên, phân tách hàng nghìn |
| Dung lượng storage | `get_dashboard_stats().storage_bytes` | B / KB / MB / GB (1 chữ số thập phân, hệ 1024) |

**Biểu đồ cột — Top 10 video nhiều lượt xem nhất**
- Dữ liệu: RPC `get_top_videos(p_limit := 10)`.
- Trục X: tiêu đề video (cắt bớt nếu dài, tooltip hiện đầy đủ). Trục Y: số lượt xem.
- Sắp xếp giảm dần. Ít hơn 10 video thì hiển thị số hiện có.

**Biểu đồ line — Lượt xem theo thời gian**
- Công tắc **Ngày / Tháng**. Mặc định Ngày: 30 ngày gần nhất. Tháng: 12 tháng gần nhất.
- Dữ liệu: RPC `get_views_timeseries(p_granularity, p_from, p_to)`; ngày/tháng không có lượt xem vẫn hiển thị giá trị 0.
- Múi giờ thống kê: `Asia/Ho_Chi_Minh`.

**Trạng thái**: skeleton khi tải, empty state khi chưa có dữ liệu, thông báo lỗi kèm nút "Thử lại".

### 4.6 List Video (`videos.html`)

| Cột | Mô tả |
|---|---|
| id | `videos.id` |
| thumbnail | Ảnh 16:9, rộng 96px; ảnh lỗi hoặc thiếu dùng placeholder |
| title | Tiêu đề (cắt 2 dòng); kèm badge trạng thái (Draft / Published / Hidden) |
| views | `views_count`, phân tách hàng nghìn |
| action | Nút **Edit** (mở `video-form.html?id=<id>`) và **Delete** |

- Phân trang phía server, 10 dòng/trang (hiển thị "Hiển thị x–y trên tổng z").
- Tìm kiếm theo title (debounce 300ms, không phân biệt hoa thường).
- Lọc theo category; sắp xếp theo id, views, ngày tạo.
- Nút "Thêm video" mở `video-form.html`.
- **Delete**: hộp thoại xác nhận nêu tên video. Xác nhận → xóa bản ghi, nếu là video upload thì xóa luôn file trong Storage (video + thumbnail). Xóa xong tải lại danh sách.

### 4.7 Video Form (`video-form.html`) — dùng chung cho thêm và sửa
- Có `?id=` là chế độ sửa (tải dữ liệu cũ vào form), không có là chế độ thêm.

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| Title | Có | 1–150 ký tự |
| Description | Không | Tối đa 2000 ký tự |
| Category | Không | Chọn từ `video_categories` |
| Status | Có | Draft / Published / Hidden |
| Nguồn video | Có | Chọn **Upload file** hoặc **URL** |
| File video | Có nếu Upload | `.mp4`, `.webm`, `.mov`; tối đa **50 MB** |
| Video URL | Có nếu URL | Bắt đầu bằng `http://` hoặc `https://` |
| Thumbnail | Không | Upload (`.jpg`, `.png`, `.webp`, tối đa 5 MB) hoặc dán URL; có xem trước |

- Upload: hiển thị trạng thái "Đang tải lên..." (spinner), khóa nút Lưu; lưu `file_size_bytes` từ `file.size`.
- Sửa video và đổi/ xóa file: file cũ trong Storage phải được xóa để không rác dung lượng.
- Chống bấm Lưu nhiều lần.

## 5. Quy tắc nghiệp vụ

1. **Lượt xem** = số bản ghi `video_views` của video. `videos.views_count` là bộ đếm tự cập nhật bằng trigger, UI không cho sửa tay.
2. **Dung lượng storage** = tổng `file_size_bytes + thumbnail_size_bytes` của tất cả video (video dạng URL tính 0).
3. **Thumbnail hợp lệ**: nếu cả upload và URL đều bỏ trống thì hiển thị placeholder.
4. **Xóa user**: không xóa cứng. Dùng `is_active = false` để khóa (tính năng ở phần Mở rộng).
5. **Username** không phân biệt hoa thường, chỉ gồm chữ, số, dấu gạch dưới, 3–30 ký tự.

## 6. Yêu cầu phi chức năng

- **Giao diện**: light mode, nền trắng, nhất quán theo `UI_GUIDELINES.md`.
- **Responsive**: 375px, 768px, 1280px. Bảng cuộn ngang trên màn nhỏ; sidebar thu gọn thành menu.
- **Bảo mật**: RLS mọi bảng; chống XSS; không lộ khóa bí mật; thông báo lỗi đăng nhập chung.
- **Hiệu năng**: danh sách phân trang phía server; thống kê tính trong database (RPC), không tải toàn bộ bảng về client.
- **Trình duyệt**: Chrome, Edge, Firefox, Safari bản mới.
- **Khả năng truy cập**: label gắn với input, thứ tự Tab hợp lý, tương phản đủ, `alt` cho thumbnail.

## 7. Giả định cần xác nhận

Các điểm sau chưa được bạn chốt rõ, tài liệu đang giả định như dưới đây. Hãy sửa nếu khác ý:

| # | Giả định hiện tại | Ảnh hưởng nếu đổi |
|---|---|---|
| 1 | Ngôn ngữ giao diện: **tiếng Việt** | Đổi toàn bộ chuỗi UI |
| 2 | Đăng ký tự do, tài khoản mới là USER và không vào được admin | Có thể cần luồng duyệt/mời admin |
| 3 | Tắt xác nhận email khi đăng ký trong môi trường dev | Bật lại thì cần cấu hình SMTP/email |
| 4 | Biểu đồ dùng Chart.js qua CDN | Đổi thư viện thì sửa phần Dashboard |
| 5 | Giới hạn 50 MB/video (giới hạn mặc định của gói Free) | Gói trả phí có thể tăng |
| 6 | Cần thêm trang `reset-password.html` ngoài 3 trang đã nêu | Không có thì quên mật khẩu không hoàn chỉnh |
| 7 | Lượt xem được ghi qua RPC `track_view` (dùng cho trình phát công khai sau này); dữ liệu demo tạo bằng seed | Cần trang/app khác để ghi view thật |
| 8 | Thống kê theo múi giờ `Asia/Ho_Chi_Minh` | Đổi tham số trong RPC |

## 8. Dữ liệu mẫu

- 5 category, 6 tag, 12 video demo và vài trăm lượt xem trong 90 ngày gần nhất (xem `DATABASE.md`, phần Seed).
- 2 tài khoản demo (xem `README.md`).
