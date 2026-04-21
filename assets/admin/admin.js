/* ========================================
   BENEFIT — Admin Panel
   ======================================== */
(function () {
  'use strict';

  const sb = window.benefitSupabase;
  if (!sb) { alert('Supabase client failed to load.'); return; }

  // ---------- Schema: tables + fields + storage buckets ----------
  const SCHEMAS = {
    speakers: {
      label: 'Event Speakers',
      titleField: 'name',
      bucket: 'speakers',
      imageField: 'photo_url',
      orderBy: { column: 'sort_order', ascending: true },
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'photo_url', label: 'Photo', type: 'image', bucket: 'speakers' },
        { key: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
      ],
    },
    blog_posts: {
      label: 'Blog Posts',
      titleField: 'title',
      bucket: 'blog-covers',
      imageField: 'cover_url',
      orderBy: { column: 'published_at', ascending: false },
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'slug', label: 'Slug (URL-friendly, optional)', type: 'text' },
        { key: 'category', label: 'Category', type: 'text' },
        { key: 'cover_url', label: 'Cover image', type: 'image', bucket: 'blog-covers' },
        { key: 'excerpt', label: 'Excerpt (short summary)', type: 'textarea' },
        { key: 'body', label: 'Body (HTML or plain text)', type: 'textarea' },
        { key: 'published', label: 'Published', type: 'checkbox', default: true },
        { key: 'published_at', label: 'Publish date', type: 'datetime' },
      ],
    },
    gallery_photos: {
      label: 'Gallery Photos',
      titleField: 'alt',
      bucket: 'gallery',
      imageField: 'image_url',
      orderBy: { column: 'sort_order', ascending: true },
      fields: [
        { key: 'image_url', label: 'Photo', type: 'image', bucket: 'gallery', required: true },
        { key: 'alt', label: 'Alt text / caption', type: 'text' },
        { key: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
      ],
    },
    events: {
      label: 'Events',
      titleField: 'title',
      bucket: 'events',
      imageField: 'cover_url',
      orderBy: { column: 'event_date', ascending: false },
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'event_date', label: 'Event date', type: 'datetime' },
        { key: 'venue', label: 'Venue', type: 'text' },
        { key: 'cover_url', label: 'Cover image', type: 'image', bucket: 'events' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
      ],
    },
    partners: {
      label: 'Partners',
      titleField: 'name',
      bucket: 'partners',
      imageField: 'logo_url',
      orderBy: { column: 'sort_order', ascending: true },
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'logo_url', label: 'Logo', type: 'image', bucket: 'partners' },
        { key: 'website_url', label: 'Website URL', type: 'text' },
        { key: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
      ],
    },
    magazine_issues: {
      label: 'Magazine Issues',
      titleField: 'title',
      bucket: 'magazines',
      imageField: 'cover_url',
      orderBy: { column: 'published_at', ascending: false },
      fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'issue_number', label: 'Issue number (e.g. "Vol. 12")', type: 'text' },
        { key: 'cover_url', label: 'Cover image', type: 'image', bucket: 'magazines' },
        { key: 'pdf_url', label: 'PDF URL (optional)', type: 'text' },
        { key: 'published_at', label: 'Published date', type: 'date' },
        { key: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
      ],
    },
    site_settings: {
      label: 'Site Settings',
      titleField: 'key',
      orderBy: { column: 'key', ascending: true },
      // value stored as JSONB — edited as raw JSON
      fields: [
        { key: 'key', label: 'Key (e.g. "hero", "contact")', type: 'text', required: true, primaryKey: true },
        { key: 'value', label: 'Value (JSON)', type: 'json' },
      ],
    },
  };

  // ---------- State ----------
  let currentTab = 'speakers';
  let currentRows = [];
  let editingRow = null;

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const loginView = $('login-view');
  const adminView = $('admin-view');
  const loginForm = $('login-form');
  const loginError = $('login-error');
  const logoutBtn = $('logout-btn');
  const userEmailEl = $('admin-user-email');
  const listEl = $('list-view');
  const tabTitle = $('tab-title');
  const newBtn = $('new-btn');
  const modal = $('edit-modal');
  const modalTitle = $('modal-title');
  const modalForm = $('edit-form');
  const modalSave = $('modal-save');
  const modalCancel = $('modal-cancel');
  const modalClose = $('modal-close');
  const toastEl = $('toast');

  // ---------- Toast ----------
  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (kind ? ' is-' + kind : '');
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toastEl.hidden = true; }, 3000);
  }

  // ---------- Auth ----------
  async function checkSession() {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      showAdmin(data.session.user);
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginView.hidden = false;
    adminView.hidden = true;
  }

  function showAdmin(user) {
    loginView.hidden = true;
    adminView.hidden = false;
    userEmailEl.textContent = user.email;
    loadTab(currentTab);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { loginError.textContent = error.message; return; }
    showAdmin(data.user);
  });

  logoutBtn.addEventListener('click', async () => {
    await sb.auth.signOut();
    showLogin();
  });

  // ---------- Tabs ----------
  document.querySelectorAll('.admin__nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin__nav-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentTab = btn.dataset.tab;
      loadTab(currentTab);
    });
  });

  async function loadTab(table) {
    const schema = SCHEMAS[table];
    tabTitle.textContent = schema.label;
    listEl.innerHTML = '<div class="empty-state">Loading…</div>';

    let query = sb.from(table).select('*');
    if (schema.orderBy) {
      query = query.order(schema.orderBy.column, { ascending: schema.orderBy.ascending });
    }
    const { data, error } = await query;
    if (error) {
      listEl.innerHTML = '<div class="empty-state">Error: ' + escapeHtml(error.message) + '</div>';
      return;
    }
    currentRows = data || [];
    renderList();
  }

  function renderList() {
    const schema = SCHEMAS[currentTab];
    if (!currentRows.length) {
      listEl.innerHTML = '<div class="empty-state">No entries yet. Click "+ New" to add one.</div>';
      return;
    }
    listEl.innerHTML = currentRows.map((row) => {
      const title = row[schema.titleField] || '(untitled)';
      const img = schema.imageField && row[schema.imageField]
        ? `<img class="list-row__thumb" src="${escapeAttr(row[schema.imageField])}" alt="">`
        : `<div class="list-row__thumb"></div>`;
      const meta = buildMeta(row, schema);
      const id = row[isPk(schema) || 'id'];
      return `
        <div class="list-row" data-id="${escapeAttr(id)}">
          ${img}
          <div>
            <div class="list-row__title">${escapeHtml(String(title))}</div>
            ${meta ? `<div class="list-row__meta">${escapeHtml(meta)}</div>` : ''}
          </div>
          <button class="btn-text" data-action="edit">Edit</button>
          <button class="btn-danger" data-action="delete">Delete</button>
        </div>
      `;
    }).join('');
  }

  function buildMeta(row, schema) {
    const bits = [];
    if (row.category) bits.push(row.category);
    if (row.venue) bits.push(row.venue);
    if (row.event_date) bits.push(formatDate(row.event_date));
    if (row.published_at && schema.label === 'Blog Posts') bits.push(formatDate(row.published_at));
    if (schema.label === 'Blog Posts' && row.published === false) bits.push('DRAFT');
    return bits.join(' · ');
  }

  function isPk(schema) {
    const pk = (schema.fields || []).find(f => f.primaryKey);
    return pk ? pk.key : null;
  }

  // Row actions (event delegation)
  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const rowEl = btn.closest('.list-row');
    const id = rowEl.dataset.id;
    const schema = SCHEMAS[currentTab];
    const pk = isPk(schema) || 'id';
    const row = currentRows.find(r => String(r[pk]) === id);

    if (btn.dataset.action === 'edit') {
      openModal(row);
    } else if (btn.dataset.action === 'delete') {
      if (!confirm('Delete "' + (row[schema.titleField] || 'this entry') + '"? This cannot be undone.')) return;
      const { error } = await sb.from(currentTab).delete().eq(pk, row[pk]);
      if (error) { toast(error.message, 'error'); return; }
      toast('Deleted.', 'success');
      loadTab(currentTab);
    }
  });

  // ---------- Modal ----------
  newBtn.addEventListener('click', () => openModal(null));
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  function openModal(row) {
    editingRow = row;
    const schema = SCHEMAS[currentTab];
    modalTitle.textContent = row ? 'Edit ' + schema.label : 'New ' + schema.label;
    modalForm.innerHTML = schema.fields.map(f => renderField(f, row)).join('');
    wireImageFields();
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
    editingRow = null;
    modalForm.innerHTML = '';
  }

  function renderField(f, row) {
    const v = row ? row[f.key] : (f.default !== undefined ? f.default : '');
    const name = `field_${f.key}`;
    const req = f.required ? 'required' : '';
    if (f.type === 'textarea') {
      return `<label>${f.label}<textarea name="${name}" ${req}>${escapeHtml(v || '')}</textarea></label>`;
    }
    if (f.type === 'checkbox') {
      return `<label style="display:flex;gap:8px;align-items:center;">
        <input type="checkbox" name="${name}" ${v ? 'checked' : ''} style="width:auto;">
        <span>${f.label}</span>
      </label>`;
    }
    if (f.type === 'number') {
      return `<label>${f.label}<input type="number" name="${name}" value="${escapeAttr(v ?? '')}" ${req}></label>`;
    }
    if (f.type === 'date') {
      const dv = v ? String(v).slice(0, 10) : '';
      return `<label>${f.label}<input type="date" name="${name}" value="${escapeAttr(dv)}" ${req}></label>`;
    }
    if (f.type === 'datetime') {
      const dv = v ? toLocalDatetime(v) : '';
      return `<label>${f.label}<input type="datetime-local" name="${name}" value="${escapeAttr(dv)}" ${req}></label>`;
    }
    if (f.type === 'json') {
      const pretty = v ? JSON.stringify(v, null, 2) : '{}';
      return `<label>${f.label}<textarea name="${name}" style="font-family:monospace;min-height:160px;">${escapeHtml(pretty)}</textarea></label>`;
    }
    if (f.type === 'image') {
      return `<label>${f.label}
        <div class="img-upload" data-field="${f.key}" data-bucket="${f.bucket}">
          <div class="img-upload__preview">${v ? `<img src="${escapeAttr(v)}">` : 'No image'}</div>
          <input type="hidden" name="${name}" value="${escapeAttr(v || '')}">
          <div class="img-upload__controls">
            <input type="file" accept="image/*" class="img-upload__file">
            ${v ? '<button type="button" class="btn-text img-upload__clear">Remove</button>' : ''}
          </div>
        </div>
      </label>`;
    }
    // default text
    return `<label>${f.label}<input type="text" name="${name}" value="${escapeAttr(v ?? '')}" ${req}></label>`;
  }

  function wireImageFields() {
    modalForm.querySelectorAll('.img-upload').forEach(wrap => {
      const bucket = wrap.dataset.bucket;
      const hidden = wrap.querySelector('input[type=hidden]');
      const file = wrap.querySelector('.img-upload__file');
      const preview = wrap.querySelector('.img-upload__preview');
      const clear = wrap.querySelector('.img-upload__clear');

      file.addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        file.disabled = true;
        preview.innerHTML = 'Uploading…';
        const { error } = await sb.storage.from(bucket).upload(path, f, {
          cacheControl: '3600', upsert: false, contentType: f.type,
        });
        file.disabled = false;
        if (error) { toast('Upload failed: ' + error.message, 'error'); preview.innerHTML = 'No image'; return; }
        const { data } = sb.storage.from(bucket).getPublicUrl(path);
        hidden.value = data.publicUrl;
        preview.innerHTML = `<img src="${data.publicUrl}">`;
      });

      if (clear) clear.addEventListener('click', () => {
        hidden.value = '';
        preview.innerHTML = 'No image';
        clear.remove();
      });
    });
  }

  modalSave.addEventListener('click', async (e) => {
    e.preventDefault();
    const schema = SCHEMAS[currentTab];
    const payload = {};
    for (const f of schema.fields) {
      const el = modalForm.elements['field_' + f.key];
      if (!el) continue;
      let v;
      if (f.type === 'checkbox') v = el.checked;
      else if (f.type === 'number') v = el.value === '' ? null : Number(el.value);
      else if (f.type === 'json') {
        try { v = el.value.trim() ? JSON.parse(el.value) : null; }
        catch (err) { toast('Invalid JSON in "' + f.label + '"', 'error'); return; }
      }
      else if (f.type === 'datetime') v = el.value ? new Date(el.value).toISOString() : null;
      else if (f.type === 'date') v = el.value || null;
      else v = el.value.trim() === '' ? null : el.value;
      payload[f.key] = v;
    }

    const pk = isPk(schema) || 'id';
    modalSave.disabled = true;
    let result;
    if (editingRow) {
      // update
      result = await sb.from(currentTab).update(payload).eq(pk, editingRow[pk]);
    } else {
      result = await sb.from(currentTab).insert(payload);
    }
    modalSave.disabled = false;

    if (result.error) { toast(result.error.message, 'error'); return; }
    toast('Saved.', 'success');
    closeModal();
    loadTab(currentTab);
  });

  // ---------- Utils ----------
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function formatDate(s) {
    try { return new Date(s).toLocaleDateString(); } catch (_) { return String(s); }
  }
  function toLocalDatetime(s) {
    try {
      const d = new Date(s);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (_) { return ''; }
  }

  // ---------- Boot ----------
  checkSession();
})();
