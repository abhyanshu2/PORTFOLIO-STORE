-- ============================================================
-- Hero Wall: photos + all "Customize" settings
-- Run this once in Supabase Dashboard > SQL Editor > New query.
-- It is safe to run again: it only adds what is missing.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PHOTOS on the wall
-- ------------------------------------------------------------
create table if not exists public.drift_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  link_url text,
  col_index int,                          -- 1-based column, empty = automatic
  sort_order int not null default 0,
  height_scale numeric not null default 1,
  width_scale numeric not null default 1,
  fit text not null default 'cover',      -- 'cover' | 'contain'
  focus_x numeric not null default 50,
  focus_y numeric not null default 50,
  zoom numeric not null default 1,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. WALL SETTINGS (always one row with id = 1)
-- ------------------------------------------------------------
create table if not exists public.drift_settings (
  id int primary key default 1,
  enabled boolean not null default true,
  columns int not null default 5,
  tile_width numeric not null default 200,
  tile_height numeric not null default 132,
  gap numeric not null default 18,
  radius numeric not null default 14,
  speed numeric not null default 42,
  tilt numeric not null default 16,
  turn numeric not null default -14,
  dim numeric not null default 0.85,
  constraint drift_settings_single_row check (id = 1)
);

-- Settings added later (skipped automatically if they already exist)
alter table public.drift_settings
  add column if not exists overlay_color text not null default '',   -- empty = Auto (matches page background)
  add column if not exists overlay_opacity numeric not null default 0.15,  -- strength of the overlay tint
  add column if not exists direction text not null default 'up',     -- 'up' | 'down'
  add column if not exists variance numeric not null default 0.45,
  add column if not exists roll numeric not null default 0,
  add column if not exists perspective numeric not null default 1200,
  add column if not exists depth numeric not null default 120,
  add column if not exists parallax numeric not null default 0.6,
  add column if not exists lift numeric not null default 64,
  add column if not exists fade numeric not null default 0.6,
  add column if not exists pause_on_hover boolean not null default false,
  add column if not exists grayscale boolean not null default false;

insert into public.drift_settings (id) values (1) on conflict (id) do nothing;

-- Brighter photos: the old default dim was 0.55 (too dark). If you never changed it,
-- raise it to 0.85. A value you picked yourself is left alone.
alter table public.drift_settings alter column dim set default 0.85;
update public.drift_settings set dim = 0.85 where id = 1 and dim = 0.55;

-- ------------------------------------------------------------
-- 3. SECURITY: everyone can read, only a logged-in admin can change
-- ------------------------------------------------------------
alter table public.drift_images   enable row level security;
alter table public.drift_settings enable row level security;

drop policy if exists "public read drift_images"   on public.drift_images;
drop policy if exists "public read drift_settings" on public.drift_settings;
drop policy if exists "admin all drift_images"     on public.drift_images;
drop policy if exists "admin all drift_settings"   on public.drift_settings;

create policy "public read drift_images"   on public.drift_images   for select using (true);
create policy "public read drift_settings" on public.drift_settings for select using (true);
create policy "admin all drift_images"     on public.drift_images   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all drift_settings"   on public.drift_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Make Supabase notice the new columns right away
notify pgrst, 'reload schema';