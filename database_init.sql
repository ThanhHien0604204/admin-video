-- ========================================================
-- DATABASE INITIALIZATION SCRIPT FOR VIDEO ADMIN (SUPABASE)
-- Copy toàn bộ nội dung file này và chạy trong Supabase SQL Editor
-- ========================================================

-- PHẦN 1 — Tạo bảng
-- 1.1 users (hồ sơ liên kết với auth.users)
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  email       text not null,
  role        text not null default 'USER',
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint users_role_check check (role in ('ADMIN', 'USER')),
  constraint users_username_format check (username ~ '^[A-Za-z0-9_]{3,30}$')
);
create unique index if not exists users_username_key on public.users (lower(username));
create unique index if not exists users_email_key on public.users (lower(email));

-- 1.2 video_categories
create table if not exists public.video_categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now(),
  constraint video_categories_name_len check (char_length(name) between 1 and 100)
);
create unique index if not exists video_categories_name_key on public.video_categories (lower(name));

-- 1.3 videos
create table if not exists public.videos (
  id                   bigint generated always as identity primary key,
  title                text not null,
  description          text,
  category_id          bigint references public.video_categories (id) on delete set null,
  source_type          text not null default 'URL',
  video_url            text,
  video_path           text,
  thumbnail_url        text,
  thumbnail_path       text,
  duration_seconds     integer check (duration_seconds is null or duration_seconds >= 0),
  file_size_bytes      bigint not null default 0 check (file_size_bytes >= 0),
  thumbnail_size_bytes bigint not null default 0 check (thumbnail_size_bytes >= 0),
  views_count          integer not null default 0 check (views_count >= 0),
  status               text not null default 'PUBLISHED',
  created_by           uuid references public.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint videos_title_len check (char_length(title) between 1 and 150),
  constraint videos_source_check check (source_type in ('UPLOAD', 'URL')),
  constraint videos_status_check check (status in ('DRAFT', 'PUBLISHED', 'HIDDEN')),
  constraint videos_source_fields check (
    (source_type = 'URL' and video_url is not null)
    or (source_type = 'UPLOAD' and video_path is not null)
  )
);
create index if not exists videos_created_at_idx  on public.videos (created_at desc);
create index if not exists videos_category_idx    on public.videos (category_id);
create index if not exists videos_views_count_idx on public.videos (views_count desc);
create index if not exists videos_status_idx      on public.videos (status);

-- 1.4 tags + video_tags
create table if not exists public.tags (
  id         bigint generated always as identity primary key,
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);
create unique index if not exists tags_name_key on public.tags (lower(name));

create table if not exists public.video_tags (
  video_id bigint not null references public.videos (id) on delete cascade,
  tag_id   bigint not null references public.tags (id) on delete cascade,
  primary key (video_id, tag_id)
);

-- 1.5 video_views
create table if not exists public.video_views (
  id        bigint generated always as identity primary key,
  video_id  bigint not null references public.videos (id) on delete cascade,
  viewer_id uuid references public.users (id) on delete set null,
  viewed_at timestamptz not null default now()
);
create index if not exists video_views_video_idx     on public.video_views (video_id);
create index if not exists video_views_viewed_at_idx on public.video_views (viewed_at);

-- 1.6 activity_logs
create table if not exists public.activity_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.users (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

-- ========================================================
-- PHẦN 2 — Hàm và Trigger
-- ========================================================

-- 2.1 is_admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'ADMIN' and u.is_active
  );
$$;

-- 2.2 set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2.3 protect_user_columns
create or replace function public.protect_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and (new.role is distinct from old.role
          or new.is_active is distinct from old.is_active) then
    raise exception 'Not allowed to change role or status' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

-- 2.4 handle_new_user (Trigger khi có auth.users mới)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, email, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      left(regexp_replace(split_part(new.email, '@', 1), '[^A-Za-z0-9_]', '_', 'g'), 30)
    ),
    new.email,
    'USER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2.5 increment_video_views
create or replace function public.increment_video_views()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.videos set views_count = views_count + 1 where id = new.video_id;
  return new;
end;
$$;

-- Gắn Triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_users_protect on public.users;
create trigger trg_users_protect
  before update on public.users
  for each row execute function public.protect_user_columns();

drop trigger if exists trg_videos_updated_at on public.videos;
create trigger trg_videos_updated_at
  before update of title, description, category_id, source_type, video_url, video_path,
                   thumbnail_url, thumbnail_path, duration_seconds,
                   file_size_bytes, thumbnail_size_bytes, status
  on public.videos
  for each row execute function public.set_updated_at();

drop trigger if exists trg_video_views_increment on public.video_views;
create trigger trg_video_views_increment
  after insert on public.video_views
  for each row execute function public.increment_video_views();

-- ========================================================
-- PHẦN 3 — RPC (Hàm cho frontend)
-- ========================================================

-- 3.1 is_username_available
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.users where lower(username) = lower(p_username));
$$;

-- 3.2 track_view
create or replace function public.track_view(p_video_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.videos where id = p_video_id and status = 'PUBLISHED') then
    raise exception 'video not found';
  end if;
  insert into public.video_views (video_id, viewer_id) values (p_video_id, auth.uid());
end;
$$;

-- 3.3 get_dashboard_stats
create or replace function public.get_dashboard_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'total_videos',  count(*),
      'total_views',   coalesce(sum(views_count), 0),
      'storage_bytes', coalesce(sum(file_size_bytes + thumbnail_size_bytes), 0)
    )
    from public.videos
  );
end;
$$;

-- 3.4 get_top_videos
create or replace function public.get_top_videos(p_limit integer default 10)
returns table (id bigint, title text, views_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select v.id, v.title, v.views_count
    from public.videos v
    order by v.views_count desc, v.id asc
    limit greatest(p_limit, 1);
end;
$$;

-- 3.5 get_views_timeseries
create or replace function public.get_views_timeseries(
  p_granularity text,
  p_from date,
  p_to date
)
returns table (bucket_date date, view_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_granularity not in ('day', 'month') then
    raise exception 'p_granularity must be day or month';
  end if;

  return query
    select s.bucket::date, count(vv.id)
    from generate_series(
           date_trunc(p_granularity, p_from::timestamp),
           date_trunc(p_granularity, p_to::timestamp),
           ('1 ' || p_granularity)::interval
         ) as s(bucket)
    left join public.video_views vv
      on date_trunc(p_granularity, vv.viewed_at at time zone 'Asia/Ho_Chi_Minh') = s.bucket
    group by s.bucket
    order by s.bucket;
end;
$$;

-- ========================================================
-- PHẦN 4 — Row Level Security (RLS)
-- ========================================================

alter table public.users            enable row level security;
alter table public.video_categories enable row level security;
alter table public.videos           enable row level security;
alter table public.tags             enable row level security;
alter table public.video_tags       enable row level security;
alter table public.video_views      enable row level security;
alter table public.activity_logs    enable row level security;

-- users
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists users_update_admin on public.users;
create policy users_update_admin on public.users
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- video_categories
drop policy if exists categories_read on public.video_categories;
create policy categories_read on public.video_categories
  for select to anon, authenticated using (true);

drop policy if exists categories_admin_write on public.video_categories;
create policy categories_admin_write on public.video_categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tags
drop policy if exists tags_read on public.tags;
create policy tags_read on public.tags
  for select to anon, authenticated using (true);

drop policy if exists tags_admin_write on public.tags;
create policy tags_admin_write on public.tags
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- videos
drop policy if exists videos_read on public.videos;
create policy videos_read on public.videos
  for select to anon, authenticated
  using (status = 'PUBLISHED' or public.is_admin());

drop policy if exists videos_admin_write on public.videos;
create policy videos_admin_write on public.videos
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- video_tags
drop policy if exists video_tags_read on public.video_tags;
create policy video_tags_read on public.video_tags
  for select to anon, authenticated using (true);

drop policy if exists video_tags_admin_write on public.video_tags;
create policy video_tags_admin_write on public.video_tags
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- video_views
drop policy if exists video_views_admin_read on public.video_views;
create policy video_views_admin_read on public.video_views
  for select to authenticated using (public.is_admin());

-- activity_logs
drop policy if exists logs_admin_read on public.activity_logs;
create policy logs_admin_read on public.activity_logs
  for select to authenticated using (public.is_admin());

drop policy if exists logs_admin_insert on public.activity_logs;
create policy logs_admin_insert on public.activity_logs
  for insert to authenticated
  with check (public.is_admin() and actor_id = auth.uid());

-- ========================================================
-- PHẦN 5 — Storage (Buckets & Policies)
-- ========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos',     'videos',     true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('thumbnails', 'thumbnails', true, 5242880,  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('videos', 'thumbnails'));

drop policy if exists "storage_admin_insert" on storage.objects;
create policy "storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('videos', 'thumbnails') and public.is_admin());

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('videos', 'thumbnails') and public.is_admin())
  with check (bucket_id in ('videos', 'thumbnails') and public.is_admin());

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('videos', 'thumbnails') and public.is_admin());

-- ========================================================
-- PHẦN 6 — GRANT Quyền truy cập
-- ========================================================

grant usage on schema public to anon, authenticated;

grant select, update                 on public.users            to authenticated;
grant select                         on public.video_categories to anon, authenticated;
grant insert, update, delete         on public.video_categories to authenticated;
grant select                         on public.tags             to anon, authenticated;
grant insert, update, delete         on public.tags             to authenticated;
grant select                         on public.videos           to anon, authenticated;
grant insert, update, delete         on public.videos           to authenticated;
grant select                         on public.video_tags       to anon, authenticated;
grant insert, update, delete         on public.video_tags       to authenticated;
grant select                         on public.video_views      to authenticated;
grant select, insert                 on public.activity_logs    to authenticated;

grant usage, select on all sequences in schema public to authenticated;

revoke execute on function public.get_dashboard_stats()                  from public, anon;
revoke execute on function public.get_top_videos(integer)                from public, anon;
revoke execute on function public.get_views_timeseries(text, date, date) from public, anon;
grant  execute on function public.get_dashboard_stats()                  to authenticated;
grant  execute on function public.get_top_videos(integer)                to authenticated;
grant  execute on function public.get_views_timeseries(text, date, date) to authenticated;

grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.track_view(bigint)          to anon, authenticated;

-- ========================================================
-- PHẦN 7 — Seed Dữ liệu danh mục & Tags mẫu
-- ========================================================

insert into public.video_categories (name, slug, description) values
  ('Giải trí',  'giai-tri',  'Video giải trí'),
  ('Giáo dục',  'giao-duc',  'Video học tập, hướng dẫn'),
  ('Âm nhạc',   'am-nhac',   'Video ca nhạc'),
  ('Thể thao',  'the-thao',  'Video thể thao'),
  ('Công nghệ', 'cong-nghe', 'Video công nghệ')
on conflict (slug) do nothing;

insert into public.tags (name, slug) values
  ('hot', 'hot'), ('mới', 'moi'), ('hướng dẫn', 'huong-dan'),
  ('review', 'review'), ('trực tiếp', 'truc-tiep'), ('ngắn', 'ngan')
on conflict (slug) do nothing;
