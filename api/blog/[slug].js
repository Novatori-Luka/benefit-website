// BENEFIT — Blog post SSR endpoint.
// Renders a single post as fully-formed SEO HTML at /blog/:slug.
// No build step, no dependencies — just Node + fetch against Supabase REST.

const SUPABASE_URL = 'https://czwrwzzcygvuizicjuxe.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6d3J3enpjeWd2dWl6aWNqdXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODQzMDIsImV4cCI6MjA5MjM2MDMwMn0.ukIs9Z9gTLTwwWkCHFT6lIl2z_WOlVvt_Kgbq7ksDBA';

module.exports = async (req, res) => {
  try {
    const rawSlug = (req.query && req.query.slug) || '';
    const slug = String(rawSlug).toLowerCase().trim();
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return notFound(res, req);
    }

    const url = `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*&limit=1`;
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!r.ok) return serverError(res, req, `Supabase ${r.status}`);
    const rows = await r.json();
    const post = Array.isArray(rows) ? rows[0] : null;
    if (!post) return notFound(res, req);

    const host = getHost(req);
    const canonical = `${host}/blog/${slug}`;
    const html = renderPost(post, canonical);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch (err) {
    return serverError(res, req, err && err.message);
  }
};

// ---------- Rendering ----------

function renderPost(post, canonical) {
  const title = esc(post.seo_title || post.title || 'Untitled');
  const rawDesc = post.seo_description || post.excerpt || stripTags(post.body || '').slice(0, 160);
  const description = esc(rawDesc || 'Read the full story on BENEFIT.');
  const cover = post.og_image_url || post.cover_url || '';
  const coverAlt = esc(post.cover_alt || post.title || '');
  const author = esc(post.author_name || 'BENEFIT Editorial');
  const publishedIso = post.published_at ? new Date(post.published_at).toISOString() : null;
  const publishedHuman = publishedIso
    ? new Date(publishedIso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const updatedIso = post.updated_at ? new Date(post.updated_at).toISOString() : publishedIso;
  const category = esc(post.category || '');
  const readingTime = post.reading_time_minutes || estimateReadingTime(post.body || '');
  const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];
  const bodyHtml = sanitizeBody(post.body || '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title || '',
    description: rawDesc || '',
    image: cover || undefined,
    datePublished: publishedIso || undefined,
    dateModified: updatedIso || undefined,
    author: { '@type': 'Person', name: post.author_name || 'BENEFIT Editorial' },
    publisher: {
      '@type': 'Organization',
      name: 'BENEFIT',
      logo: { '@type': 'ImageObject', url: canonicalOrigin(canonical) + '/favicon.ico' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    keywords: tags.join(', ') || undefined,
    articleSection: post.category || undefined,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — BENEFIT</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${esc(canonical)}">
${tags.length ? `<meta name="keywords" content="${esc(tags.join(', '))}">` : ''}
<meta name="author" content="${author}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="BENEFIT">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${esc(canonical)}">
${cover ? `<meta property="og:image" content="${esc(cover)}">` : ''}
${cover ? `<meta property="og:image:alt" content="${coverAlt}">` : ''}
${publishedIso ? `<meta property="article:published_time" content="${publishedIso}">` : ''}
${updatedIso ? `<meta property="article:modified_time" content="${updatedIso}">` : ''}
${category ? `<meta property="article:section" content="${category}">` : ''}
${tags.map(t => `<meta property="article:tag" content="${esc(t)}">`).join('\n')}

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
${cover ? `<meta name="twitter:image" content="${esc(cover)}">` : ''}

<!-- Fonts + site styles -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">

<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body class="post-body">

<header class="header" id="header">
  <div class="container">
    <a href="/" class="header__logo">BENEFIT</a>
    <nav class="header__nav">
      <a href="/#magazine">Magazine</a>
      <a href="/#talks">Events</a>
      <a href="/#digital">Digital</a>
      <a href="/blog" class="is-active">Blog</a>
      <a href="/#partners">Partners</a>
      <a href="/#contact">Contact</a>
    </nav>
    <a href="/" class="header__lang" aria-label="Language">KA</a>
  </div>
</header>

<main class="post-main">
  <article class="post-article">
    <nav class="post-breadcrumbs" aria-label="Breadcrumbs">
      <a href="/">Home</a>
      <span aria-hidden="true">/</span>
      <a href="/blog">Blog</a>
      ${category ? `<span aria-hidden="true">/</span><span>${category}</span>` : ''}
    </nav>

    <header class="post-header">
      ${category ? `<p class="post-kicker">${category}</p>` : ''}
      <h1 class="post-title">${esc(post.title || '')}</h1>
      ${post.excerpt ? `<p class="post-excerpt">${esc(post.excerpt)}</p>` : ''}
      <div class="post-meta">
        <span class="post-meta__author">By ${author}</span>
        ${publishedIso ? `<span class="post-meta__sep" aria-hidden="true">·</span><time datetime="${publishedIso}">${publishedHuman}</time>` : ''}
        ${readingTime ? `<span class="post-meta__sep" aria-hidden="true">·</span><span>${readingTime} min read</span>` : ''}
      </div>
    </header>

    ${cover ? `
    <figure class="post-cover">
      <img src="${esc(cover)}" alt="${coverAlt}" loading="eager" fetchpriority="high">
      ${coverAlt ? `<figcaption>${coverAlt}</figcaption>` : ''}
    </figure>` : ''}

    <div class="post-content">
      ${bodyHtml}
    </div>

    ${tags.length ? `
    <footer class="post-footer">
      <div class="post-tags" aria-label="Tags">
        ${tags.map(t => `<span class="post-tag">${esc(t)}</span>`).join('')}
      </div>
      <a href="/blog" class="link-arrow link-arrow--light">Back to Blog <span></span></a>
    </footer>` : `
    <footer class="post-footer">
      <a href="/blog" class="link-arrow link-arrow--light">Back to Blog <span></span></a>
    </footer>`}
  </article>
</main>

<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__col footer__col--logo"><span class="footer__logo">BENEFIT</span></div>
      <div class="footer__col footer__col--contact">
        <p>anasulaberidze@bene-exclusive.com</p>
      </div>
    </div>
  </div>
</footer>
<div class="footer__copy"><p>&copy; ${new Date().getFullYear()} by Bene Creative</p></div>

</body>
</html>`;
}

// ---------- Helpers ----------

function notFound(res, req) {
  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<title>Not found — BENEFIT</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/style.css">
</head><body class="post-body"><main class="post-main"><article class="post-article">
<h1 class="post-title">Post not found</h1>
<p class="post-excerpt">The article you’re looking for may have been moved or unpublished.</p>
<p><a href="/blog" class="link-arrow link-arrow--light">Back to Blog <span></span></a></p>
</article></main></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(404).send(html);
}

function serverError(res, req, msg) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(500).send(`<!DOCTYPE html><html><body><h1>Server error</h1><p>${esc(msg || '')}</p></body></html>`);
}

function getHost(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  return `${proto}://${host}`;
}

function canonicalOrigin(canonical) {
  try { const u = new URL(canonical); return u.origin; } catch (_) { return ''; }
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function estimateReadingTime(html) {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

// Very light sanitizer: strip <script>/<style>/<iframe> and on* handlers.
// Admin is trusted, but defense-in-depth is cheap.
function sanitizeBody(html) {
  let s = String(html || '');
  s = s.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  s = s.replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, '');
  s = s.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
  return s;
}
