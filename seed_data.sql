-- ========================================================
-- SEED SCRIPT (Chạy sau khi tạo 2 user admin1@gmail.com & user1@gmail.com)
-- ========================================================

-- 1. Cấp quyền ADMIN cho admin1 (user1 giữ role USER)
update public.users set role = 'ADMIN' where email = 'admin1@gmail.com';

-- 2. Tạo 12 video demo (nguồn URL)
insert into public.videos
  (title, description, thumbnail_url, video_url, source_type, category_id,
   status, created_by, duration_seconds, created_at)
select
  'Video demo ' || g,
  'Mô tả cho video demo số ' || g,
  'https://picsum.photos/seed/video' || g || '/320/180',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'URL',
  (select id from public.video_categories order by id offset (g % 5) limit 1),
  'PUBLISHED',
  (select id from public.users where email = 'admin1@gmail.com'),
  60 + g * 7,
  now() - (g || ' days')::interval
from generate_series(1, 12) as g;

-- 3. Tạo lượt xem ngẫu nhiên trong 90 ngày (trigger sẽ tự tăng views_count)
insert into public.video_views (video_id, viewed_at)
select v.id, now() - (random() * interval '90 days')
from public.videos v
cross join lateral generate_series(1, 20 + ((v.id * 37) % 180)::int) as n;

-- 4. Giả lập một số video có dung lượng storage để hiển thị thẻ Dung lượng
update public.videos set file_size_bytes = 25 * 1024 * 1024, thumbnail_size_bytes = 150 * 1024 where id in (1, 2, 3);
