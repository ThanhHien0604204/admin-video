# UI_GUIDELINES — Video Admin

Giao diện **sáng (light mode)**, nền trắng, gọn gàng, ưu tiên dễ đọc số liệu.

## 1. Design token (đặt trong `assets/css/base.css`)

```css
:root {
  /* Màu nền */
  --bg: #ffffff;
  --bg-subtle: #f8fafc;
  --bg-hover: #f1f5f9;

  /* Viền */
  --border: #e2e8f0;
  --border-strong: #cbd5e1;

  /* Chữ */
  --text: #0f172a;
  --text-muted: #64748b;

  /* Màu thương hiệu và trạng thái */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-soft: #eff6ff;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --success: #16a34a;
  --success-soft: #f0fdf4;
  --warning: #d97706;
  --warning-soft: #fffbeb;

  /* Khoảng cách (bội số của 4px) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 24px; --space-6: 32px;

  /* Bo góc, đổ bóng */
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.1);

  /* Chữ */
  --font: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.5;
}
```

Font Inter nạp từ Google Fonts (hỗ trợ tiếng Việt). Cỡ chữ: tiêu đề trang 22px/600, tiêu đề thẻ 16px/600, nội dung 14px/400, chú thích 12px.

## 2. Bố cục

- **Trang admin**: sidebar trái rộng 240px (nền `--bg-subtle`, viền phải `--border`) + topbar cao 56px + vùng nội dung tối đa 1200px, đệm 24px.
- **Dưới 768px**: sidebar ẩn, mở bằng nút menu; bảng cuộn ngang trong khung.
- **Trang xác thực**: thẻ căn giữa, rộng tối đa 400px, nền trang `--bg-subtle`, thẻ nền trắng có viền và `--shadow`.

## 3. Thành phần (components)

| Thành phần | Quy tắc |
|---|---|
| Button chính | Nền `--primary`, chữ trắng, cao 36px, bo `--radius`, hover `--primary-hover` |
| Button phụ | Nền trắng, viền `--border-strong` |
| Button nguy hiểm (Delete) | Chữ `--danger`, viền `--danger`; trong hộp thoại xác nhận dùng nền `--danger` |
| Input | Cao 36px, viền `--border-strong`, focus viền `--primary` + vòng sáng 3px `--primary-soft`; lỗi viền `--danger` + thông báo 12px bên dưới |
| Card số liệu | Nền trắng, viền `--border`, bo `--radius-lg`, số lớn 28px/600, nhãn 13px `--text-muted` |
| Bảng | Header nền `--bg-subtle`, chữ 12px in hoa nhẹ `--text-muted`; dòng cao 64px (do thumbnail); hover `--bg-hover`; viền dưới mỗi dòng |
| Badge trạng thái | Published = success, Draft = warning, Hidden = xám |
| Modal xác nhận | Nền mờ `rgba(15,23,42,.4)`, hộp trắng rộng 420px, hai nút Hủy và Xác nhận; đóng bằng phím Esc |
| Toast | Góc trên phải, tự ẩn sau 4 giây; xanh = thành công, đỏ = lỗi |
| Phân trang | Nút Trước/Sau, số trang, dòng "Hiển thị x–y trên tổng z" |
| Skeleton | Khối xám `--bg-hover` có hiệu ứng nhấp nháy nhẹ khi tải |
| Empty state | Biểu tượng đơn giản, câu mô tả, nút hành động (ví dụ "Thêm video đầu tiên") |

## 4. Biểu đồ (Chart.js)

- Biểu đồ cột (top 10): màu `--primary`, bo góc cột 4px, lưới ngang nhạt `--border`, không viền khung. Nhãn trục X dài thì cắt còn 14 ký tự + "…", tooltip hiện đủ tên.
- Biểu đồ line (lượt xem): đường `--primary` dày 2px, vùng tô dưới đường `--primary-soft`, điểm chỉ hiện khi hover, `tension` 0.3.
- Cả hai: bỏ legend nếu chỉ một dòng dữ liệu, tiêu đề đặt ở thẻ chứa (không đặt trong canvas), `maintainAspectRatio: false` với chiều cao khung cố định 320px.
- Công tắc **Ngày / Tháng** dạng segmented control phía trên biểu đồ line.
- Có skeleton khi tải và thông báo "Chưa có dữ liệu" khi rỗng.

## 5. Wireframe

### Login / Register / Forgot Password
```
┌──────────────────────────────┐
│        [logo] Video Admin     │
│        Đăng nhập              │
│  Email    [______________]    │
│  Mật khẩu [______________] 👁 │
│  [        Đăng nhập        ]  │
│  Quên mật khẩu?  |  Đăng ký   │
└──────────────────────────────┘
```

### Dashboard
```
┌─────────┬──────────────────────────────────────────────┐
│ Sidebar │ Dashboard                          admin1 ▾  │
│         ├──────────────┬──────────────┬────────────────┤
│ ▣ Dash  │ Tổng video   │ Tổng lượt xem│ Dung lượng     │
│ ▶ Video │ 12           │ 1.234        │ 75,0 MB        │
│         ├──────────────┴──────────────┴────────────────┤
│         │ Top 10 video nhiều lượt xem                  │
│         │  ▇  ▆  ▅  ▅  ▄  ▃  ▃  ▂  ▂  ▁  (biểu đồ cột)│
│         ├──────────────────────────────────────────────┤
│         │ Lượt xem theo thời gian      [Ngày | Tháng]  │
│         │  ╱╲  ╱╲╱╲   (biểu đồ line)                    │
└─────────┴──────────────────────────────────────────────┘
```

### List Video
```
┌─────────┬──────────────────────────────────────────────┐
│ Sidebar │ Videos                         [+ Thêm video]│
│         │ [🔍 Tìm theo title ] [Category ▾] [Sắp xếp ▾]│
│         ├────┬──────────┬────────────────┬──────┬──────┤
│         │ ID │ Thumbnail│ Title          │ Views│ Action│
│         ├────┼──────────┼────────────────┼──────┼──────┤
│         │ 12 │ [ảnh]    │ Video demo 12  │ 1.020│ Edit Delete│
│         │ …  │          │                │      │      │
│         ├────┴──────────┴────────────────┴──────┴──────┤
│         │ Hiển thị 1–10 trên tổng 12     ‹ 1 2 ›       │
└─────────┴──────────────────────────────────────────────┘
```

### Video Form
```
┌─────────┬──────────────────────────────────────────────┐
│ Sidebar │ Thêm video                                    │
│         │ Title*       [_______________________]        │
│         │ Description  [_______________________]        │
│         │ Category     [ Chọn ▾ ]   Status [Published ▾]│
│         │ Nguồn video  (•) Upload file  ( ) URL         │
│         │ File video   [Chọn file…]  mp4/webm/mov ≤50MB │
│         │ Thumbnail    [Chọn ảnh…] hoặc dán URL  [xem trước]│
│         │              [Hủy]  [Lưu]                     │
└─────────┴──────────────────────────────────────────────┘
```

## 6. Nội dung giao diện (tiếng Việt)

| Ngữ cảnh | Văn bản |
|---|---|
| Đăng nhập thất bại | Email hoặc mật khẩu không đúng |
| Không có quyền | Bạn không có quyền truy cập khu vực quản trị |
| Lưu thành công | Đã lưu video |
| Xóa (xác nhận) | Bạn có chắc muốn xóa video "{title}"? Hành động này không thể hoàn tác |
| Danh sách rỗng | Chưa có video nào |
| Lỗi mạng | Không kết nối được máy chủ, vui lòng thử lại |

## 7. Khả năng truy cập và responsive

- Mọi input có `<label for>`; nút chỉ có biểu tượng phải có `aria-label`.
- Tương phản chữ/nền đạt tối thiểu 4.5:1; trạng thái không chỉ dựa vào màu (có chữ/biểu tượng).
- Focus nhìn thấy rõ (vòng sáng), thứ tự Tab theo thứ tự đọc.
- Thumbnail có `alt` là title video.
- Kiểm tra ở 375px, 768px, 1280px.
