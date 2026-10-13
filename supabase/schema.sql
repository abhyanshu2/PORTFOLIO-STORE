-- ============================================================
-- custom-id-studio — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. TEMPLATES  (birthday / proposal / wedding / sorry)
-- ------------------------------------------------------------
create table if not exists public.templates (
  id text primary key,                 -- e.g. 'birthday-scrapbook'
  name text not null,
  monogram text not null,
  category text not null,              -- 'birthday' | 'proposal' | 'wedding' | 'sorry'
  description text not null,
  features text[] not null default '{}',
  price integer not null,
  badge text,                          -- 'trending' | 'new' | 'bestseller' | 'premium' | null
  screenshots text[] not null default '{}',
  demo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. MY PRODUCTS  (apps you've built)
-- ------------------------------------------------------------
create table if not exists public.my_products (
  id text primary key,
  name text not null,
  monogram text not null,
  description text not null,
  features text[] not null default '{}',
  stack text[] not null default '{}',
  status text not null default 'coming-soon',  -- 'live' | 'coming-soon'
  live_url text,
  learn_more_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. RESOURCES  (free downloads)
-- ------------------------------------------------------------
create table if not exists public.resources (
  id text primary key,
  name text not null,
  description text not null,
  url text not null,
  type text not null default 'PDF',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. SERVICES  (hire-me offerings)
-- ------------------------------------------------------------
create table if not exists public.services (
  id text primary key,
  name text not null,
  description text not null,
  price text not null,
  features text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. ORDERS  (store "Buy Now" clicks, logged before WhatsApp redirect)
-- ------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,             -- 'template' | 'product' | 'service'
  item_id text not null,
  item_name text not null,
  price text,
  buyer_name text,
  buyer_contact text,
  status text not null default 'new',  -- 'new' | 'contacted' | 'closed'
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. CONTACT MESSAGES  (portfolio contact form)
-- ------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Rule: anyone (anon) can READ catalog tables.
--       Only an authenticated user can WRITE anywhere.
--       (Since this project has exactly one admin, "authenticated"
--        via Supabase Auth email/password IS the admin — see
--        admin-setup notes for creating that one user.)
-- ============================================================
alter table public.templates          enable row level security;
alter table public.my_products        enable row level security;
alter table public.resources          enable row level security;
alter table public.services           enable row level security;
alter table public.orders             enable row level security;
alter table public.contact_messages   enable row level security;

-- Public read access — catalog tables
create policy "public read templates"    on public.templates    for select using (true);
create policy "public read my_products"  on public.my_products  for select using (true);
create policy "public read resources"    on public.resources    for select using (true);
create policy "public read services"     on public.services     for select using (true);

-- Public INSERT-only access — orders & contact_messages
-- (anyone visiting the site can create one, nobody but the admin can read/update/delete)
create policy "public insert orders"           on public.orders           for insert with check (true);
create policy "public insert contact_messages" on public.contact_messages for insert with check (true);

-- Admin (any authenticated user) — full read/write on everything
create policy "admin all templates"    on public.templates    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all my_products"  on public.my_products  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all resources"    on public.resources    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all services"     on public.services     for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin read orders"      on public.orders           for select using (auth.role() = 'authenticated');
create policy "admin update orders"    on public.orders           for update using (auth.role() = 'authenticated');
create policy "admin delete orders"    on public.orders           for delete using (auth.role() = 'authenticated');
create policy "admin read messages"    on public.contact_messages for select using (auth.role() = 'authenticated');
create policy "admin update messages"  on public.contact_messages for update using (auth.role() = 'authenticated');
create policy "admin delete messages"  on public.contact_messages for delete using (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA — copies your current static data into the DB
-- so the site keeps working exactly as-is once wired to Supabase.
-- ============================================================
insert into public.templates (id, name, monogram, category, description, features, price, badge, screenshots, demo_url, sort_order) values
('birthday-scrapbook','Birthday Scrapbook — Photo Collage','BS','birthday','Editable birthday scrapbook with a pinned photo collage page and a real flip-through book — upload your own photos and rewrite every caption.',
  '{"Upload your own photos","Every caption editable","2 pages: collage + flip book","Drag, zoom & pin photos","Saves in the browser","Mobile + desktop ready"}',199,'trending','{"01","02","03"}','#',1),
('birthday-balloon-pop','Balloon Pop','BP','birthday','Playful balloon-popping birthday surprise page with tap-to-reveal message.',
  '{"Tap interaction","Custom message","Confetti burst","Shareable link"}',149,'new','{"01","02"}',null,2),
('birthday-cake-countdown','Cake Countdown','CC','birthday','Countdown-to-birthday page with animated cake reveal and candle-blow effect.',
  '{"Live countdown","Candle animation","Photo slot","Mobile-first"}',179,null,'{"01","02","03"}',null,3),
('proposal-forever','Forever & Always','PF','proposal','Yes/No animated proposal page with playful button that keeps escaping.',
  '{"Playful button","Confetti burst","Photo backdrop","Response capture"}',249,'trending','{"01","02","03"}',null,4),
('proposal-ring-box','The Ring Box','RB','proposal','Elegant animated ring-box opening reveal leading into a heartfelt proposal message.',
  '{"Box-open animation","Custom message","Music slot","Mobile-first"}',299,'premium','{"01","02","03"}',null,5),
('proposal-starry-night','Starry Night Ask','SN','proposal','Dreamy starfield proposal page with twinkling animation and love note reveal.',
  '{"Starfield animation","Love note reveal","Photo backdrop","Share link"}',219,'new','{"01","02"}',null,6),
('wedding-noir','Noir Vows','WN','wedding','Editorial wedding invite with monogram crest, RSVP flow, and gallery.',
  '{"RSVP form","Photo gallery","Countdown timer","Multi-page"}',499,'premium','{"01","02","03","04"}',null,7),
('wedding-royal-gold','Royal Gold','RG','wedding','Traditional gold-foil wedding invitation with family details and event schedule.',
  '{"Event schedule","Family details","Gold accents","RSVP embedded"}',449,'trending','{"01","02","03"}',null,8),
('wedding-garden-blush','Garden Blush','GB','wedding','Soft floral wedding invite with pastel palette and venue map integration.',
  '{"Floral theme","Venue map","RSVP form","Countdown timer"}',399,'new','{"01","02"}',null,9),
('sorry-paper-heart','Paper Heart','PH','sorry','Gentle animated sorry page with a torn-paper-heart-mending effect and heartfelt note.',
  '{"Mending animation","Custom message","Music slot","Mobile-first"}',149,'trending','{"01","02"}',null,10),
('sorry-falling-petals','Falling Petals','FP','sorry','Soft falling-petals background with a scrollable apology letter.',
  '{"Petal animation","Scroll reveal","Custom photo","Share link"}',129,'new','{"01","02"}',null,11),
('sorry-letter-unfold','Letter Unfold','LU','sorry','Handwritten-style unfolding letter animation to say sorry sincerely.',
  '{"Unfold animation","Handwritten font","Audio player","Mobile-first"}',149,null,'{"01","02","03"}',null,12)
on conflict (id) do nothing;

insert into public.my_products (id, name, monogram, description, features, stack, status, live_url, learn_more_url, sort_order) values
('notiq','NOTIQ','NQ','Sticky notes reimagined — persistent, keyboard-friendly, and fast.',
  '{"Local persistence","Keyboard shortcuts","Dark mode","Export"}','{"React","TypeScript","Tailwind"}','live','https://github.com/abhyanshu2',null,1),
('habit-tracker','Habit Tracker','HT','Track daily habits with streaks, heat-maps and weekly insights.',
  '{"Streaks","Heatmap","Weekly review","Reminders"}','{"React","Node.js","MongoDB"}','live','https://github.com/abhyanshu2',null,2),
('expense-tracker','Expense Tracker','ET','Personal finance tracker with categories and monthly reports.',
  '{"Categories","Charts","Budgets","CSV export"}','{"Next.js","MongoDB"}','coming-soon',null,null,3),
('ai-assistant','AI Assistant','AI','Personal AI helper for daily tasks, writing and code.',
  '{"Chat","Voice","Memory","Plugins"}','{"Next.js","OpenAI"}','coming-soon',null,null,4)
on conflict (id) do nothing;

insert into public.resources (id, name, description, url, type, sort_order) values
('html-notes','HTML Notes','Complete HTML5 notes with examples and cheat sheets.','https://github.com/abhyanshu2','PDF',1),
('css-notes','CSS Notes','CSS3 essentials, flexbox, grid, animations, responsive.','https://github.com/abhyanshu2','PDF',2),
('js-notes','JavaScript Notes','ES6+ core, DOM, async, closures, and patterns.','https://github.com/abhyanshu2','PDF',3),
('react-notes','React Notes','Hooks, patterns, state, routing, and best practices.','https://github.com/abhyanshu2','PDF',4)
on conflict (id) do nothing;

insert into public.services (id, name, description, price, features, sort_order) values
('portfolio-dev','Portfolio Development','Editorial-grade portfolio with animations and CMS-ready structure.','from ₹4,999','{"Custom design","Responsive","SEO","1 month support"}',1),
('landing-dev','Landing Page Development','Conversion-focused landing page tailored to your product.','from ₹6,999','{"Copy assist","A/B ready","Analytics","Fast load"}',2),
('business-site','Business Website','Multi-page business website with services, blog and contact.','from ₹12,999','{"Up to 8 pages","CMS","Contact forms","SEO"}',3),
('react-dev','React Development','Custom React apps, dashboards, or SaaS front-ends.','hourly / project','{"React","TypeScript","Testing","Deploy"}',4)
on conflict (id) do nothing;
