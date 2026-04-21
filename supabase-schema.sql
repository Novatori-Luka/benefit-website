-- ============================================================
-- BENEFIT — Supabase Schema
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Helper: auto-update updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  excerpt text,
  body text,
  cover_url text,
  category text,
  published boolean default true,
  published_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  venue text,
  event_date timestamptz,
  cover_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.magazine_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issue_number text,
  cover_url text,
  pdf_url text,
  published_at date,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Triggers
do $$
declare t text;
begin
  foreach t in array array['speakers','blog_posts','gallery_photos','events','partners','magazine_issues','site_settings']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute procedure public.tg_set_updated_at();', t, t);
  end loop;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Public: read-only. Authenticated users: full CRUD.
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array['speakers','blog_posts','gallery_photos','events','partners','magazine_issues','site_settings']
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists "public read" on public.%I;', t);
    execute format('create policy "public read" on public.%I for select using (true);', t);

    execute format('drop policy if exists "authenticated write" on public.%I;', t);
    execute format(
      'create policy "authenticated write" on public.%I
       for all using (auth.role() = ''authenticated'')
       with check (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

-- ============================================================
-- DEFAULT SITE SETTINGS (edit in admin later)
-- ============================================================
insert into public.site_settings (key, value) values
  ('hero', '{"title":"BENEFIT","subtitle":"Premium Business & Lifestyle Media Platform"}'::jsonb),
  ('contact', '{"email":"info@benefit.com","phone":"","address":""}'::jsonb),
  ('social', '{"instagram":"","facebook":"","youtube":"","linkedin":""}'::jsonb)
on conflict (key) do nothing;
