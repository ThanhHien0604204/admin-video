# TEST_CHECKLIST — Kiểm thử thủ công

Bộ test case khởi điểm bám theo `PRD.md`. Đây là **đề xuất**, bạn nên rà soát và bổ sung trước khi dùng chính thức. Định dạng bảng có thể sao chép sang Excel/Google Sheets để import vào Jira hoặc Azure DevOps.

**Môi trường test**: Chrome bản mới, `http://localhost:5500`, dữ liệu seed theo `DATABASE.md` Phần 7.
**Tài khoản**: admin1@gmail.com / 123456 (ADMIN), user1@gmail.com / 123456 (USER).
**Cột Kết quả**: điền Pass / Fail / Blocked khi chạy.

---

## 1. Đăng nhập (AUTH)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| AUTH-01 | Đăng nhập admin hợp lệ | Mở login.html, nhập admin1@gmail.com / 123456, bấm Đăng nhập | Chuyển tới dashboard.html, topbar hiện admin1 | High | |
| AUTH-02 | Sai mật khẩu | Nhập admin1@gmail.com và mật khẩu sai | Thông báo "Email hoặc mật khẩu không đúng", ở lại trang | High | |
| AUTH-03 | Email không tồn tại | Nhập email chưa đăng ký | Cùng thông báo như AUTH-02 (không lộ email có tồn tại) | Medium | |
| AUTH-04 | USER bị từ chối | Đăng nhập user1@gmail.com / 123456 | Thông báo không có quyền, phiên bị đăng xuất, không vào được dashboard | High | |
| AUTH-05 | Để trống trường | Bấm Đăng nhập khi trống | Báo lỗi từng trường, không gọi API (kiểm tra tab Network) | Medium | |
| AUTH-06 | Email sai định dạng | Nhập `abc` vào Email | Báo lỗi định dạng email | Medium | |
| AUTH-07 | Truy cập trang admin khi chưa đăng nhập | Mở trực tiếp dashboard.html, videos.html, video-form.html | Tự chuyển về login.html | High | |
| AUTH-08 | Đã đăng nhập mở lại login | Đăng nhập admin1, mở login.html | Tự chuyển về dashboard.html | Low | |
| AUTH-09 | Đăng xuất | Bấm Đăng xuất, sau đó bấm nút Back của trình duyệt | Về login.html; Back không vào lại được trang admin | High | |
| AUTH-10 | Giữ phiên khi tải lại | Đăng nhập, nhấn F5 ở dashboard | Vẫn ở dashboard, không phải đăng nhập lại | Medium | |
| AUTH-11 | Nút hiện/ẩn mật khẩu | Bấm biểu tượng con mắt | Chuyển đổi hiển thị mật khẩu | Low | |

## 2. Đăng ký (REG)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| REG-01 | Đăng ký hợp lệ | Nhập username `newuser1`, email `new1@gmail.com`, mật khẩu `123456`, xác nhận khớp | Thông báo thành công, có dòng mới trong `public.users` với role USER | High | |
| REG-02 | Email đã tồn tại | Đăng ký với admin1@gmail.com | Thông báo "Email đã được sử dụng" | High | |
| REG-03 | Username trùng | Đăng ký với username `admin1` rồi `ADMIN1` | Báo username đã tồn tại (không phân biệt hoa thường) | High | |
| REG-04 | Mật khẩu ngắn | Mật khẩu `12345` | Báo lỗi tối thiểu 6 ký tự | High | |
| REG-05 | Xác nhận mật khẩu không khớp | Nhập hai mật khẩu khác nhau | Báo lỗi không khớp | Medium | |
| REG-06 | Username không hợp lệ | Thử `ab`, `ab cd`, `abc!`, chuỗi 31 ký tự | Báo lỗi định dạng/độ dài | Medium | |
| REG-07 | Không thể tự cấp quyền ADMIN | Dùng DevTools gửi signUp với `data: { username: 'x1y2', role: 'ADMIN' }` | Tài khoản vẫn có role USER | High | |
| REG-08 | Tài khoản mới vào admin | Đăng nhập bằng tài khoản vừa tạo | Bị từ chối như AUTH-04 | High | |

## 3. Quên mật khẩu (FP)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| FP-01 | Email hợp lệ có tài khoản | Nhập email thật đã đăng ký, bấm Gửi | Thông báo chung; nhận được email chứa link | High | |
| FP-02 | Email không có tài khoản | Nhập email chưa đăng ký | Cùng thông báo chung, không lộ thông tin | Medium | |
| FP-03 | Email sai định dạng | Nhập `abc` | Báo lỗi định dạng | Medium | |
| FP-04 | Đặt lại mật khẩu qua link | Mở link trong email, nhập mật khẩu mới | Đổi thành công, đăng nhập được bằng mật khẩu mới | High | |
| FP-05 | Link hết hạn / đã dùng | Mở lại link đã dùng | Thông báo link không hợp lệ kèm đường quay lại | Medium | |
| FP-06 | Khóa nút sau khi gửi | Bấm Gửi hai lần liên tiếp | Nút bị khóa 60 giây | Low | |

*Lưu ý: SMTP mặc định của Supabase giới hạn số email, nên test FP có thể bị Blocked nếu gửi quá nhiều.*

## 4. Dashboard (DB)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| DB-01 | Ba thẻ số liệu | Mở dashboard, so sánh với SQL ở `DATABASE.md` mục 8 | Tổng video, tổng lượt xem, dung lượng khớp SQL | High | |
| DB-02 | Định dạng dung lượng | Đặt `file_size_bytes` các giá trị 0, 2048, 5242880, 2147483648 | Hiển thị 0 B, 2,0 KB, 5,0 MB, 2,0 GB | Medium | |
| DB-03 | Biểu đồ cột top 10 | Xem biểu đồ | Đúng 10 video, giảm dần theo views, khớp SQL | High | |
| DB-04 | Ít hơn 10 video | Xóa bớt còn 3 video | Biểu đồ chỉ có 3 cột, không lỗi | Low | |
| DB-05 | Tooltip tên dài | Đặt tên video dài hơn 14 ký tự, rê chuột | Nhãn trục bị cắt, tooltip hiện đủ tên | Low | |
| DB-06 | Line chart theo ngày | Mở mặc định | 30 điểm ngày gần nhất; ngày không có view hiển thị 0 | High | |
| DB-07 | Chuyển sang theo tháng | Bấm "Tháng" | 12 điểm tháng, tổng khớp SQL | High | |
| DB-08 | Không có dữ liệu | Xóa hết video_views | Hiện "Chưa có dữ liệu", không lỗi Console | Medium | |
| DB-09 | Lỗi mạng | Tắt mạng (DevTools → Offline), tải lại | Thông báo lỗi thân thiện và nút Thử lại | Medium | |
| DB-10 | Lượt xem mới | Gọi `track_view` cho một video, tải lại dashboard | Tổng lượt xem tăng đúng 1, điểm của ngày hôm nay tăng 1 | Medium | |
| DB-11 | Múi giờ | Thêm view lúc 23:30 giờ Việt Nam | Tính vào đúng ngày giờ Việt Nam | Low | |

## 5. List Video (VL)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| VL-01 | Hiển thị cột | Mở videos.html | Có đủ id, thumbnail, title, views, action (Edit, Delete) | High | |
| VL-02 | Phân trang | Có 12 video, bấm trang 2 | Trang 1 có 10 dòng, trang 2 có 2 dòng; "Hiển thị 11–12 trên tổng 12" | High | |
| VL-03 | Tìm kiếm | Gõ `demo 1` | Lọc đúng, không phân biệt hoa thường, trễ khoảng 300ms | Medium | |
| VL-04 | Tìm không có kết quả | Gõ `zzzz` | Hiện empty state | Medium | |
| VL-05 | Lọc category | Chọn một category | Chỉ hiện video thuộc category đó | Medium | |
| VL-06 | Sắp xếp theo views | Chọn sắp xếp views giảm dần | Thứ tự đúng | Medium | |
| VL-07 | Thumbnail lỗi | Đặt thumbnail_url sai | Hiện ảnh placeholder | Low | |
| VL-08 | Hủy xóa | Bấm Delete, chọn Hủy | Video vẫn còn | High | |
| VL-09 | Xóa video dạng URL | Delete, xác nhận | Biến mất khỏi danh sách; DB không còn video và `video_views` của nó | High | |
| VL-10 | Xóa video dạng upload | Delete video có file trong Storage | File video và thumbnail trong Storage cũng bị xóa | High | |
| VL-11 | Mở Edit | Bấm Edit | Chuyển tới form, dữ liệu điền sẵn đúng | High | |
| VL-12 | Đóng modal bằng Esc | Mở modal xóa, nhấn Esc | Modal đóng, không xóa | Low | |

## 6. Video Form (VF)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| VF-01 | Thêm video bằng URL | Nhập title, chọn nguồn URL, dán link, Lưu | Tạo thành công, xuất hiện ở List Video | High | |
| VF-02 | Thêm video upload | Chọn file mp4 nhỏ hơn 50 MB, Lưu | File có trong bucket `videos`, `file_size_bytes` > 0, dung lượng Dashboard tăng | High | |
| VF-03 | File sai định dạng | Chọn `.pdf` hoặc `.exe` | Bị chặn trước khi upload, báo lỗi rõ | High | |
| VF-04 | File vượt 50 MB | Chọn file lớn hơn 50 MB | Báo lỗi dung lượng, không upload | High | |
| VF-05 | Title trống | Để trống title, Lưu | Báo lỗi bắt buộc | High | |
| VF-06 | Title quá dài | Nhập 151 ký tự | Báo lỗi tối đa 150 | Medium | |
| VF-07 | URL không hợp lệ | Nhập `abc` ở Video URL | Báo lỗi phải bắt đầu bằng http/https | Medium | |
| VF-08 | Thumbnail upload hợp lệ | Chọn ảnh jpg dưới 5 MB | Có xem trước, lưu được | Medium | |
| VF-09 | Thumbnail sai định dạng hoặc lớn | Chọn gif hoặc ảnh trên 5 MB | Bị chặn | Medium | |
| VF-10 | Sửa video | Đổi title, Lưu | Danh sách cập nhật, `updated_at` đổi | High | |
| VF-11 | Đổi nguồn từ upload sang URL | Sửa video upload, chuyển sang URL, Lưu | File cũ bị xóa khỏi Storage, dung lượng Dashboard giảm | Medium | |
| VF-12 | Bấm Lưu nhiều lần | Bấm Lưu liên tiếp nhanh | Chỉ tạo 1 bản ghi; nút bị khóa khi đang xử lý | Medium | |
| VF-13 | Mở form sửa với id không tồn tại | Mở `video-form.html?id=99999` | Thông báo không tìm thấy, không lỗi trắng trang | Low | |
| VF-14 | Hủy form | Nhập dữ liệu, bấm Hủy | Về danh sách, không tạo bản ghi | Low | |

## 7. Bảo mật (SEC)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| SEC-01 | XSS qua title | Tạo video title `<img src=x onerror=alert(1)>` | Hiển thị dạng chữ, không chạy script, ở List Video, Dashboard, form | High | |
| SEC-02 | Ghi khi chưa đăng nhập | Dùng khóa anon, không có JWT, gọi REST `POST /rest/v1/videos` | 401/403 hoặc bị RLS chặn | High | |
| SEC-03 | USER gọi RPC admin | Đăng nhập user1 (token), gọi `get_dashboard_stats` | Lỗi `forbidden` | High | |
| SEC-04 | USER tự nâng quyền | Dùng token user1, `PATCH /rest/v1/users?id=eq.<id>` với `role: ADMIN` | Bị trigger chặn, role không đổi | High | |
| SEC-05 | USER upload Storage | Dùng token user1 upload vào bucket `videos` | Bị chặn | High | |
| SEC-06 | USER ghi bảng videos | Dùng token user1 `POST /rest/v1/videos` | Bị RLS chặn | High | |
| SEC-07 | Lộ khóa bí mật | Tìm `service_role`/`secret` trong toàn bộ mã nguồn và tab Network | Không xuất hiện | High | |
| SEC-08 | Tài khoản bị khóa | Đặt `is_active = false` cho admin1, đăng nhập | Bị từ chối | Medium | |
| SEC-09 | USER đọc video DRAFT | Dùng token user1 `GET /rest/v1/videos` khi có video DRAFT | Chỉ thấy video PUBLISHED | Medium | |
| SEC-10 | Tất cả bảng bật RLS | Chạy truy vấn `pg_tables` ở `DATABASE.md` mục 8 | `rowsecurity = true` cho mọi bảng | High | |

## 8. Giao diện và tương thích (UI)

| ID | Test case | Các bước | Kết quả mong đợi | Ưu tiên | Kết quả |
|---|---|---|---|---|---|
| UI-01 | Light mode | Xem mọi trang | Nền trắng, đúng bảng màu `UI_GUIDELINES.md` | Medium | |
| UI-02 | Responsive 375px | DevTools chọn 375px | Không vỡ layout; sidebar thành menu; bảng cuộn ngang | Medium | |
| UI-03 | Responsive 768px, 1280px | Kiểm tra từng kích thước | Hiển thị hợp lý | Medium | |
| UI-04 | Trạng thái loading/empty/error | Quan sát từng trang | Mỗi trang có đủ 3 trạng thái | Medium | |
| UI-05 | Phím Enter gửi form | Nhấn Enter ở form login/register | Form được gửi | Low | |
| UI-06 | Thứ tự Tab và focus | Dùng bàn phím di chuyển | Thứ tự hợp lý, vòng focus nhìn thấy rõ | Low | |
| UI-07 | Trình duyệt khác | Lặp lại luồng chính ở Edge, Firefox, Safari | Hoạt động giống Chrome | Low | |
| UI-08 | Không lỗi Console | Đi qua mọi trang | Console không có lỗi đỏ | Medium | |

---

## Tổng kết

| Nhóm | Tổng | Pass | Fail | Blocked |
|---|---|---|---|---|
| AUTH | 11 | | | |
| REG | 8 | | | |
| FP | 6 | | | |
| DB | 11 | | | |
| VL | 12 | | | |
| VF | 14 | | | |
| SEC | 10 | | | |
| UI | 8 | | | |
| **Cộng** | **80** | | | |

## Mẫu bug report (cấu trúc cơ bản, sẽ thay bằng mẫu chính thức của công ty khi bạn cung cấp)

```
Tiêu đề lỗi:
Môi trường test: (trình duyệt, phiên bản, URL, tài khoản)
Các bước tái hiện:
1.
2.
Kết quả mong đợi:
Kết quả thực tế:
Mức độ nghiêm trọng / Ưu tiên:
Ảnh / log đính kèm: (Console, Network)
```
