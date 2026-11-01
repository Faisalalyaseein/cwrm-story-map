/* CWRM story web map: Hillah River System monitoring concept.
   Plain Leaflet, no build step. Data: data/*.js (exported read-only from CWRM_Master_v1.gpkg). The story itself is in js/scenes.js. */
(function () {
'use strict';
const D = window.CWRM, SC = D.scenes, $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* colour logic (comment of 2026-11-01): freshwater = blues, drainage water = olive / ochre, stations keep their priority colours. Change here only. */
const PAL = { river: '#0B4F9E', branch: '#1565C0', canal: '#2FA4E7', basinRiver: '#5BA7DC', lake: '#9BCDEB', drain: '#B5651D', mod: '#7A3E0B', basin: '#1565C0', tigris: '#7C8FA0',
  proj: '#2E6B1F', gov: '#6B7785', govHi: '#E8710A', navy: '#0B3C5D', p1: '#E8710A', p2: '#2A9D8F', p3: '#7B8794', alert: '#C62828', ok: '#2A9D8F', dead: '#8C8C8C', iraq: '#0B3C5D' };
const PCOL = { 1: PAL.p1, 2: PAL.p2, 3: PAL.p3 }, PLAB = { 1: '1st priority', 2: '2nd priority', 3: '3rd priority' };
const hav = (a, b, c, d) => { const r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const NA = '<span class="na">Not available yet</span>';

/* ---------- map and panes ---------- */
const map = L.map('map', { zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, attributionControl: true, minZoom: 4, maxZoom: 16, preferCanvas: true });
L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(map);
const Z = { basin: 300, iraq: 310, gov: 320, lakes: 330, basinRivers: 340, euph: 360, projects: 370, canals: 380, drains: 390, mod: 395, reaches: 400, gaps: 410, hrsBox: 420, cities: 430 };
const GROUPS = {};
Object.entries(Z).forEach(([n, z]) => { const p = map.createPane(n); p.style.zIndex = z; p.classList.add('fade'); GROUPS[n] = { pane: p, state: 'off' }; });
map.createPane('stations').style.zIndex = 650; map.createPane('labels').style.zIndex = 640; $('.leaflet-pane.leaflet-labels-pane') && 0;
GROUPS.labels = { pane: map.getPane('labels'), state: 'on' }; map.getPane('labels').classList.add('fade');
const RND = {}, cv = (n, pad = 0.3) => RND[n] || (RND[n] = L.canvas({ pane: n, padding: Math.max(pad, 0.5) }));
const setGroup = (n, st) => { const g = GROUPS[n]; if (!g) return; g.state = st; g.pane.style.opacity = { on: 1, dim: 0.3, off: 0 }[st]; g.pane.style.pointerEvents = st === 'off' ? 'none' : ''; g.pane.dataset.state = st; };
Object.keys(GROUPS).forEach(n => setGroup(n, n === 'labels' || n === 'cities' ? 'on' : 'off'));

/* basemaps: the bundled vector countries map is always underneath (works offline); an online tile layer sits on top (default OpenStreetMap in soft grey) and shows through only where tiles load */
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const VEC = L.geoJSON(D.countries, { pane: 'base', interactive: false, style: f => ({ color: '#B8C3CC', weight: 0.8, fillColor: f.properties.name === 'Iraq' ? '#F6F8F9' : '#E7ECEF', fillOpacity: 1 }) });
const TILES = {
  light: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, errorTileUrl: BLANK, className: 'tiles-soft' }),
  streets: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, errorTileUrl: BLANK }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)', maxZoom: 17, errorTileUrl: BLANK })
};
map.createPane('base').style.zIndex = 190;
let curBase = 'light'; VEC.addTo(map); TILES.light.addTo(map); map.attributionControl.addAttribution('Countries: Natural Earth (public domain)');
document.body.classList.add('base-vector');
const setBase = (b) => { if (TILES[curBase]) map.removeLayer(TILES[curBase]); curBase = b; if (TILES[b]) TILES[b].addTo(map); };
document.body.classList.add('base-vector');

/* ---------- layers ---------- */
const add = (layer, grp) => { layer.addTo(map); return layer; };
const tip = (html) => (f, l) => l.bindTooltip(html(f.properties), { sticky: true });
// basin
const lyBasin = L.geoJSON(D.basin, { pane: 'basin', renderer: cv('basin'), style: f => f.properties.name === 'Euphrates basin' ? { color: PAL.basin, weight: 2, fillColor: PAL.basin, fillOpacity: 0.13 } : { color: PAL.tigris, weight: 1.2, dashArray: '5 4', fillColor: PAL.tigris, fillOpacity: 0.1 }, onEachFeature: tip(p => `<b>${esc(p.name)}</b><br>about ${Math.round(p.km / 1000) * 1000 > 0 ? (Math.round(p.km / 1000) * 1000).toLocaleString() : ''} km² (HydroBASINS level 6)`) }).addTo(map);
const lyIraq = L.geoJSON(D.iraq, { pane: 'iraq', renderer: cv('iraq'), interactive: false, style: { color: PAL.iraq, weight: 2.4, fillColor: PAL.iraq, fillOpacity: 0.05 } }).addTo(map);
// governorates (highlight set per scene)
const govKey = (n) => ({ Babylon: 'Babil', Qadisiya: 'Al-Qadisiyah', Muthanna: 'Muthanna', Najaf: 'Najaf', Kerbela: 'Karbala', Baghdad: 'Baghdad', Wasit: 'Wasit', 'Thi-Qar': 'Thi-Qar', Anbar: 'Anbar' }[n] || n);
const GOVHI = ['Babylon', 'Qadisiya', 'Muthanna'];
let govFill = false;
const lyGov = L.geoJSON(D.governorates, { pane: 'gov', renderer: cv('gov'), interactive: false, style: f => ({ color: PAL.gov, weight: 1.2, dashArray: '8 4 2 4', fillColor: PAL.govHi, fillOpacity: govFill && GOVHI.includes(f.properties.en) ? 0.12 : 0 }) }).addTo(map);
function center(g) { const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map(p => p[0]); let best = null, ba = -1; rings.forEach(r => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; r.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); const a = (x1 - x0) * (y1 - y0); if (a > ba) { ba = a; best = [(y0 + y1) / 2, (x0 + x1) / 2]; } }); return best; }
const lyGovLab = L.layerGroup();
D.governorates.features.forEach(f => { if (!['Babylon', 'Qadisiya', 'Muthanna', 'Najaf', 'Kerbela', 'Wasit', 'Baghdad'].includes(f.properties.en)) return; const c = center(f.geometry); if (c) L.marker(c, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab gov ${GOVHI.includes(f.properties.en) ? 'hi' : ''}">${esc(govKey(f.properties.en))}</div>` }) }).addTo(lyGovLab); });
// rivers, lakes
const RW = { 1: 2.4, 2: 1.4, 3: 0.8 };
const lyBR = L.geoJSON(D.basinRivers, { pane: 'basinRivers', renderer: cv('basinRivers'), style: f => ({ color: PAL.basinRiver, weight: RW[f.properties.rank] || 0.8, opacity: 0.95 }), onEachFeature: tip(p => `<b>${esc(p.name || 'River')}</b>`) }).addTo(map);
const lyLakes = L.geoJSON(D.basinLakes, { pane: 'lakes', renderer: cv('lakes'), style: { color: PAL.branch, weight: 0.8, fillColor: PAL.lake, fillOpacity: 0.9 }, onEachFeature: tip(p => `<b>${esc(p.name || 'Lake')}</b>`) }).addTo(map);
const lyEuph = [D.euphUp, D.euphrates].map(d => L.geoJSON(d, { pane: 'euph', renderer: cv('euph'), style: { color: PAL.river, weight: 3, opacity: 1, lineCap: 'round' }, onEachFeature: tip(() => '<b>Euphrates River</b>') }).addTo(map));
const setEuphWeight = (w) => lyEuph.forEach(l => l.setStyle({ weight: w }));
const lyReach = L.geoJSON(D.reaches, { pane: 'reaches', renderer: cv('reaches'), style: { color: PAL.branch, weight: 4, opacity: 1, lineCap: 'round' }, onEachFeature: (f, l) => l.bindTooltip(`<b>${esc(f.properties.branch)}</b> reach ${f.properties.order} &middot; ${(+f.properties.km).toFixed(1)} km`, { sticky: true }) }).addTo(map);
const branchOf = (b) => ({ Hillah: 'Hillah', Daghara: 'Daghara', Diwaniah: 'Diwaniyah', Rumaitha: 'Diwaniyah' }[b] || b);
function focusBranch(name) { lyReach.eachLayer(l => { const on = !name || branchOf(l.feature.properties.branch) === name; l.setStyle({ weight: on ? (name ? 6 : 4) : 2, opacity: on ? 1 : 0.35 }); }); }
// canals and drains (class-dependent detail by zoom)
const net = [];
const feats = (fc, fn) => ({ type: 'FeatureCollection', features: fc.features.filter(fn) });
const dead = (s) => s === 'Non Functioning' || s === 'Abandoned', cls = (c) => (c == null ? 4 : c);
function addNet(fc, grp, minZoom, style, pop) { if (!fc.features.length) return; net.push({ grp, minZoom, layer: L.geoJSON(fc, { pane: grp, renderer: cv(grp, 0.5), style: () => style, onEachFeature: (f, l) => pop && l.bindTooltip(pop(f.properties), { sticky: true }) }) }); }
const cPop = (p) => `<b>${esc(p.n || 'Irrigation canal')}</b><br>${p.l != null ? (+p.l).toFixed(1) : '-'} km &middot; ${esc(p.s || 'not surveyed')}`, dPop = (p) => `<b>${esc(p.n || 'Drain')}</b>${p.m ? ' (Main Outfall Drain)' : ''}<br>${p.l != null ? (+p.l).toFixed(1) : '-'} km &middot; ${esc(p.s || 'not surveyed')}`;
[[c => c <= 1, 3, 7], [c => c === 2, 2, 8], [c => c === 3, 1.4, 9], [c => c >= 4, 1, 10]].forEach(([t, w, z]) => addNet(feats(D.canals, f => !dead(f.properties.s) && t(cls(f.properties.c))), 'canals', z, { color: PAL.canal, weight: w, opacity: 0.95 }, cPop));
[[f => f.properties.j && !f.properties.m, 3.6, 7], [f => !f.properties.j && !f.properties.m && cls(f.properties.c) <= 2, 2.4, 8], [f => !f.properties.j && !f.properties.m && cls(f.properties.c) === 3, 1.5, 9], [f => !f.properties.j && !f.properties.m && cls(f.properties.c) >= 4, 1, 10]].forEach(([t, w, z]) => addNet(feats(D.drains, f => !dead(f.properties.s) && t(f)), 'drains', z, { color: PAL.drain, weight: w, opacity: 0.95 }, dPop));
addNet(feats(D.drains, f => f.properties.m), 'mod', 0, { color: PAL.mod, weight: 5, opacity: 1, lineCap: 'round' }, dPop);
function syncNet() { const z = map.getZoom(); net.forEach(n => { const want = GROUPS[n.grp].state !== 'off' && z >= n.minZoom; if (want && !map.hasLayer(n.layer)) n.layer.addTo(map); if (!want && map.hasLayer(n.layer)) map.removeLayer(n.layer); }); }
map.on('zoomend', syncNet);
const lyProj = L.geoJSON(D.projects, { pane: 'projects', renderer: cv('projects'), style: f => ({ color: PAL.proj, weight: 2, dashArray: f.properties.status === 'Partially Developed' ? null : '7 5', fillColor: PAL.proj, fillOpacity: 0.05 }), onEachFeature: (f, l) => l.bindTooltip(`<b>${esc(f.properties.name)}</b> (${esc(f.properties.code)})<br>${esc(f.properties.status)} &middot; ${Math.round(f.properties.ha).toLocaleString()} ha`, { sticky: true }) }).addTo(map);
// Hillah River System box
const lyBox = L.layerGroup([L.rectangle([[31.35, 44.15], [32.85, 45.7]], { pane: 'hrsBox', renderer: cv('hrsBox'), color: PAL.p1, weight: 3, dashArray: '10 6', fillColor: PAL.p1, fillOpacity: 0.12, interactive: false })]).addTo(map);
L.marker([32.95, 44.9], { pane: 'hrsBox', interactive: false, icon: L.divIcon({ className: '', html: '<div class="lab hrs">Hillah River System</div>' }) }).addTo(lyBox);

/* ---------- labels ---------- */
const lyCountries = L.layerGroup();
[['Türkiye', 38.6, 36.0], ['Syria', 35.0, 38.8], ['Iraq', 33.0, 43.4], ['Iran', 32.4, 53.2], ['Saudi Arabia', 26.5, 43.5], ['Jordan', 31.1, 37.0], ['Kuwait', 29.3, 47.6]].forEach(([n, lat, lng]) => L.marker([lat, lng], { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab country">${n}</div>` }) }).addTo(lyCountries));
const lyRivLab = L.layerGroup();
(function () {
  const mid = (fc, pick) => { const f = fc.features.filter(pick)[0]; if (!f) return null; let c = f.geometry.coordinates; while (Array.isArray(c[0][0])) c = c[Math.floor(c.length / 2)]; const p = c[Math.floor(c.length / 2)]; return [p[1], p[0]]; };
  const e = mid(D.euphUp, () => true); const t = mid(D.basinRivers, f => f.properties.system === 'Tigris' && f.properties.rank === 1);
  if (e) L.marker(e, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: '<div class="lab river">Euphrates</div>' }) }).addTo(lyRivLab);
  if (t) L.marker(t, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: '<div class="lab river tig">Tigris</div>' }) }).addTo(lyRivLab);
  const ee = mid(D.euphrates, () => true); if (ee) L.marker(ee, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: '<div class="lab river">Euphrates</div>' }) }).addTo(lyRivLab);
  L.marker([34.3, 41.0], { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: '<div class="lab basinlab">Euphrates basin</div>' }) }).addTo(lyRivLab);
})();
const lyBranchLab = L.layerGroup();
(function () { const best = {}; D.reaches.features.forEach(f => { const b = branchOf(f.properties.branch); const g = f.geometry; const ln = g.type === 'MultiLineString' ? g.coordinates[0] : g.coordinates; const fr = { Hillah: 0.5, Daghara: 0.8, Diwaniyah: 0.3 }[b] || 0.5, p = ln[Math.floor(ln.length * fr)]; if (!best[b] || f.properties.km > best[b].km) best[b] = { km: f.properties.km, p }; });
  const T = { Hillah: 'Hillah main channel', Daghara: 'Daghara branch', Diwaniyah: 'Diwaniyah / Rumaytha branch' }; Object.entries(best).forEach(([b, o]) => L.marker([o.p[1], o.p[0]], { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab branch" data-b="${b}">${T[b]}</div>` }) }).addTo(lyBranchLab)); })();
const cityMk = {};
D.cities.features.forEach(f => { const n = f.properties.name; cityMk[n] = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { pane: 'cities', icon: L.divIcon({ className: '', html: `<div class="city"><i></i><span>${esc(n)}</span></div>`, iconSize: [0, 0] }), keyboard: false, title: n }); cityMk[n].bindTooltip(`${esc(n)} ${f.properties.ar ? '&middot; <span dir="rtl">' + esc(f.properties.ar) + '</span>' : ''}`, { direction: 'top', offset: [0, -4] }); });
let barrage = null;

/* ---------- stations ---------- */
const S = D.stations.features.map(f => Object.assign({}, f.properties, { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }));
const byId = Object.fromEntries(S.map(s => [s.id, s]));
S.forEach(s => { const x = (D.extra || {})[s.id] || {}; ['institution', 'parametersCurrent', 'parametersProposed', 'telemetry', 'statusText', 'justification'].forEach(k => { if (x[k]) s[k] = x[k]; }); if (x.photos && x.photos.length) s.photos = (s.photos || []).concat(x.photos); });
const EXIST = S.filter(s => s.status === 'existing');
S.forEach(s => { s.nearEx = s.status === 'proposed' ? Math.min(...EXIST.map(e => hav(s.lat, s.lng, e.lat, e.lng))) : null; s.gapSite = s.status === 'proposed' && s.nearEx > 2; });
const linkTarget = (s) => s.linked || ((s.linkNote || '').match(/\b((?:H|DA|DI)-\d\d)\b/) || [])[1] || null;
const colorOf = (s) => (s.status === 'existing' ? PAL.navy : PCOL[s.priority] || PAL.p3);
function icon(s, sel) {
  const ex = s.status === 'existing', size = ex ? 28 : ({ 1: 28, 2: 25, 3: 22 }[s.priority] || 24), col = colorOf(s);
  const att = s.attention ? '<span class="att">!</span>' : '';
  const html = `<div class="mk ${sel ? 'sel' : ''}" style="width:${size}px;height:${size}px"><svg viewBox="-13 -13 26 26" width="${size}" height="${size}"><path d="M0-10.5L10.5 0L0 10.5L-10.5 0Z" fill="${ex ? PAL.navy : '#fff'}" stroke="${ex ? '#fff' : col}" stroke-width="${ex ? 2.2 : 3.2}" stroke-linejoin="round"/></svg>${att}</div>`;
  const nudge = (!ex && s.nearEx != null && s.nearEx < 0.5) ? [-15, -12] : [0, 0];
  return L.divIcon({ html, className: 'mk-wrap', iconSize: [size, size], iconAnchor: [size / 2 + nudge[0], size / 2 + nudge[1]] });
}
const mk = {}, stationLayer = L.layerGroup().addTo(map), linkLayer = L.layerGroup().addTo(map);
S.forEach(s => { const m = L.marker([s.lat, s.lng], { pane: 'stations', icon: icon(s), title: s.id + ' ' + s.name, riseOnHover: true }); m.on('click', () => openCard(s.id, true)); m.bindTooltip(esc(s.id), { permanent: true, direction: 'right', offset: [12, 0], className: 'stn-label' }); mk[s.id] = m; });
const modMk = D.modStations.features.map((f, i) => { const nm = f.properties.name.replace(/\s*MD-?\s*MOD\s*$/i, '').replace(/Mussaib/, 'Musayyib').trim(); const m = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { pane: 'stations', title: nm, icon: L.divIcon({ className: 'mk-wrap', iconSize: [24, 24], iconAnchor: [12, 12], html: `<div class="mk mod"><svg viewBox="-13 -13 26 26" width="24" height="24"><rect x="-8.5" y="-8.5" width="17" height="17" rx="2" fill="#fff" stroke="${PAL.mod}" stroke-width="3.2"/></svg></div>` }) }); m.bindTooltip(esc(nm), { permanent: true, direction: 'right', offset: [11, 0], className: 'stn-label mod' }); m.on('click', () => openMod(i)); m._nm = nm; return m; });
function includeStation(s, spec) {
  if (!spec || spec === 'none') return false; if (spec === 'all') return true;
  if (spec.ids && spec.ids.includes(s.id)) return true;
  if (s.status === 'existing') return spec.status === 'existing';
  return !!((spec.priority && spec.priority.includes(s.priority)) || (spec.gapSites && s.gapSite));
}
/* ---------- gaps ---------- */
const gapLayer = L.layerGroup(), RADIUS = 25; let gapStats = { total: 0, covered: 0 };
(function () {
  let tot = 0, cov = 0;
  D.reaches.features.forEach(f => { const lines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    lines.forEach(ln => { let run = [], rc = null; const flush = () => { if (run.length > 1) L.polyline(run, { pane: 'gaps', renderer: cv('gaps'), color: rc ? PAL.ok : PAL.alert, weight: 7, opacity: 0.95, dashArray: rc ? null : '3 9', lineCap: rc ? 'round' : 'butt' }).bindTooltip(rc ? `Within ${RADIUS} km of an existing station` : `Beyond ${RADIUS} km of any existing station`, { sticky: true }).addTo(gapLayer); };
      for (let i = 0; i < ln.length - 1; i++) { const a = ln[i], b = ln[i + 1], len = hav(a[1], a[0], b[1], b[0]), dmin = Math.min(...EXIST.map(e => hav((a[1] + b[1]) / 2, (a[0] + b[0]) / 2, e.lat, e.lng))), c = dmin <= RADIUS; tot += len; if (c) cov += len; if (rc === null) { rc = c; run = [[a[1], a[0]]]; } if (c !== rc) { flush(); rc = c; run = [[a[1], a[0]]]; } run.push([b[1], b[0]]); }
      flush(); }); });
  EXIST.forEach(e => L.circle([e.lat, e.lng], { radius: RADIUS * 1000, pane: 'gaps', renderer: cv('gaps'), color: PAL.navy, weight: 1.2, dashArray: '4 6', fillColor: PAL.navy, fillOpacity: 0.05, interactive: false }).addTo(gapLayer));
  gapStats = { total: tot, covered: cov }; gapLayer.addTo(map);
})();

/* ---------- station card ---------- */
let cardId = null, photoIx = 0, techOn = false;
const TECH = [['tech_camera.jpg', 'Camera-based observation', 'Visual record of the water level and the site'], ['tech_radar.jpg', 'Non-contact radar', 'Water level and surface velocity / flow'], ['tech_wq.jpg', 'Multiparameter sonde', 'Continuous water quality (pH, DO, EC, temperature, turbidity)']];
function openCard(id, user) {
  const s = byId[id]; if (!s) return; cardId = id; photoIx = 0; renderCard(s); $('#card').classList.add('open'); document.body.classList.add('card-open');
  Object.entries(mk).forEach(([k, m]) => m.setIcon(icon(byId[k], k === id)));
  if (user && !exploring) map.panTo([s.lat, s.lng], { animate: true });
}
function closeCard() { cardId = null; $('#card').classList.remove('open'); document.body.classList.remove('card-open'); Object.entries(mk).forEach(([k, m]) => m.setIcon(icon(byId[k], false))); }
function renderCard(s) {
  const ex = s.status === 'existing', ph = s.photos || [], col = colorOf(s);
  const row = (k, v) => `<div class="r"><dt>${k}</dt><dd>${v || NA}</dd></div>`;
  const dms = (v, p, n) => { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), sec = ((a - d - m / 60) * 3600).toFixed(1); return `${d}°${m}'${sec}"${v >= 0 ? p : n}`; };
  $('#card').innerHTML = `<div class="chead"><span class="badge" style="background:${col}"></span><div><h3>${esc(s.id)} &middot; ${esc(s.name)}</h3><span class="sub">${ex ? 'Existing station' : 'Proposed &middot; ' + PLAB[s.priority]}${s.attention ? ' &middot; <b class="warn">needs attention</b>' : ''}</span></div><button class="x" id="cardX" type="button" aria-label="Close">&times;</button></div>
  ${ph.length ? `<div class="photo"><img id="cardImg" src="${esc(ph[0].src)}" alt="${esc(ph[0].caption)}">${ph.length > 1 ? '<button class="pn l" id="phPrev" type="button">&#10094;</button><button class="pn r" id="phNext" type="button">&#10095;</button>' : ''}<span class="cap" id="cardCap">${esc(ph[0].caption)}${ph.length > 1 ? ' (1/' + ph.length + ')' : ''}</span></div>` : ''}
  ${techOn && !ex ? `<h4 class="th">Technologies that could be installed here</h4><div class="tech">${TECH.map(t => `<figure><img src="img/${t[0]}" alt="${esc(t[1])}"><figcaption><b>${esc(t[1])}</b>${esc(t[2])}</figcaption></figure>`).join('')}</div><div class="fine">Illustrative images; source and licence to be confirmed.</div>` : ''}
  <dl>${ex ? row('Condition', esc(s.statusText)) + row('Basis', esc(s.attentionBasis)) + row('Parameters measured now', esc(s.parametersCurrent)) + row('Telemetry', esc(s.telemetry)) : row('Purpose of the site', esc(s.role)) + row('Branch', esc(s.branch) + (s.riverKm != null ? ' &middot; chainage ' + s.riverKm + ' km' : '')) + row('Parameters', esc(s.parametersProposed)) + row('Telemetry', esc(s.telemetry))}
  ${row('Coordinates', `${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}<br><span class="dms">${dms(s.lat, 'N', 'S')} ${dms(s.lng, 'E', 'W')}</span>`)}${linkTarget(s) ? row('Linked site', `<a href="#" data-go="${esc(linkTarget(s))}">${esc(linkTarget(s))}</a>`) : ''}</dl>`;
  $('#card').classList.toggle('tech-on', techOn && !ex);
  $('#cardX').onclick = closeCard;
  const upd = (d) => { photoIx = (photoIx + d + ph.length) % ph.length; $('#cardImg').src = ph[photoIx].src; $('#cardCap').textContent = ph[photoIx].caption + ' (' + (photoIx + 1) + '/' + ph.length + ')'; };
  $('#phPrev') && ($('#phPrev').onclick = () => upd(-1)); $('#phNext') && ($('#phNext').onclick = () => upd(1));
  $('#card').querySelectorAll('[data-go]').forEach(a => a.onclick = (e) => { e.preventDefault(); if (mk[a.dataset.go] && !map.hasLayer(mk[a.dataset.go])) mk[a.dataset.go].addTo(stationLayer); openCard(a.dataset.go, true); });
}
function openMod(i) { const m = modMk[i]; cardId = 'MOD' + i; const p = m.getLatLng(); $('#card').innerHTML = `<div class="chead"><span class="badge sq" style="border-color:${PAL.mod}"></span><div><h3>${esc(m._nm)}</h3><span class="sub">Proposed monitoring point on the Main Outfall Drain</span></div><button class="x" id="cardX" type="button" aria-label="Close">&times;</button></div><dl><div class="r"><dt>Role</dt><dd>One of four proposed stations along the Main Outfall Drain (the Third River): drainage water quality, salinity and pollution sources.</dd></div><div class="r"><dt>Coordinates</dt><dd>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</dd></div><div class="r"><dt>Parameters, priority, photographs</dt><dd>${NA}</dd></div></dl><div class="fine">Point taken from the project map file; priority and parameters are to be confirmed.</div>`; $('#cardX').onclick = closeCard; $('#card').classList.add('open'); document.body.classList.add('card-open'); }

/* ---------- scene engine ---------- */
let si = 0, st = 0, exploring = false, first = true;
const LEG = { euph: ['line', PAL.river, 4, 'Euphrates River (freshwater)'], reaches: ['line', PAL.branch, 4, 'Hillah River System (branches)'], canals: ['line', PAL.canal, 2, 'Irrigation canals (freshwater)'], drains: ['line', PAL.drain, 2, 'Drainage canals (drainage water)'], mod: ['line', PAL.mod, 5, 'Main Outfall Drain (MOD)'], projects: ['dash', PAL.proj, 2, 'Irrigation projects'], basinRivers: ['line', PAL.basinRiver, 1.5, 'Rivers of the basin'], lakes: ['box', PAL.lake, 0, 'Lakes and reservoirs'], basin: ['box', 'rgba(21,101,192,.25)', 0, 'Euphrates basin'], iraq: ['dash', PAL.iraq, 2, 'Iraq'], hrsBox: ['dash', PAL.p1, 2, 'Hillah River System'], gaps: ['line', PAL.ok, 5, 'River within 25 km of an existing station'] };
const stateOf = (i, j) => { const sc = SC[i], stp = (sc.steps && sc.steps[j]) || {}; return Object.assign({}, sc, stp, { layers: Object.assign({}, sc.layers, stp.layers), camera: stp.camera || sc.camera }); };
function fitCamera(cam, instant) { const w = innerWidth, narrow = w < 900; const tl = cam.pad ? [cam.pad[0], cam.pad[1]] : (narrow ? [16, 64] : [(exploring ? 330 : 400), 76]), br = cam.pad ? [cam.pad[2], cam.pad[3]] : (narrow ? [16, 250] : [(cardId ? 400 : 30), 100]); const o = { paddingTopLeft: tl, paddingBottomRight: br, animate: !instant, duration: 1.8, easeLinearity: 0.2, maxZoom: 12 }; if (instant) map.fitBounds(cam.b, o); else map.flyToBounds(cam.b, o); }
function applyState(S0, camChanged, instant) {
  Object.keys(GROUPS).forEach(n => { if (n === 'labels' || n === 'cities') return; const v = S0.layers[n] || 'off'; setGroup(n, v); });
  ['hrsBox'].forEach(n => 0);
  syncNet(); govFill = S0.layers.govFill === 'on'; lyGov.setStyle(lyGov.options.style);
  setEuphWeight(S0.layers.euphEmph ? 6 : 3); focusBranch(S0.branchFocus && branchOf(S0.branchFocus) || (S0.layers.reaches === 'on' ? '' : ''));
  const set = (l, on) => { if (on && !map.hasLayer(l)) l.addTo(map); if (!on && map.hasLayer(l)) map.removeLayer(l); };
  set(lyCountries, S0.labels === 'countries'); set(lyRivLab, !!(S0.layers.euph === 'on' && S0.id === 'basin')); set(lyGovLab, S0.layers.gov !== undefined && S0.layers.gov !== 'off'); set(lyBranchLab, !!S0.branchLabels);
  Object.entries(cityMk).forEach(([n, m]) => { const on = (S0.cities || []).includes(n); set(m, on); });
  if (S0.barrage) { if (!barrage) { const e = byId['EX-01']; barrage = L.marker([e.lat, e.lng], { pane: 'cities', interactive: false, icon: L.divIcon({ className: '', html: '<div class="barrage"><i></i><span>Hindiya Barrage</span></div>', iconSize: [0, 0] }) }); } set(barrage, true); } else if (barrage) set(barrage, false);
  // stations
  stationLayer.clearLayers(); linkLayer.clearLayers();
  S.forEach(s => { const on = includeStation(s, S0.stations) || (exploring && false); if (on) { mk[s.id].addTo(stationLayer); const lab = mk[s.id].getTooltip(); } });
  document.body.classList.toggle('nolabels', !S0.stationLabels && !exploring);
  if (S0.links) S.filter(s => s.status === 'existing' && stationLayer.hasLayer(mk[s.id])).forEach(e => { const t = byId[linkTarget(e)]; if (t && stationLayer.hasLayer(mk[t.id])) L.polyline([[e.lat, e.lng], [t.lat, t.lng]], { pane: 'stations', color: PAL.p1, weight: 2.5, dashArray: '5 5', interactive: false }).addTo(linkLayer); });
  modMk.forEach(m => { if (S0.mods === undefined ? (S0.layers.mod === 'on' && S0.id === 'master' ? false : S0.mods) : S0.mods) m.addTo(stationLayer); });
  if (S0.id === 'decision') modMk.forEach(m => m.addTo(stationLayer));
  // card
  techOn = !!S0.tech; if (S0.open) openCard(S0.open); else if (cardId) closeCard();
  // panel (decision scene)
  const pn = S0.panel && D.panels[S0.panel]; $('#panel').classList.toggle('open', !!pn); if (pn) $('#panel').innerHTML = `<h3>${esc(pn.title)}</h3><ul>${pn.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>${pn.foot ? `<div class="foot">${esc(pn.foot)}</div>` : ''}`;
  if (camChanged && S0.camera) fitCamera(S0.camera, instant);
  // text
  const stats = S0.stats || (S0.id === 'gaps' ? [{ v: Math.round(gapStats.total - gapStats.covered) + ' km', l: 'of river beyond ' + RADIUS + ' km of an existing station', c: 'warn' }, { v: Math.round(100 * gapStats.covered / gapStats.total) + ' %', l: 'of river within the indicative radius', c: 'good' }, { v: S.filter(s => s.gapSite).length + ' of 14', l: 'proposed sites with no existing station nearby' }] : []);
  $('#sceneNo').textContent = (si + 1) + ' / ' + SC.length; $('#sceneTitle').textContent = S0.title; $('#sceneLine').textContent = S0.line || '';
  $('#sceneStats').innerHTML = stats.map(x => `<div class="stat ${x.c || ''}"><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join('');
  $('#notesTitle').textContent = SC[si].title; $('#notesBody').textContent = SC[si].notes; $('#notesAction').textContent = SC[si].action;
  legend(S0);
  $('#dots').querySelectorAll('button').forEach((b, i) => { b.classList.toggle('on', i === si); b.classList.toggle('done', i < si); });
  $('#prev').disabled = si === 0 && st === 0; $('#next').disabled = si === SC.length - 1 && st >= stepsOf(si) - 1;
  $('#stepDots').innerHTML = stepsOf(si) > 1 ? Array.from({ length: stepsOf(si) }, (_, k) => `<i class="${k === st ? 'on' : ''}"></i>`).join('') : '';
}
function legend(S0) {
  const items = []; Object.entries(S0.layers).forEach(([n, v]) => { if (v === 'on' && LEG[n]) items.push(LEG[n]); });
  const sw = (t, c, w) => t === 'line' ? `<i class="ln" style="border-top:${Math.max(2, w)}px solid ${c}"></i>` : t === 'dash' ? `<i class="ln" style="border-top:2px dashed ${c}"></i>` : `<i class="bx" style="background:${c}"></i>`;
  const stn = S0.stations && S0.stations !== 'none' ? [`<div class="lg"><i class="dm" style="background:${PAL.navy}"></i>Existing station</div>`].concat(S0.stations.priority || S0.stations.gapSites ? [1, 2, 3].filter(p => !S0.stations.priority || S0.stations.priority.includes(p) || S0.stations.gapSites).map(p => `<div class="lg"><i class="dm ho" style="border-color:${PCOL[p]}"></i>Proposed, ${PLAB[p]}</div>`) : []) : [];
  const mods = (S0.mods || S0.id === 'decision') ? [`<div class="lg"><i class="sqr" style="border-color:${PAL.mod}"></i>Proposed MOD station</div>`] : [];
  const l = items.map(([t, c, w, lab]) => `<div class="lg">${sw(t, c, w)}${esc(lab)}</div>`).concat(stn, mods); $('#legend').innerHTML = l.length ? l.join('') : ''; $('#legend').style.display = l.length ? '' : 'none';
}
const stepsOf = (i) => (SC[i].steps ? SC[i].steps.length : 1);
function go(i, j, opts) { const sceneChanged = i !== si || first; si = Math.max(0, Math.min(SC.length - 1, i)); st = Math.max(0, Math.min(stepsOf(si) - 1, j || 0)); if (exploring) setExplore(false, true); const S0 = stateOf(si, st); S0.id = SC[si].id; applyState(S0, sceneChanged || (SC[si].steps && SC[si].steps[st] && SC[si].steps[st].camera) || (opts && opts.forceCam), first); first = false; writeHash(); }
const next = () => { if (exploring) return; if (st < stepsOf(si) - 1) go(si, st + 1); else if (si < SC.length - 1) go(si + 1, 0); };
const prev = () => { if (exploring) return; if (st > 0) go(si, st - 1, { forceCam: true }); else if (si > 0) go(si - 1, stepsOf(si - 1) - 1); };
function writeHash() { const h = `#s=${si + 1}${st ? '&p=' + st : ''}`; if (location.hash !== h) history.replaceState(null, '', h); }
function readHash() { const m = Object.fromEntries((location.hash.slice(1) || '').split('&').map(x => x.split('='))); return [Math.max(0, (+m.s || 1) - 1), +m.p || 0]; }

/* ---------- explore mode ---------- */
const EXP = [['basin', 'Euphrates and Tigris basins'], ['iraq', 'Iraq'], ['euph', 'Euphrates River'], ['basinRivers', 'Rivers of the basin'], ['lakes', 'Lakes and reservoirs'], ['reaches', 'Hillah River System (branches)'], ['canals', 'Irrigation canals'], ['drains', 'Drainage canals'], ['mod', 'Main Outfall Drain'], ['projects', 'Irrigation projects'], ['gov', 'Governorate boundaries'], ['stations', 'Monitoring stations']];
function setExplore(on, silent) {
  exploring = on; document.body.classList.toggle('explore', on); $('#exploreBtn').classList.toggle('on', on);
  if (on) {
    closeCard(); $('#panel').classList.remove('open'); const cur = stateOf(si, st);
    $('#layers').innerHTML = `<h3>Map layers</h3>${EXP.map(([k, lab]) => `<label><input type="checkbox" data-k="${k}" ${(k === 'stations' ? true : (cur.layers[k] === 'on' || cur.layers[k] === 'dim')) ? 'checked' : ''}><span>${lab}</span></label>`).join('')}<h3>Basemap</h3><div class="bm"><button data-b="light" class="${curBase === 'light' ? 'on' : ''}">Light grey</button><button data-b="streets" class="${curBase === 'streets' ? 'on' : ''}">Streets</button><button data-b="topo" class="${curBase === 'topo' ? 'on' : ''}">Terrain</button><button data-b="vector" class="${curBase === 'vector' ? 'on' : ''}">Vector only (offline)</button></div><div class="fine">Free exploration. Canals and drains show more detail as you zoom in. Click a station for its card.</div>`;
    S.forEach(s => mk[s.id].addTo(stationLayer)); modMk.forEach(m => m.addTo(stationLayer)); set_exp_labels(true);
    [...Object.keys(GROUPS)].forEach(n => { if (n !== 'labels' && GROUPS[n].state === 'dim') setGroup(n, 'on'); }); syncNet();
  } else if (!silent) go(si, st, { forceCam: true });
}
function set_exp_labels(on) { S.forEach(s => mk[s.id].openTooltip && mk[s.id].getTooltip()); }
$('#layers').addEventListener('change', e => { const k = e.target.dataset.k; if (!k) return; if (k === 'stations') { S.forEach(s => e.target.checked ? mk[s.id].addTo(stationLayer) : stationLayer.removeLayer(mk[s.id])); modMk.forEach(m => e.target.checked ? m.addTo(stationLayer) : stationLayer.removeLayer(m)); return; } setGroup(k, e.target.checked ? 'on' : 'off'); syncNet(); });
$('#layers').addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) { setBase(b.dataset.b); $('#layers').querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', x === b)); } });

/* ---------- UI ---------- */
$('#dots').innerHTML = SC.map((s, i) => `<button type="button" title="${i + 1}. ${esc(s.title)}" aria-label="Scene ${i + 1}: ${esc(s.title)}"><span>${i + 1}</span></button>`).join('');
$('#dots').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; go([...$('#dots').children].indexOf(b), 0, { forceCam: true }); });
$('#next').onclick = next; $('#prev').onclick = prev;
$('#exploreBtn').onclick = () => setExplore(!exploring);
$('#notesBtn').onclick = () => $('#notes').classList.toggle('open');
$('#notesX').onclick = () => $('#notes').classList.remove('open');
$('#srcBtn').onclick = () => $('#sources').classList.toggle('open'); $('#srcX').onclick = () => $('#sources').classList.remove('open');
$('#fsBtn').onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen(); };
$('#sceneHide').onclick = () => document.body.classList.toggle('scene-hidden');
$('#menuBtn').onclick = () => $('#menu').classList.toggle('open');
$('#menu').innerHTML = SC.map((s, i) => `<button type="button" data-i="${i}"><b>${i + 1}</b> ${esc(s.title)}</button>`).join('');
$('#menu').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { go(+b.dataset.i, 0, { forceCam: true }); $('#menu').classList.remove('open'); } });
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return; const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); next(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
  else if (k === 'Home') go(0, 0, { forceCam: true }); else if (k === 'End') go(SC.length - 1, 0, { forceCam: true });
  else if (k === 'n' || k === 'N') $('#notesBtn').click(); else if (k === 'e' || k === 'E') $('#exploreBtn').click(); else if (k === 'f' || k === 'F') $('#fsBtn').click(); else if (k === 'h' || k === 'H') $('#sceneHide').click();
  else if (k === 'Escape') { closeCard(); $('#notes').classList.remove('open'); $('#sources').classList.remove('open'); $('#menu').classList.remove('open'); }
  else if (/^[1-9]$/.test(k)) go(+k - 1, 0, { forceCam: true }); else if (k === '0') go(9, 0, { forceCam: true });
});
map.on('click', () => { if (cardId && !exploring) closeCard(); });
window.addEventListener('hashchange', () => { const [a, b] = readHash(); if (a !== si || b !== st) go(a, b, { forceCam: true }); });
window.addEventListener('resize', () => map.invalidateSize());
map.setView([33, 43], 6); const [h0, h1] = readHash(); map.whenReady(() => { go(h0, h1); setTimeout(() => { map.invalidateSize(); map.fire("moveend"); }, 300); });
window.CWRM_story = { go, next, prev, map, explore: setExplore };
})();
