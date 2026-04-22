// BENEFIT — sitemap.xml generator
// Lists static pages + all published blog posts.

const SUPABASE_URL = 'https://czwrwzzcygvuizicjuxe.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6d3J3enpjeWd2dWl6aWNqdXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODQzMDIsImV4cCI6MjA5MjM2MDMwMn0.ukIs9Z9gTLTwwWkCHFT6lIl2z_WOlVvt_Kgbq7ksDBA';

module.exports = async (req, res) => {
  try {
    const host = getHost(req);
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,published_at,updated_at&published=eq.true&order=published_at.desc`;
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });
    const posts = r.ok ? await r.json() : [];

    const staticUrls = [
      { loc: `${host}/`, priority: '1.0', changefreq: 'weekly' },
      { loc: `${host}/blog`, priority: '0.8', changefreq: 'daily' },
    ];

    const postUrls = (Array.isArray(posts) ? posts : []).map(p => ({
      loc: `${host}/blog/${encodeURIComponent(p.slug || '')}`,
      lastmod: (p.updated_at || p.published_at) ? new Date(p.updated_at || p.published_at).toISOString() : undefined,
      priority: '0.7',
      changefreq: 'monthly',
    })).filter(u => u.loc && !u.loc.endsWith('/blog/'));

    const items = [...staticUrls, ...postUrls].map(u => {
      const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
      return `<url><loc>${esc(u.loc)}</loc>${lastmod}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (err) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
  }
};

function getHost(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  return `${proto}://${host}`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
