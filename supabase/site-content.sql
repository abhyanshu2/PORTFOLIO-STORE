-- ============================================================
-- Site content: all editable text of the portfolio + store
-- (intro, about, skills, education, contact, store headings...)
-- Run this once in Supabase Dashboard > SQL Editor > New query.
-- Safe to run again.
-- ============================================================

create table if not exists public.site_content (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_content_single_row check (id = 1)
);

alter table public.site_content enable row level security;

drop policy if exists "public read site_content" on public.site_content;
create policy "public read site_content" on public.site_content
  for select using (true);

drop policy if exists "admin all site_content" on public.site_content;
create policy "admin all site_content" on public.site_content
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into public.site_content (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;
