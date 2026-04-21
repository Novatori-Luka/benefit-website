/* ========================================
   BENEFIT — Public content loader
   Fetches Supabase data and patches the DOM.
   If a table is empty, hardcoded fallback stays visible.
   ======================================== */
(function () {
  'use strict';
  const sb = window.benefitSupabase;
  if (!sb) { console.warn('Supabase client not available'); return; }

  // ---------- Speakers ----------
  async function loadSpeakers() {
    const track = document.getElementById('speaker-gallery');
    if (!track) return;
    const { data, error } = await sb.from('speakers')
      .select('*').order('sort_order', { ascending: true });
    if (error || !data || !data.length) return;

    track.innerHTML = data.map(s => `
      <div class="speaker-gallery__item">
        <div class="img-placeholder">
          ${s.photo_url ? `<img src="${attr(s.photo_url)}" alt="${attr(s.name)}" loading="lazy">` : ''}
        </div>
        <span class="speaker-gallery__name">${esc(s.name)}</span>
      </div>
    `).join('');
  }

  // ---------- Gallery Photos (panorama slider) ----------
  async function loadGallery() {
    const track = document.querySelector('#panorama-slider .panorama-slider__track');
    if (!track) return false;
    const { data, error } = await sb.from('gallery_photos')
      .select('*').order('sort_order', { ascending: true });
    if (error || !data || !data.length) return false;

    const fadeLeft = track.querySelector('.panorama-slider__fade--left');
    const fadeRight = track.querySelector('.panorama-slider__fade--right');

    // Remove existing cards
    track.querySelectorAll('.panorama-slider__card').forEach(el => el.remove());

    // Insert new cards before fade overlays
    const frag = document.createDocumentFragment();
    data.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'panorama-slider__card';
      card.innerHTML = `<img src="${attr(p.image_url)}" alt="${attr(p.alt || ('Slide ' + (i + 1)))}" loading="lazy" draggable="false">`;
      frag.appendChild(card);
    });
    track.insertBefore(frag, fadeLeft || null);
    return true;
  }

  // ---------- Blog Posts (featured articles) ----------
  async function loadArticles() {
    const grid = document.querySelector('#articles .articles-grid');
    if (!grid) return;
    const { data, error } = await sb.from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(6);
    if (error || !data || !data.length) return;

    grid.innerHTML = data.map(post => `
      <article class="article-card">
        <div class="img-placeholder">
          ${post.cover_url ? `<img src="${attr(post.cover_url)}" alt="${attr(post.title)}" loading="lazy">` : ''}
        </div>
        <div class="article-card__overlay">
          <span class="article-card__title">${esc(post.title)}</span>
        </div>
      </article>
    `).join('');
  }

  // ---------- Partners ----------
  async function loadPartners() {
    const host = document.getElementById('partners-logos');
    if (!host) return;
    const { data, error } = await sb.from('partners')
      .select('*').order('sort_order', { ascending: true });
    if (error || !data || !data.length) return;

    host.innerHTML = data.map(p => {
      const inner = p.logo_url
        ? `<img src="${attr(p.logo_url)}" alt="${attr(p.name)}" loading="lazy">`
        : `<span>${esc(p.name)}</span>`;
      return p.website_url
        ? `<a href="${attr(p.website_url)}" target="_blank" rel="noopener" class="partners-logo">${inner}</a>`
        : `<div class="partners-logo">${inner}</div>`;
    }).join('');
  }

  // ---------- Magazine Issues ----------
  async function loadMagazines() {
    const host = document.getElementById('magazine-issues');
    if (!host) return;
    const { data, error } = await sb.from('magazine_issues')
      .select('*').order('published_at', { ascending: false });
    if (error || !data || !data.length) return;

    host.innerHTML = data.map(m => {
      const img = m.cover_url
        ? `<img src="${attr(m.cover_url)}" alt="${attr(m.title)}" loading="lazy">`
        : '';
      const label = m.issue_number ? `<span class="issue-number">${esc(m.issue_number)}</span>` : '';
      const inner = `<div class="magazine-issue__cover">${img}</div>
                     <div class="magazine-issue__meta"><strong>${esc(m.title)}</strong>${label}</div>`;
      return m.pdf_url
        ? `<a class="magazine-issue" href="${attr(m.pdf_url)}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="magazine-issue">${inner}</div>`;
    }).join('');
  }

  // ---------- Site Settings (contact + social + hero) ----------
  async function loadSiteSettings() {
    const { data, error } = await sb.from('site_settings').select('*');
    if (error || !data) return;
    const map = {};
    data.forEach(r => { map[r.key] = r.value || {}; });

    // Hero
    const hero = map.hero || {};
    if (hero.title) {
      const el = document.querySelector('.hero__title');
      if (el) el.textContent = hero.title;
    }
    if (hero.subtitle) {
      const el = document.querySelector('.hero__subtitle');
      if (el) el.textContent = hero.subtitle;
    }

    // Contact (footer)
    const contact = map.contact || {};
    const contactCol = document.querySelector('.footer__col--contact');
    if (contactCol) {
      const ps = contactCol.querySelectorAll('p');
      if (contact.email && ps[0]) ps[0].textContent = contact.email;
      if (contact.phone && ps[1]) ps[1].textContent = 'Tel: ' + contact.phone;
      if (contact.address && ps[2]) ps[2].textContent = contact.address;
    }

    // Social links
    const social = map.social || {};
    const socialMap = {
      instagram: '[aria-label="Instagram"]',
      facebook: '[aria-label="Facebook"]',
      twitter: '[aria-label="X (Twitter)"]',
      linkedin: '[aria-label="LinkedIn"]',
      youtube: '[aria-label="YouTube"]',
      tiktok: '[aria-label="TikTok"]',
    };
    Object.entries(socialMap).forEach(([key, sel]) => {
      const url = social[key];
      if (!url) return;
      const a = document.querySelector('.footer__col--social ' + sel);
      if (a) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    });
  }

  // ---------- Helpers ----------
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function attr(s) { return esc(s); }

  // ---------- Boot ----------
  async function boot() {
    // Gallery first — panorama slider needs DOM ready before init.
    const galleryReplaced = await loadGallery();

    // Defer panorama init until after cards are in place.
    if (typeof window.initPanoramaSlider === 'function') {
      window.initPanoramaSlider();
    }

    // Others in parallel.
    loadSpeakers();
    loadArticles();
    loadPartners();
    loadMagazines();
    loadSiteSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
