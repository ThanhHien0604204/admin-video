# PROMPTS — Prompt mẫu để Vibe Coding

Dùng với Claude Code, Cursor hoặc bất kỳ trợ lý AI nào đọc được thư mục dự án. Mỗi prompt tương ứng một task trong `docs/TASKS.md`. Sao chép, thay phần `{...}` nếu cần.

## Nguyên tắc vibe coding hiệu quả

1. **Một task mỗi lượt.** Prompt nhỏ cho kết quả chính xác hơn prompt "làm cả website".
2. **Chạy thử ngay** sau mỗi lượt, rồi mới sang task tiếp theo.
3. **Gửi lỗi nguyên văn.** Dán thông báo trong Console (F12) hoặc tab Network thay vì mô tả bằng lời.
4. **Commit sau mỗi task chạy được** (`git commit`), để quay lại được khi AI làm hỏng.
5. **Bắt AI giải thích** khi bạn chưa hiểu: "giải thích đoạn này theo từng dòng".
6. **Kiểm tra lại bằng `TEST_CHECKLIST.md`**, đừng chỉ tin vào "đã chạy".

---

## Prompt 0 — Khởi động phiên (dùng đầu mỗi phiên làm việc)

```
Hãy đọc AGENTS.md, docs/PRD.md, docs/ARCHITECTURE.md, docs/DATABASE.md,
docs/UI_GUIDELINES.md và docs/TASKS.md.
Sau đó:
1. Tóm tắt dự án bằng tiếng Việt trong tối đa 10 dòng.
2. Cho biết task tiếp theo chưa hoàn thành trong docs/TASKS.md.
3. Liệt kê các điểm còn mơ hồ cần tôi xác nhận.
Chưa viết code.
```

## Prompt 0.2 — Tạo cấu trúc dự án

```
Thực hiện task 0.2 trong docs/TASKS.md: tạo toàn bộ thư mục và file rỗng
theo mục 4 của README.md. Mỗi file HTML có khung HTML5 cơ bản (lang="vi",
viewport, tiêu đề đúng trang). config.js dùng placeholder cho URL và key.
Sau khi xong, liệt kê cây thư mục đã tạo.
```

## Prompt 1 — CSS nền tảng và tiện ích

```
Thực hiện task 1.1 đến 1.3. Dùng đúng design token trong docs/UI_GUIDELINES.md.
Viết supabaseClient.js, utils.js theo mẫu trong docs/ARCHITECTURE.md.
ui.js gồm: toast(message, type), confirmDialog({title, message, confirmText})
trả về Promise<boolean>, và renderLayout(activePage, profile) dựng sidebar + topbar.
Cuối cùng hướng dẫn tôi cách test từng hàm trong Console.
```

## Prompt 2.2 — Trang đăng nhập

```
Thực hiện task 2.2: login.html + assets/js/pages/login.js + auth.js.
Yêu cầu theo mục 4.1 của docs/PRD.md: đăng nhập bằng signInWithPassword,
sau đó đọc public.users, chỉ cho ADMIN đang is_active vào dashboard.html,
USER bị đăng xuất kèm thông báo "Bạn không có quyền truy cập khu vực quản trị".
Sai thông tin chỉ hiện một thông báo chung. Có trạng thái đang đăng nhập.
Gọi Supabase thông qua auth.js, không gọi trực tiếp trong page.
Sau khi xong, hướng dẫn tôi test với admin1 và user1 và cho biết kết quả mong đợi.
```

## Prompt 2.3 — Đăng ký

```
Thực hiện task 2.3: register.html + register.js theo mục 4.2 của PRD.
Validate: username 3–30 ký tự chỉ gồm chữ, số, gạch dưới; email đúng định dạng;
mật khẩu >= 6 ký tự; xác nhận mật khẩu khớp. Gọi RPC is_username_available
trước signUp, truyền username qua options.data. Tài khoản mới là USER (do DB gán).
```

## Prompt 2.4 và 2.5 — Quên và đặt lại mật khẩu

```
Thực hiện task 2.4 và 2.5 theo mục 4.3 và 4.4 của PRD. Dùng resetPasswordForEmail
với redirectTo trỏ về reset-password.html cùng origin. Trang reset lắng nghe sự kiện
PASSWORD_RECOVERY của onAuthStateChange rồi mới cho đặt mật khẩu mới bằng updateUser.
Luôn hiện thông báo chung ở trang quên mật khẩu.
```

## Prompt 3 — Khung trang admin

```
Thực hiện task 3.1: tạo layout dùng chung (sidebar: Dashboard, Videos; topbar: tên
người dùng + nút Đăng xuất; menu mobile). Mọi trang admin gọi requireAdmin() trước khi
render. Sau Đăng xuất, bấm nút Back không được vào lại trang admin.
```

## Prompt 4 — List Video

```
Thực hiện task 4.1 đến 4.3: videos.html + videos.js + videoService.listVideos.
Bảng gồm id, thumbnail, title (kèm badge status), views, action (Edit, Delete).
Phân trang phía server 10 dòng/trang, tìm kiếm debounce 300ms, lọc category,
sắp xếp. Có skeleton khi tải, empty state, thông báo lỗi kèm nút Thử lại.
Chống XSS: không dùng innerHTML với dữ liệu người dùng nếu chưa escapeHtml.
```

```
Thực hiện task 4.4: nút Delete mở confirmDialog nêu tên video. Khi xác nhận:
xóa bản ghi trong bảng videos, nếu source_type = 'UPLOAD' thì xóa luôn file video
và thumbnail trong Storage. Báo thành công/thất bại bằng toast và tải lại danh sách.
Nêu rõ thứ tự xóa bạn chọn và lý do (nếu xóa file lỗi thì chuyện gì xảy ra).
```

## Prompt 5 — Video Form

```
Thực hiện task 5.1 đến 5.3: video-form.html + videoForm.js ở chế độ thêm.
Theo mục 4.7 của PRD: title, description, category, status, nguồn video
(Upload file hoặc URL), thumbnail (upload hoặc URL, có xem trước).
Validate loại file và dung lượng (video 50 MB, ảnh 5 MB) TRƯỚC khi upload.
Khi upload hiện spinner và khóa nút Lưu. Lưu file_size_bytes từ file.size.
```

```
Thực hiện task 5.4 và 5.5: chế độ sửa (?id=). Tải dữ liệu cũ vào form.
Khi người dùng thay file hoặc chuyển nguồn, xóa file cũ trong Storage sau khi
cập nhật bản ghi thành công. Chống bấm Lưu nhiều lần.
```

## Prompt 6 — Dashboard

```
Thực hiện task 6.1 và 6.2: dashboardService.js gọi 3 RPC (get_dashboard_stats,
get_top_videos, get_views_timeseries) và dashboard.html hiển thị 3 thẻ số liệu
(định dạng số vi-VN, dung lượng B/KB/MB/GB bằng formatBytes).
```

```
Thực hiện task 6.3 và 6.4: dùng Chart.js. Biểu đồ cột top 10 video nhiều lượt xem
(nhãn trục X cắt 14 ký tự, tooltip hiện đủ tên). Biểu đồ line lượt xem với công tắc
Ngày/Tháng (mặc định 30 ngày gần nhất; Tháng là 12 tháng). Màu và kiểu theo mục 4
của docs/UI_GUIDELINES.md. Mỗi biểu đồ có skeleton, empty và error state.
```

## Prompt 7 — Hoàn thiện

```
Rà soát toàn bộ dự án theo Definition of Done trong AGENTS.md:
1. Tìm chỗ nào còn dùng innerHTML với dữ liệu chưa escape.
2. Tìm chỗ nào gọi supabase trực tiếp trong pages/.
3. Tìm màu hard-code ngoài base.css.
4. Kiểm tra mỗi trang đã có loading/empty/error.
5. Kiểm tra responsive 375/768/1280.
Liệt kê vấn đề theo mức độ nghiêm trọng, chưa sửa. Tôi sẽ chọn mục cần sửa.
```

---

## Prompt tiện ích

### Sửa lỗi
```
Tôi gặp lỗi khi {mô tả thao tác}.
Console báo:
{dán nguyên văn lỗi}
Tab Network request {tên request} trả về {status} với nội dung:
{dán response}
Hãy giải thích nguyên nhân có khả năng nhất, nêu cách kiểm chứng, rồi mới đề xuất sửa.
```

### Hiểu code
```
Giải thích file {tên file} theo từng khối, dành cho người mới học JavaScript.
Chỉ ra dòng nào gọi Supabase và dữ liệu đi theo đường nào.
```

### Thêm tính năng mới
```
Tôi muốn thêm {tính năng}. Trước khi code, hãy: (1) nêu ảnh hưởng tới database,
(2) liệt kê file sẽ sửa, (3) đề xuất cập nhật PRD/DATABASE/TASKS. Chờ tôi đồng ý.
```

### Sinh test case
```
Dựa trên docs/PRD.md mục {số mục}, viết thêm test case dạng bảng
(ID, Module, Test case, Các bước, Kết quả mong đợi, Ưu tiên) để tôi nhập vào Excel.
Ghi rõ đây là đề xuất và chỉ ra giả định nào bạn đã dùng.
```
