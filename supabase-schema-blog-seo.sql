-- ============================================================
-- BENEFIT — Blog SEO migration
-- Run once in Supabase SQL Editor AFTER supabase-schema.sql.
-- Adds SEO / structured-content fields to blog_posts.
-- Safe to re-run: every statement is guarded.
-- ============================================================

alter table public.blog_posts
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists cover_alt text,
  add column if not exists og_image_url text,
  add column if not exists author_name text,
  add column if not exists reading_time_minutes int,
  add column if not exists tags text[] default '{}';

-- Fast slug lookups (used by the edge function for /blog/:slug).
create index if not exists blog_posts_slug_idx on public.blog_posts (slug);
create index if not exists blog_posts_published_idx on public.blog_posts (published, published_at desc);

-- ============================================================
-- Storage bucket for inline body images (created in dashboard).
-- You must also create a public bucket named `blog-body` in:
-- Supabase Dashboard → Storage → New bucket → Name: blog-body, Public: ✓
--
-- Then add these two policies to it:
--   Public read:        bucket_id = 'blog-body'
--   Authenticated write: bucket_id = 'blog-body' and auth.role() = 'authenticated'
-- (same shape as the other buckets described in ADMIN_SETUP.md)
-- ============================================================
