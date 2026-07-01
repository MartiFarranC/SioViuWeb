/* ═══════════════════════════════════════════
   SIÓ VIU – news.js  (Supabase)
   ═══════════════════════════════════════════ */

const SUPA_URL = 'https://kvpqemvhhprtyfzdmcjq.supabase.co';
const SUPA_KEY = 'sb_publishable_FOX_rvKBWKzeif7movnuTA_9ImVIFzt';
const MESOS_CA = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];

const supaHeaders = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`
};

/* ── Helpers ── */
function supaFetch(path, opts = {}) {
  return fetch(SUPA_URL + path, {
    ...opts,
    headers: { ...supaHeaders, ...(opts.headers || {}) }
  });
}

/* ═══════════════════════════════════════════
   PÀGINA PÚBLICA – carrega notícies i accions
   ═══════════════════════════════════════════ */

async function carregaNoticies() {
  const el = document.getElementById('noticies-dinamiques');
  if (!el) return;
  el.innerHTML = '<p style="color:#888;font-size:.85rem">Carregant notícies...</p>';
  try {
    const res  = await supaFetch('/rest/v1/noticies?select=*&order=created_at.desc');
    const data = await res.json();
    if (!data.length) { el.innerHTML = '<p style="color:#888;font-size:.85rem">Properament...</p>'; return; }
    el.innerHTML = data.map(n => `
      <article class="noticia-item">
        ${n.imatge_url ? `<div class="noticia-media"><img src="${n.imatge_url}" alt="${esc(n.titol)}" class="noticia-foto"></div>` : ''}
        <div class="noticia-body">
          <h5>${n.titol}</h5>
          <p class="noticia-meta">${new Date(n.created_at).toLocaleDateString('ca-ES',{day:'2-digit',month:'2-digit',year:'numeric'})}</p>
          ${n.cos ? `<p class="noticia-excerpt">${n.cos}</p>` : ''}
          ${n.link ? `<a href="${n.link}" target="_blank" rel="noopener" class="arrow-link" style="font-size:.8rem">Llegir més →</a>` : ''}
        </div>
      </article>`).join('');
  } catch { el.innerHTML = '<p style="color:#888;font-size:.85rem">Error carregant notícies.</p>'; }
}

async function carregaAccions() {
  const el = document.getElementById('accions-list');
  if (!el) return;
  try {
    const res  = await supaFetch('/rest/v1/accions?select=*&order=data.asc');
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      el.innerHTML = '<li style="color:#888;font-size:.82rem;padding:.5rem 0">Properament...</li>'; return;
    }
    el.innerHTML = data.map(a => {
      const d = new Date(a.data + 'T00:00:00');
      return `
        <li class="accio-item">
          <div class="accio-cal">
            <span class="accio-mes">${MESOS_CA[d.getMonth()]}</span>
            <span class="accio-dia">${d.getDate()}</span>
          </div>
          <div class="accio-body">
            <h5>${a.titol}</h5>
            ${a.link ? `<a href="${a.link}" target="_blank" rel="noopener">Participa →</a>` : ''}
          </div>
        </li>`;
    }).join('');
  } catch { el.innerHTML = '<li style="color:#888;font-size:.82rem;padding:.5rem 0">Error carregant accions.</li>'; }
}

carregaNoticies();
carregaAccions();

/* ═══════════════════════════════════════════
   MODAL ADMIN — triple-click al logo
   ═══════════════════════════════════════════ */
(function () {
  const ADMIN_PASS = 'sioviu2024';
  const modal = document.getElementById('admin-modal');
  if (!modal) return;

  const stepPwd  = document.getElementById('admin-step-pwd');
  const stepForm = document.getElementById('admin-step-form');
  const pwdInput = document.getElementById('admin-pwd');
  const pwdErr   = document.getElementById('admin-pwd-err');

  /* ── Triple-click logo ── */
  const logo = document.querySelector('.nav-left a');
  let clicks = 0, clickTimer;
  logo.addEventListener('click', e => {
    e.preventDefault();
    clicks++;
    clearTimeout(clickTimer);
    if (clicks >= 3) {
      clicks = 0;
      obreModal();
    } else {
      clickTimer = setTimeout(() => { clicks = 0; window.location.href = '#inici'; }, 600);
    }
  });

  /* ── Obre / tanca ── */
  function obreModal() {
    stepPwd.style.display  = '';
    stepForm.style.display = 'none';
    pwdInput.value = ''; pwdErr.style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => pwdInput.focus(), 50);
  }
  function tancaModal() { modal.style.display = 'none'; }

  document.getElementById('admin-close').addEventListener('click', tancaModal);
  modal.addEventListener('click', e => { if (e.target === modal) tancaModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tancaModal(); });

  /* ── Login ── */
  function verificaPwd() {
    if (pwdInput.value === ADMIN_PASS) {
      stepPwd.style.display  = 'none';
      stepForm.style.display = '';
      carregaAdminNoticies();
      carregaAdminAccions();
      document.getElementById('a-titol').focus();
    } else {
      pwdErr.style.display = 'block';
      pwdInput.value = ''; pwdInput.focus();
    }
  }
  document.getElementById('admin-pwd-btn').addEventListener('click', verificaPwd);
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') verificaPwd(); });

  /* ── Tabs ── */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      document.getElementById('admin-panel-noticia').style.display = which === 'noticia' ? '' : 'none';
      document.getElementById('admin-panel-accio').style.display   = which === 'accio'   ? '' : 'none';
    });
  });

  /* ════════════════════════════════
     NOTÍCIES CRUD
     ════════════════════════════════ */
  let noticiesCache = {};
  let editingNoticiaId = null;

  async function carregaAdminNoticies() {
    const el = document.getElementById('admin-noticies-list');
    el.innerHTML = '<p style="color:#888;font-size:.8rem">Carregant...</p>';
    const res  = await supaFetch('/rest/v1/noticies?select=id,titol,cos,imatge_url,link,created_at&order=created_at.desc');
    const data = await res.json();
    noticiesCache = {};
    if (!data.length) { el.innerHTML = '<p style="color:#888;font-size:.8rem">Cap notícia publicada.</p>'; return; }
    data.forEach(n => noticiesCache[n.id] = n);
    el.innerHTML = data.map(n => `
      <div class="admin-list-item">
        <div class="admin-list-info">
          <h6>${n.titol}</h6>
          <span>${new Date(n.created_at).toLocaleDateString('ca-ES')}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn-sm admin-btn-edit" data-id="${n.id}" data-type="noticia-edit">Editar</button>
          <button class="admin-btn-sm admin-btn-del"  data-id="${n.id}" data-type="noticia-del">Eliminar</button>
        </div>
      </div>`).join('');
  }

  function editarNoticia(id) {
    const n = noticiesCache[id];
    editingNoticiaId = id;
    document.getElementById('a-titol').value  = n.titol   || '';
    document.getElementById('a-cos').value    = n.cos     || '';
    document.getElementById('a-imatge').value = n.imatge_url || '';
    document.getElementById('a-link').value   = n.link    || '';
    document.getElementById('noticia-form-h').textContent      = 'EDITAR NOTÍCIA';
    document.getElementById('admin-noticia-btn').textContent   = 'Actualitzar';
    document.getElementById('admin-noticia-cancel').style.display = '';
    document.getElementById('admin-panel-noticia').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('a-titol').focus();
  }

  async function eliminarNoticia(id) {
    if (!confirm('Eliminar aquesta notícia?')) return;
    await supaFetch(`/rest/v1/noticies?id=eq.${id}`, { method: 'DELETE' });
    resetNoticiaForm();
    carregaAdminNoticies();
    carregaNoticies();
  }

  function resetNoticiaForm() {
    editingNoticiaId = null;
    ['a-titol','a-cos','a-imatge','a-link'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('noticia-form-h').textContent      = 'NOVA NOTÍCIA';
    document.getElementById('admin-noticia-btn').textContent   = 'Publicar';
    document.getElementById('admin-noticia-cancel').style.display = 'none';
    document.getElementById('admin-noticia-err').style.display = 'none';
    document.getElementById('admin-noticia-ok').style.display  = 'none';
  }

  document.getElementById('admin-noticia-cancel').addEventListener('click', resetNoticiaForm);

  document.getElementById('admin-noticia-btn').addEventListener('click', async () => {
    const titol      = document.getElementById('a-titol').value.trim();
    const cos        = document.getElementById('a-cos').value.trim();
    const imatge_url = document.getElementById('a-imatge').value.trim() || null;
    const link       = document.getElementById('a-link').value.trim()   || null;
    const err = document.getElementById('admin-noticia-err');
    const ok  = document.getElementById('admin-noticia-ok');
    const btn = document.getElementById('admin-noticia-btn');

    err.style.display = 'none'; ok.style.display = 'none';
    if (!titol || !cos) { err.textContent = 'Títol i Cos són obligatoris.'; err.style.display = 'block'; return; }

    btn.disabled = true; btn.textContent = editingNoticiaId ? 'Actualitzant...' : 'Publicant...';
    try {
      let res;
      if (editingNoticiaId) {
        res = await supaFetch(`/rest/v1/noticies?id=eq.${editingNoticiaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ titol, cos, imatge_url, link })
        });
        ok.textContent = 'Notícia actualitzada!';
      } else {
        res = await supaFetch('/rest/v1/noticies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ titol, cos, imatge_url, link })
        });
        ok.textContent = 'Notícia publicada!';
      }
      if (!res.ok) throw new Error(await res.text());
      ok.style.display = 'block';
      resetNoticiaForm();
      carregaAdminNoticies();
      carregaNoticies();
    } catch (e) {
      err.textContent = 'Error: ' + e.message; err.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = editingNoticiaId ? 'Actualitzar' : 'Publicar';
    }
  });

  /* ════════════════════════════════
     ACCIONS CRUD
     ════════════════════════════════ */
  let accionsCache = {};
  let editingAccioId = null;

  async function carregaAdminAccions() {
    const el = document.getElementById('admin-accions-list');
    el.innerHTML = '<p style="color:#888;font-size:.8rem">Carregant...</p>';
    const res  = await supaFetch('/rest/v1/accions?select=id,titol,data,link&order=data.asc');
    const data = await res.json();
    accionsCache = {};
    if (!Array.isArray(data) || !data.length) { el.innerHTML = '<p style="color:#888;font-size:.8rem">Cap acció publicada.</p>'; return; }
    data.forEach(a => accionsCache[a.id] = a);
    el.innerHTML = data.map(a => `
      <div class="admin-list-item">
        <div class="admin-list-info">
          <h6>${a.titol}</h6>
          <span>${a.data}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn-sm admin-btn-edit" data-id="${a.id}" data-type="accio-edit">Editar</button>
          <button class="admin-btn-sm admin-btn-del"  data-id="${a.id}" data-type="accio-del">Eliminar</button>
        </div>
      </div>`).join('');
  }

  function editarAccio(id) {
    const a = accionsCache[id];
    editingAccioId = id;
    document.getElementById('ac-titol').value = a.titol || '';
    document.getElementById('ac-data').value  = a.data  || '';
    document.getElementById('ac-link').value  = a.link  || '';
    document.getElementById('accio-form-h').textContent       = 'EDITAR ACCIÓ';
    document.getElementById('admin-accio-btn').textContent    = 'Actualitzar';
    document.getElementById('admin-accio-cancel').style.display = '';
    document.getElementById('admin-panel-accio').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('ac-titol').focus();
  }

  async function eliminarAccio(id) {
    if (!confirm('Eliminar aquesta acció?')) return;
    await supaFetch(`/rest/v1/accions?id=eq.${id}`, { method: 'DELETE' });
    resetAccioForm();
    carregaAdminAccions();
    carregaAccions();
  }

  function resetAccioForm() {
    editingAccioId = null;
    ['ac-titol','ac-data','ac-link'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('accio-form-h').textContent       = 'NOVA ACCIÓ';
    document.getElementById('admin-accio-btn').textContent    = 'Publicar acció';
    document.getElementById('admin-accio-cancel').style.display = 'none';
    document.getElementById('admin-accio-err').style.display  = 'none';
    document.getElementById('admin-accio-ok').style.display   = 'none';
  }

  document.getElementById('admin-accio-cancel').addEventListener('click', resetAccioForm);

  document.getElementById('admin-accio-btn').addEventListener('click', async () => {
    const titol = document.getElementById('ac-titol').value.trim();
    const data  = document.getElementById('ac-data').value;
    const link  = document.getElementById('ac-link').value.trim() || null;
    const err = document.getElementById('admin-accio-err');
    const ok  = document.getElementById('admin-accio-ok');
    const btn = document.getElementById('admin-accio-btn');

    err.style.display = 'none'; ok.style.display = 'none';
    if (!titol || !data) { err.textContent = 'Títol i Data són obligatoris.'; err.style.display = 'block'; return; }

    btn.disabled = true; btn.textContent = editingAccioId ? 'Actualitzant...' : 'Publicant...';
    try {
      let res;
      if (editingAccioId) {
        res = await supaFetch(`/rest/v1/accions?id=eq.${editingAccioId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ titol, data, link })
        });
        ok.textContent = 'Acció actualitzada!';
      } else {
        res = await supaFetch('/rest/v1/accions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ titol, data, link })
        });
        ok.textContent = 'Acció publicada!';
      }
      if (!res.ok) throw new Error(await res.text());
      ok.style.display = 'block';
      resetAccioForm();
      carregaAdminAccions();
      carregaAccions();
    } catch (e) {
      err.textContent = 'Error: ' + e.message; err.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = editingAccioId ? 'Actualitzar' : 'Publicar acció';
    }
  });

  /* ── Delegació d'events per als botons de la llista ── */
  document.getElementById('admin-noticies-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.type === 'noticia-edit') editarNoticia(id);
    if (btn.dataset.type === 'noticia-del')  eliminarNoticia(id);
  });

  document.getElementById('admin-accions-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.type === 'accio-edit') editarAccio(id);
    if (btn.dataset.type === 'accio-del')  eliminarAccio(id);
  });

})();

/* ── Escapa HTML bàsic ── */
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
