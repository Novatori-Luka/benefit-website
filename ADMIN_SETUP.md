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

## How it works

- Admin panel: `admin.html` — login + CRUD for all content types.
- Shared Supabase client: `assets/js/supabase-client.js`.
- Public site: **Phase 2** will refactor `index.html` to fetch dynamic content from Supabase. Until then, the admin panel works standalone — data you enter is saved to Supabase but not yet rendered on the public site.
