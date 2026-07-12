/* ═══════════════════════════════════════════
   SIÓ VIU – news.js  (Supabase)
   ═══════════════════════════════════════════ */

const SUPA_URL = 'https://kvpqemvhhprtyfzdmcjq.supabase.co';
const SUPA_KEY = 'sb_publishable_FOX_rvKBWKzeif7movnuTA_9ImVIFzt';

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

const NOTICIES_LIMIT = 3;
let noticiesData = [];

function renderNoticies(expanded) {
  const el = document.getElementById('noticies-dinamiques');
  const btn = document.querySelector('.mostra-mes');
  if (!el) return;
  const visible = expanded ? noticiesData : noticiesData.slice(0, NOTICIES_LIMIT);
  el.innerHTML = visible.map(n => `
    <div class="noticia-card">
      <div class="noticia-card-img">
        ${n.imatge_url ? `<img src="${esc(n.imatge_url)}" alt="${esc(n.titol)}">` : ''}
      </div>
      <div class="noticia-card-body">
        <h4 class="noticia-card-title">${esc(n.titol)}</h4>
        ${n.cos ? `<p class="noticia-card-excerpt">${esc(n.cos).substring(0,120)}${n.cos.length>120?'…':''}</p>` : ''}
        ${n.link ? `<a href="${esc(n.link)}" target="_blank" rel="noopener" class="arrow-link" style="font-size:.78rem;margin-top:.3rem">Llegir més →</a>` : ''}
      </div>
    </div>`).join('');
  if (btn) {
    if (noticiesData.length <= NOTICIES_LIMIT) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
      btn.textContent = expanded ? "Mostra'n menys" : "Mostra'n més";
      btn.dataset.expanded = expanded ? '1' : '0';
    }
  }
}

async function carregaNoticies() {
  const el = document.getElementById('noticies-dinamiques');
  if (!el) return;
  el.innerHTML = '<p style="color:#888;font-size:.85rem">Carregant notícies...</p>';
  try {
    const res  = await supaFetch('/rest/v1/noticies?select=*&order=created_at.desc');
    const data = await res.json();
    if (!data.length) { el.innerHTML = '<p style="color:#888;font-size:.85rem">Properament...</p>'; return; }
    noticiesData = data;
    renderNoticies(false);
  } catch { el.innerHTML = '<p style="color:#888;font-size:.85rem">Error carregant notícies.</p>'; }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.mostra-mes');
  if (btn) {
    btn.style.display = 'none';
    btn.addEventListener('click', e => {
      e.preventDefault();
      renderNoticies(btn.dataset.expanded !== '1');
    });
  }
});

carregaNoticies();

/* ═══════════════════════════════════════════
   ADHERITS AL MANIFEST – llista pública + comptador
   ═══════════════════════════════════════════ */
async function carregaAdherits() {
  const el = document.getElementById('adherits-llista');
  const countEl = document.getElementById('adherits-count');
  if (!el) return;
  try {
    const res  = await supaFetch('/rest/v1/adherits?select=nom&order=nom.asc');
    const data = await res.json();
    if (countEl) countEl.textContent = Array.isArray(data) ? data.length : 0;
    if (!Array.isArray(data) || !data.length) {
      el.innerHTML = '<p style="color:#888;font-size:.85rem">Properament...</p>';
      return;
    }
    el.innerHTML = data.map(a => `<div class="adherits-item">${esc(a.nom)}</div>`).join('');
  } catch {
    el.innerHTML = '<p style="color:#888;font-size:.85rem">Error carregant la llista.</p>';
  }
}

carregaAdherits();

/* ── Supabase Storage upload ── */
async function uploadImageToStorage(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const res = await fetch(`${SUPA_URL}/storage/v1/object/noticies/${filename}`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'false'
    },
    body: file
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
  return `${SUPA_URL}/storage/v1/object/public/noticies/${filename}`;
}

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
      document.getElementById('a-titol').focus();
    } else {
      pwdErr.style.display = 'block';
      pwdInput.value = ''; pwdInput.focus();
    }
  }
  document.getElementById('admin-pwd-btn').addEventListener('click', verificaPwd);
  pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') verificaPwd(); });


  /* ════════════════════════════════
     NOTÍCIES CRUD
     ════════════════════════════════ */
  let noticiesCache = {};
  let editingNoticiaId = null;
  let removeImatge = false;

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
    document.getElementById('a-titol').value = n.titol || '';
    document.getElementById('a-cos').value   = n.cos   || '';
    document.getElementById('a-link').value  = n.link  || '';
    document.getElementById('a-imatge-file').value = '';
    document.getElementById('a-imatge-status').textContent = '';
    const prev = document.getElementById('a-imatge-preview');
    const info = document.getElementById('a-imatge-info');
    const removeBtn = document.getElementById('a-imatge-remove');
    if (n.imatge_url) {
      prev.src = n.imatge_url; prev.style.display = '';
      info.textContent = 'Selecciona per canviar la imatge';
      if (removeBtn) removeBtn.style.display = '';
    } else {
      prev.style.display = 'none';
      info.textContent = '📎 Clica o arrossega una imatge aquí';
      if (removeBtn) removeBtn.style.display = 'none';
    }
    document.getElementById('noticia-form-h').textContent      = 'EDITAR NOTÍCIA';
    document.getElementById('admin-noticia-btn').textContent   = 'Actualitzar';
    document.getElementById('admin-noticia-cancel').style.display = '';
    document.getElementById('admin-panel-noticia').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('a-titol').focus();
  }

  async function eliminarNoticia(id) {
    if (!confirm('Eliminar aquesta notícia?')) return;
    const res = await supaFetch(`/rest/v1/noticies?id=eq.${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'count=exact' }
    });
    const range = res.headers.get('Content-Range') || '';
    const count = parseInt(range.split('/')[1] ?? '-1', 10);
    if (!res.ok || count === 0) {
      alert('No s\'ha pogut eliminar.\n\nAfegeix una política DELETE a Supabase:\nSQL Editor → New query → Executa:\n\nCREATE POLICY "anon delete noticies" ON noticies FOR DELETE TO anon USING (true);');
      return;
    }
    resetNoticiaForm();
    carregaAdminNoticies();
    carregaNoticies();
  }

  function resetNoticiaForm() {
    editingNoticiaId = null;
    removeImatge = false;
    ['a-titol','a-cos','a-link'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('a-imatge-file').value = '';
    document.getElementById('a-imatge-preview').style.display = 'none';
    document.getElementById('a-imatge-info').textContent = '📎 Clica o arrossega una imatge aquí';
    document.getElementById('a-imatge-status').textContent = '';
    document.getElementById('a-imatge-remove').style.display = 'none';
    document.getElementById('noticia-form-h').textContent      = 'NOVA NOTÍCIA';
    document.getElementById('admin-noticia-btn').textContent   = 'Publicar';
    document.getElementById('admin-noticia-cancel').style.display = 'none';
    document.getElementById('admin-noticia-err').style.display = 'none';
    document.getElementById('admin-noticia-ok').style.display  = 'none';
  }

  document.getElementById('admin-noticia-cancel').addEventListener('click', resetNoticiaForm);

  /* botó treure imatge */
  document.getElementById('a-imatge-remove').addEventListener('click', () => {
    removeImatge = true;
    document.getElementById('a-imatge-file').value = '';
    document.getElementById('a-imatge-preview').style.display = 'none';
    document.getElementById('a-imatge-info').textContent = '📎 Clica o arrossega una imatge aquí';
    document.getElementById('a-imatge-remove').style.display = 'none';
    document.getElementById('a-imatge-status').textContent = 'La imatge s\'eliminarà en guardar';
  });

  /* previsualització en triar arxiu */
  document.getElementById('a-imatge-file').addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    removeImatge = false;
    const prev = document.getElementById('a-imatge-preview');
    const info = document.getElementById('a-imatge-info');
    const reader = new FileReader();
    reader.onload = e => { prev.src = e.target.result; prev.style.display = ''; info.textContent = file.name; };
    reader.readAsDataURL(file);
  });

  document.getElementById('admin-noticia-btn').addEventListener('click', async () => {
    const titol  = document.getElementById('a-titol').value.trim();
    const cos    = document.getElementById('a-cos').value.trim();
    const link   = document.getElementById('a-link').value.trim() || null;
    const file   = document.getElementById('a-imatge-file').files[0];
    const status = document.getElementById('a-imatge-status');
    const err = document.getElementById('admin-noticia-err');
    const ok  = document.getElementById('admin-noticia-ok');
    const btn = document.getElementById('admin-noticia-btn');

    err.style.display = 'none'; ok.style.display = 'none'; status.textContent = '';
    if (!titol || !cos) { err.textContent = 'Títol i Cos són obligatoris.'; err.style.display = 'block'; return; }

    btn.disabled = true;

    /* determina imatge_url final */
    let imatge_url = removeImatge ? null
      : editingNoticiaId ? (noticiesCache[editingNoticiaId]?.imatge_url || null)
      : null;
    if (file) {
      btn.textContent = 'Pujant imatge...';
      try {
        imatge_url = await uploadImageToStorage(file);
        status.textContent = '✓ Imatge pujada';
      } catch (e) {
        err.textContent = 'Error pujant la imatge. Crea el bucket "noticies" a Supabase Storage.';
        err.style.display = 'block';
        btn.disabled = false; btn.textContent = editingNoticiaId ? 'Actualitzar' : 'Publicar';
        return;
      }
    }

    btn.textContent = editingNoticiaId ? 'Actualitzant...' : 'Publicant...';
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

  /* ── Delegació d'events per als botons de la llista ── */
  document.getElementById('admin-noticies-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.type === 'noticia-edit') editarNoticia(id);
    if (btn.dataset.type === 'noticia-del')  eliminarNoticia(id);
  });


  /* ════════════════════════════════
     PESTANYES (Notícies / Adherits)
     ════════════════════════════════ */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.tab;
      document.getElementById('admin-panel-noticia').style.display = which === 'noticia' ? '' : 'none';
      document.getElementById('admin-panel-adherit').style.display = which === 'adherit' ? '' : 'none';
      if (which === 'adherit') carregaAdminAdherits();
    });
  });


  /* ════════════════════════════════
     ADHERITS CRUD
     ════════════════════════════════ */
  let adheritsCache = {};
  let editingAdheritId = null;

  async function carregaAdminAdherits() {
    const el = document.getElementById('admin-adherits-list');
    el.innerHTML = '<p style="color:#888;font-size:.8rem">Carregant...</p>';
    const res  = await supaFetch('/rest/v1/adherits?select=id,nom&order=nom.asc');
    const data = await res.json();
    adheritsCache = {};
    if (!Array.isArray(data) || !data.length) { el.innerHTML = '<p style="color:#888;font-size:.8rem">Cap entitat adherida.</p>'; return; }
    data.forEach(a => adheritsCache[a.id] = a);
    el.innerHTML = data.map(a => `
      <div class="admin-list-item">
        <div class="admin-list-info"><h6>${esc(a.nom)}</h6></div>
        <div class="admin-list-actions">
          <button class="admin-btn-sm admin-btn-edit" data-id="${a.id}" data-type="adherit-edit">Editar</button>
          <button class="admin-btn-sm admin-btn-del"  data-id="${a.id}" data-type="adherit-del">Eliminar</button>
        </div>
      </div>`).join('');
  }

  function editarAdherit(id) {
    const a = adheritsCache[id];
    editingAdheritId = id;
    document.getElementById('ad-nom').value = a.nom || '';
    document.getElementById('adherit-form-h').textContent    = 'EDITAR ENTITAT';
    document.getElementById('admin-adherit-btn').textContent = 'Actualitzar';
    document.getElementById('admin-adherit-cancel').style.display = '';
    document.getElementById('ad-nom').focus();
  }

  function resetAdheritForm() {
    editingAdheritId = null;
    document.getElementById('ad-nom').value = '';
    document.getElementById('adherit-form-h').textContent    = 'NOVA ENTITAT';
    document.getElementById('admin-adherit-btn').textContent = 'Afegir';
    document.getElementById('admin-adherit-cancel').style.display = 'none';
    document.getElementById('admin-adherit-err').style.display = 'none';
    document.getElementById('admin-adherit-ok').style.display  = 'none';
  }
  document.getElementById('admin-adherit-cancel').addEventListener('click', resetAdheritForm);

  async function eliminarAdherit(id) {
    if (!confirm('Eliminar aquesta entitat?')) return;
    const res = await supaFetch(`/rest/v1/adherits?id=eq.${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'count=exact' }
    });
    const count = parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '-1', 10);
    if (!res.ok || count === 0) {
      alert('No s\'ha pogut eliminar.\n\nAfegeix una política DELETE a Supabase per a la taula "adherits".');
      return;
    }
    resetAdheritForm();
    carregaAdminAdherits();
    carregaAdherits();
  }

  async function desaAdherit() {
    const nom = document.getElementById('ad-nom').value.trim();
    const err = document.getElementById('admin-adherit-err');
    const ok  = document.getElementById('admin-adherit-ok');
    const btn = document.getElementById('admin-adherit-btn');
    err.style.display = 'none'; ok.style.display = 'none';
    if (!nom) { err.textContent = 'El nom és obligatori.'; err.style.display = 'block'; return; }
    btn.disabled = true;
    try {
      let res;
      if (editingAdheritId) {
        res = await supaFetch(`/rest/v1/adherits?id=eq.${editingAdheritId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ nom })
        });
        ok.textContent = 'Entitat actualitzada!';
      } else {
        res = await supaFetch('/rest/v1/adherits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ nom })
        });
        ok.textContent = 'Entitat afegida!';
      }
      if (!res.ok) throw new Error(await res.text());
      ok.style.display = 'block';
      resetAdheritForm();
      carregaAdminAdherits();
      carregaAdherits();
    } catch (e) {
      err.textContent = 'Error: ' + e.message; err.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = editingAdheritId ? 'Actualitzar' : 'Afegir';
    }
  }

  document.getElementById('admin-adherit-btn').addEventListener('click', desaAdherit);
  document.getElementById('ad-nom').addEventListener('keydown', e => { if (e.key === 'Enter') desaAdherit(); });

  document.getElementById('admin-adherits-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.type === 'adherit-edit') editarAdherit(id);
    if (btn.dataset.type === 'adherit-del')  eliminarAdherit(id);
  });

})();

/* ── Escapa HTML bàsic ── */
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
