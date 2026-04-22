/* BENEFIT — Blog listing page.
   Fetches published posts from Supabase and renders a filterable grid.
   Pagination is client-side (the list is usually small). */
(function () {
  'use strict';
  const sb = window.benefitSupabase;
  const grid = document.getElementById('blog-grid');
  const filtersEl = document.getElementById('blog-filters');
  const pagerEl = document.getElementById('blog-pagination');

  if (!sb || !grid) return;

  const PAGE_SIZE = 9;
  let posts = [];
  let activeCategory = 'all';
  let page = 1;

  async function load() {
    const { data, error } = await sb.from('blog_posts')
      .select('id,title,slug,excerpt,cover_url,cover_alt,category,published_at,reading_time_minutes,author_name')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      grid.innerHTML = `<div class="blog-grid__empty">Could not load posts.</div>`;
      return;
    }
    posts = Array.isArray(data) ? data : [];
    buildFilters();
    render();
  }

  function buildFilters() {
    const cats = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
    if (!cats.length) { filtersEl.innerHTML = ''; return; }
    const pills = ['all', ...cats].map(c => {
      const label = c === 'all' ? 'All' : c;
      const cls = 'blog-filter' + (c === activeCategory ? ' is-active' : '');
      return `<button class="${cls}" data-cat="${esc(c)}">${esc(label)}</button>`;
    }).join('');
    filtersEl.innerHTML = pills;
    filtersEl.querySelectorAll('.blog-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        page = 1;
        buildFilters();
        render();
      });
    });
  }

  function render() {
    const filtered = activeCategory === 'all'
      ? posts
      : posts.filter(p => p.category === activeCategory);

    if (!filtered.length) {
      grid.innerHTML = `<div class="blog-grid__empty">No posts yet${activeCategory === 'all' ? '' : ' in this category'}.</div>`;
      pagerEl.innerHTML = '';
      return;
    }

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > pageCount) page = pageCount;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    grid.innerHTML = pageItems.map(card).join('');

    if (pageCount > 1) {
      const prev = `<button class="blog-page-btn" data-dir="-1" ${page === 1 ? 'disabled' : ''}>&larr; Prev</button>`;
      const next = `<button class="blog-page-btn" data-dir="1" ${page === pageCount ? 'disabled' : ''}>Next &rarr;</button>`;
      const info = `<span class="blog-page-info">Page ${page} of ${pageCount}</span>`;
      pagerEl.innerHTML = prev + info + next;
      pagerEl.querySelectorAll('.blog-page-btn').forEach(b => {
        b.addEventListener('click', () => {
          page += Number(b.dataset.dir);
          render();
          window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
        });
      });
    } else {
      pagerEl.innerHTML = '';
    }
  }

  function card(p) {
    const url = `/blog/${encodeURIComponent(p.slug || p.id)}`;
    const img = p.cover_url
      ? `<img src="${attr(p.cover_url)}" alt="${attr(p.cover_alt || p.title || '')}" loading="lazy">`
      : '';
    const dateIso = p.published_at ? new Date(p.published_at).toISOString() : '';
    const dateHuman = p.published_at
      ? new Date(p.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const cat = p.category ? `<span class="blog-card__kicker">${esc(p.category)}</span>` : '';
    const excerpt = p.excerpt ? `<p class="blog-card__excerpt">${esc(p.excerpt)}</p>` : '';
    const meta = [
      p.author_name ? `By ${esc(p.author_name)}` : '',
      dateIso ? `<time datetime="${dateIso}">${dateHuman}</time>` : '',
      p.reading_time_minutes ? `${p.reading_time_minutes} min read` : '',
    ].filter(Boolean).join(' · ');

    return `
      <article class="blog-card">
        <a href="${url}" class="blog-card__link">
          <div class="blog-card__media">${img}</div>
          <div class="blog-card__body">
            ${cat}
            <h2 class="blog-card__title">${esc(p.title || 'Untitled')}</h2>
            ${excerpt}
            <div class="blog-card__meta">${meta}</div>
          </div>
        </a>
      </article>
    `;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function attr(s) { return esc(s); }

  // Hamburger (simple mirror of the homepage behavior).
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  load();
})();
