/* ═══════════════════════════════════════════
   SIÓ VIU – main.js
   ═══════════════════════════════════════════ */

// ─── Navbar: fons en fer scroll ───
(function () {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
})();

// ─── Hero slideshow ───
(function () {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
})();

// ─── Burger menu (mobile) ───
const burger   = document.getElementById('navBurger');
const navLinks = document.querySelector('.nav-links');

if (burger && navLinks) {
  burger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ─── Navbar: activa el link de la secció visible ───
const sections = document.querySelectorAll('section[id], header[id]');
const navItems = document.querySelectorAll('.nav-links a');

const sectionNavMap = { 'per-que': 'el-projecte' };

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const navId = sectionNavMap[entry.target.id] || entry.target.id;
      const active = document.querySelector(`.nav-links a[href="#${navId}"]`);
      if (active) {
        navItems.forEach(a => a.classList.remove('nav-active'));
        active.classList.add('nav-active');
      }
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => observer.observe(s));


/* ═══════════════════════════════════════════
   MAPA INTERACTIU – Leaflet.js
   (dins la secció El Projecte)
   ═══════════════════════════════════════════ */

function initMapa() {
  if (!document.getElementById('mapa')) return;

  const TARROJA    = [41.7303, 1.2744];
  const PRENYANOSA = [41.7108, 1.2891];

  const map = L.map('mapa', {
    center: [41.715, 1.273],
    zoom: 14,
    scrollWheelZoom: false,
    zoomControl: true
  });

  // ── Satèl·lit pur (sense etiquetes, carreteres ni límits) ──
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Imatgeria © Esri, Maxar, Earthstar Geographics'
  }).addTo(map);

  // Marcador principal: Tarroja de Segarra
  const icTarroja = L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;background:#2D3FE0;
      border:3px solid #fff;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,.5);">📍</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  });

  // Marcador secundari
  const icPoble = L.divIcon({
    className: '',
    html: `<div style="
      width:12px;height:12px;background:#FFD200;
      border:2px solid #003399;border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [12, 12], iconAnchor: [6, 6]
  });

  L.marker(TARROJA, { icon: icTarroja })
    .addTo(map)
    .bindPopup(`
      <b style="color:#2D3FE0;">Tarroja de Segarra</b><br>
      Municipi afectat per les plantes de biogàs previstes<br>
      <small style="color:#888;">Segarra, Lleida</small>
    `)
    .openPopup();

  L.marker(PRENYANOSA, { icon: icPoble })
    .addTo(map)
    .bindPopup('<b>La Prenyanosa</b><br>Municipi afectat');

  // Polígons de les plantes + línies de distància (llegit del plantes.kml)
  carregaKML(map);

  map.once('click', () => map.scrollWheelZoom.enable());
}

// ── Llegeix plantes.kml i dibuixa polígons, etiquetes i línies de distància ──
function carregaKML(map) {
  fetch('plantes.kml')
    .then(r => r.text())
    .then(txt => {
      const xml = new DOMParser().parseFromString(txt, 'application/xml');
      const tag = (el, name) => Array.from(el.getElementsByTagNameNS('*', name));
      const toLatLngs = str => str.trim().split(/\s+/).filter(Boolean).map(p => {
        const c = p.split(',');
        return [parseFloat(c[1]), parseFloat(c[0])];   // KML és lng,lat → Leaflet vol lat,lng
      });
      const bounds = L.latLngBounds([]);

      tag(xml, 'Placemark').forEach(pm => {
        const name  = (tag(pm, 'name')[0]?.textContent || '').trim();
        const poly  = tag(pm, 'Polygon')[0];
        const line  = tag(pm, 'LineString')[0];
        const point = tag(pm, 'Point')[0];

        if (poly) {
          const latlngs = toLatLngs(tag(poly, 'coordinates')[0].textContent);
          L.polygon(latlngs, { color: '#CC0000', weight: 3, fillColor: '#CC0000', fillOpacity: .28 })
            .addTo(map)
            .bindPopup('<b style="color:#CC0000;">' + name + '</b>');
          latlngs.forEach(ll => bounds.extend(ll));
        } else if (line) {
          const latlngs = toLatLngs(tag(line, 'coordinates')[0].textContent);
          L.polyline(latlngs, { color: '#FFD200', weight: 3 })
            .addTo(map)
            .bindTooltip(name);
          latlngs.forEach(ll => bounds.extend(ll));
        } else if (point && /^PLANTA\s*\d/i.test(name)) {
          const ll = toLatLngs(tag(point, 'coordinates')[0].textContent)[0];
          L.marker(ll, {
            interactive: false,
            icon: L.divIcon({
              className: '',
              html: '<div style="background:#CC0000;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:11px;padding:2px 7px;border-radius:3px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.5);">' + name + '</div>',
              iconAnchor: [24, -4]
            })
          }).addTo(map);
        }
      });

      if (bounds.isValid()) map.fitBounds(bounds, { padding: [25, 25] });
    })
    .catch(err => console.warn('No s\'ha pogut carregar plantes.kml', err));
}

function carregaLeaflet() {
  if (!document.getElementById('mapa')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = initMapa;
  document.head.appendChild(script);
}

carregaLeaflet();

// ─── Hero: ajusta cada línia perquè ocupi exactament la mateixa amplada ───
function fitHeroText() {
  const container = document.querySelector('.hero-text');
  if (!container) return;
  const cs = getComputedStyle(container);
  const w = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const spans = [...container.querySelectorAll('span')];

  const sizes = spans.map(span => {
    span.style.whiteSpace = 'nowrap';
    span.style.fontSize = '100px';
    const size = Math.floor((w / span.scrollWidth) * 100);
    span.style.whiteSpace = '';
    return size;
  });

  spans.forEach((span, i) => { span.style.fontSize = sizes[i] + 'px'; });
}

if (document.fonts) {
  document.fonts.ready.then(fitHeroText);
} else {
  window.addEventListener('load', fitHeroText);
}
window.addEventListener('resize', fitHeroText);

// ─── Modal legal (Avís Legal / Privacitat / Cookies) ───
(function () {
  const modal   = document.getElementById('legal-modal');
  const content = document.getElementById('legal-content');
  const closeBtn = document.getElementById('legal-close');
  if (!modal) return;

  function obreLegal(id) {
    const tpl = document.getElementById('legal-' + id);
    if (!tpl) return;
    content.innerHTML = tpl.innerHTML;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function tancaLegal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-legal]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); obreLegal(a.dataset.legal); });
  });
  closeBtn.addEventListener('click', tancaLegal);
  modal.addEventListener('click', e => { if (e.target === modal) tancaLegal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tancaLegal(); });
})();

// ─── Territori carousel ───
(function () {
  const slides = Array.from(document.querySelectorAll('.territori-slide'));
  const dots   = Array.from(document.querySelectorAll('.t-dot'));
  if (!slides.length) return;
  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function startTimer() {
    timer = setInterval(() => goTo(current + 1), 4000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(timer);
      goTo(i);
      startTimer();
    });
  });

  startTimer();
})();
