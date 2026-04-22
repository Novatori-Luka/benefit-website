# BENEFIT — Admin Panel Setup

The admin panel lives at **`/admin.html`** (e.g. `https://benefit-website.vercel.app/admin.html`).
Content is stored in Supabase. Follow these **one-time setup** steps before first use.

---

## 1. Run the database schema

Go to **Supabase Dashboard → SQL Editor → New query**, paste the contents of
[`supabase-schema.sql`](supabase-schema.sql), and click **Run**.

This creates all 7 tables and Row Level Security policies:
- `speakers`, `blog_posts`, `gallery_photos`, `events`, `partners`, `magazine_issues`, `site_settings`

## 2. Create Storage buckets

Go to **Supabase Dashboard → Storage → New bucket**. Create these **5 buckets**
and mark each one as **Public**:

- `speakers`
- `blog-covers`
- `gallery`
- `partners`
- `magazines`
- `events` (if you want event cover images)

For each bucket, go to the bucket → **Policies** → add these two policies (or use the "public bucket" preset):

```sql
-- Public read
create policy "Public read" on storage.objects
  for select using (bucket_id = 'BUCKET_NAME_HERE');

-- Authenticated upload/update/delete
create policy "Authenticated write" on storage.objects
  for all using (bucket_id = 'BUCKET_NAME_HERE' and auth.role() = 'authenticated')
  with check (bucket_id = 'BUCKET_NAME_HERE' and auth.role() = 'authenticated');
```

(Replace `BUCKET_NAME_HERE` with the actual bucket name, run once per bucket.)

## 3. Create the admin user

**Dashboard → Authentication → Users → Add user → Create new user**:

- Email: `info@benefit.com`
- Password: `BeneCreative2026!`
- ✅ Auto Confirm User (so no email verification needed)

> **Rotate this password after first login** — it was shared in chat.

## 4. Configure auth redirect URLs

**Dashboard → Authentication → URL Configuration**:
- Site URL: `https://benefit-website.vercel.app`
- Redirect URLs: add `https://benefit-website.vercel.app/**`

## 5. Log in

Visit `https://benefit-website.vercel.app/admin.html` and sign in.

---

## 6. Blog SEO migration (one-time)

For the `/blog` section to work with full SEO (headings, social-share previews, etc.),
run the extra migration and create one more storage bucket:

1. **Dashboard → SQL Editor → New query** — paste contents of
   [`supabase-schema-blog-seo.sql`](supabase-schema-blog-seo.sql) → **Run**.
   Adds SEO fields to `blog_posts` (`seo_title`, `seo_description`, `cover_alt`,
   `og_image_url`, `author_name`, `reading_time_minutes`, `tags[]`) plus indexes.
2. **Dashboard → Storage → New bucket** — name `blog-body`, **Public: ✓**.
   Used for images inserted inline into post bodies.
   Add the same two policies documented above (public read + authenticated write).

---

## How it works

- **Admin panel**: `admin.html` — login + CRUD for all content types including blog.
  The blog editor has a rich-text toolbar (H2/H3, bold/italic, lists, quotes, links, images).
  Every inline image prompts for **alt text** — required for SEO & accessibility.
- **Blog listing**: `/blog` — public listing page (`blog.html`), renders cards from Supabase.
- **Individual posts**: `/blog/your-slug` — served by the Vercel serverless function at
  `api/blog/[slug].js`. It fetches the post from Supabase and returns fully-rendered HTML
  with `<title>`, meta description, canonical URL, Open Graph + Twitter tags, and JSON-LD
  `BlogPosting` schema. This means social-media link previews and search engines see the
  full content immediately — no JS execution required.
- **Sitemap**: `/sitemap.xml` — generated on demand by `api/sitemap.js`, lists every
  published post for search engines.
- **Shared Supabase client**: `assets/js/supabase-client.js`.
- **Routing**: `vercel.json` — rewrites `/blog/:slug` → the serverless function.

### Writing a good post
- **Title** = the `<h1>`. Make it descriptive.
- **Slug** auto-generates from the title, but you can override. Only letters, numbers, dashes.
- **Excerpt** — used both on cards and as the default meta description.
- **Cover alt text** — describes the image for screen readers & image search.
- **Body** — use **H2** for main sections, **H3** for sub-sections. Images inserted inline get alt text prompts.
- **SEO title / description overrides** — leave blank to reuse the title/excerpt.
- **Tags** — comma-separated, shown at the bottom of the post and used as keywords.
