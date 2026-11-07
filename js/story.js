/* CWRM story web map: Hillah River System monitoring concept.
   Plain Leaflet, no build step. Data: data/*.js (exported read-only from CWRM_Master_v1.gpkg). The story itself is in js/scenes.js. */
(function () {
'use strict';
const D = window.CWRM, SC = D.scenes, $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* colour logic (comment of 2026-11-01): freshwater = blues, drainage water = olive / ochre, stations keep their priority colours. Change here only. */
const PAL = { river: '#0B4F9E', branch: '#1565C0', canal: '#2FA4E7', basinRiver: '#5BA7DC', lake: '#9BCDEB', drain: '#B5651D', mod: '#7A3E0B', pol: '#8E24AA', basin: '#1565C0', tigris: '#7C8FA0',
  proj: '#2E6B1F', gov: '#6B7785', govHi: '#E8710A', navy: '#0B3C5D', p1: '#E8710A', p2: '#2A9D8F', p3: '#7B8794', alert: '#C62828', ok: '#2A9D8F', dead: '#8C8C8C', iraq: '#0B3C5D' };
const PCOL = { 1: PAL.p1, 2: PAL.p2, 3: PAL.p3 }, PLAB = { 1: '1st priority', 2: '2nd priority', 3: '3rd priority' };
const hav = (a, b, c, d) => { const r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const AR = D.AR || { ui: {}, scenes: [], panels: {}, labels: { countries: {}, branches: {}, other: {} } };
let lang = 'en'; try { lang = localStorage.getItem('cwrm_story_lang') || 'en'; } catch (e) {}
{ const m = /(?:^|&)l=(ar|en)/.exec(location.hash.slice(1)); if (m) lang = m[1]; }
const t = (s) => (lang === 'ar' && AR.ui[s]) || s;
const dual = (en, ar) => `<span class="en">${esc(en)}</span><span class="ar">${esc(ar || en)}</span>`;
const lbl = (g, k) => dual(k, (AR.labels[g] || {})[k]);
const na = () => '<span class="na">' + t('Not available yet') + '</span>';
document.body.classList.toggle('lang-ar', lang === 'ar');

/* ---------- map and panes ---------- */
const map = L.map('map', { zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, attributionControl: true, minZoom: 4, maxZoom: 16, preferCanvas: true });
L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(map);
const Z = { basin: 300, iraq: 310, gov: 320, lakes: 330, basinRivers: 340, euph: 360, projects: 370, canals: 380, drains: 390, mod: 395, reaches: 400, gaps: 410, pollution: 415, hrsBox: 420, cities: 430 };
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
  light: (function () { try { return L.maplibreGL({ style: 'https://tiles.openfreemap.org/styles/positron', attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; OpenMapTiles, data from OpenStreetMap', preserveDrawingBuffer: true }); } catch (e) { return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, errorTileUrl: BLANK, className: 'tiles-soft' }); } })(),
  streets: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, errorTileUrl: BLANK }),
  topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)', maxZoom: 17, errorTileUrl: BLANK }),
  imagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxZoom: 18, errorTileUrl: BLANK })
};
map.createPane('base').style.zIndex = 190;
let curBase = 'light'; VEC.addTo(map); TILES.light.addTo(map); map.attributionControl.addAttribution('Countries: Natural Earth (public domain)');
document.body.classList.add('base-vector');
/* basemap labels in English only: the Positron style prints "English + Arabic" under every place name (the Arabic joins badly in the vector tiles), so the text field is replaced by the English / Latin name */
function latinLabels() { const gl = TILES.light.getMaplibreMap && TILES.light.getMaplibreMap(); if (!gl) return; const fix = () => { gl.getStyle().layers.forEach(l => { const tf = l.type === 'symbol' && l.layout && l.layout['text-field']; if (tf && JSON.stringify(tf).includes('name:nonlatin')) gl.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name_en'], ['get', 'name:latin'], '']); }); }; gl.isStyleLoaded() ? fix() : gl.once('load', fix); }
latinLabels(); TILES.light.on && TILES.light.on('add', () => setTimeout(latinLabels, 0));
const setBase = (b) => { if (TILES[curBase]) map.removeLayer(TILES[curBase]); curBase = b; if (TILES[b]) TILES[b].addTo(map); };
document.body.classList.add('base-vector');

/* ---------- layers ---------- */
const add = (layer, grp) => { layer.addTo(map); return layer; };
const tip = (html) => (f, l) => l.bindTooltip(html(f.properties), { sticky: true });
// basin
const lyBasin = L.geoJSON(D.basin, { pane: 'basin', renderer: cv('basin'), style: f => f.properties.name === 'Euphrates basin' ? { color: PAL.basin, weight: 2, fillColor: PAL.basin, fillOpacity: 0.13 } : { color: PAL.tigris, weight: 1.2, dashArray: '5 4', fillColor: PAL.tigris, fillOpacity: 0.1 }, onEachFeature: tip(p => `<b>${esc(t(p.name))}</b><br>about ${Math.round(p.km / 1000) * 1000 > 0 ? (Math.round(p.km / 1000) * 1000).toLocaleString() : ''} km² (HydroBASINS level 6)`) }).addTo(map);
const lyIraq = L.geoJSON(D.iraq, { pane: 'iraq', renderer: cv('iraq'), interactive: false, style: { color: PAL.iraq, weight: 2.4, fillColor: PAL.iraq, fillOpacity: 0.05 } }).addTo(map);
// governorates (highlight set per scene)
const govKey = (n) => ({ Babylon: 'Babil', Qadisiya: 'Al-Qadisiyah', Muthanna: 'Muthanna', Najaf: 'Najaf', Kerbela: 'Karbala', Baghdad: 'Baghdad', Wasit: 'Wasit', 'Thi-Qar': 'Thi-Qar', Anbar: 'Anbar' }[n] || n);
const GOVHI = ['Babylon', 'Qadisiya', 'Muthanna'];
let govFill = false;
const lyGov = L.geoJSON(D.governorates, { pane: 'gov', renderer: cv('gov'), interactive: false, style: f => ({ color: PAL.gov, weight: 1.2, dashArray: '8 4 2 4', fillColor: PAL.govHi, fillOpacity: govFill && GOVHI.includes(f.properties.en) ? 0.12 : 0 }) }).addTo(map);
function center(g) { const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map(p => p[0]); let best = null, ba = -1; rings.forEach(r => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; r.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); const a = (x1 - x0) * (y1 - y0); if (a > ba) { ba = a; best = [(y0 + y1) / 2, (x0 + x1) / 2]; } }); return best; }
const lyGovLab = L.layerGroup();
D.governorates.features.forEach(f => { if (!['Babylon', 'Qadisiya', 'Muthanna', 'Najaf', 'Kerbela', 'Wasit', 'Baghdad'].includes(f.properties.en)) return; const c = center(f.geometry); if (c) L.marker(c, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab gov ${GOVHI.includes(f.properties.en) ? 'hi' : ''}">${dual(govKey(f.properties.en), f.properties.ar)}</div>` }) }).addTo(lyGovLab); });
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
function addNet(fc, grp, minZoom, style, pop) { if (!fc.features.length) return; net.push({ grp, minZoom, layer: L.geoJSON(fc, { pane: grp, renderer: cv(grp, 0.5), style: () => style, onEachFeature: (f, l) => { if (!pop) return; l.bindTooltip(pop(f.properties), { sticky: true }); l.on('click', (e) => { if (exploring) { L.DomEvent.stopPropagation(e); L.popup().setLatLng(e.latlng).setContent(pop(f.properties)).openOn(map); } }); } }) }); }
const cPop = (p) => `<b>${esc(p.n || 'Irrigation canal')}</b><br>${p.l != null ? (+p.l).toFixed(1) : '-'} km &middot; ${esc(p.s || 'not surveyed')}`, dPop = (p) => `<b>${esc(p.n || 'Drain')}</b>${p.m && !/Outfall/i.test(p.n || '') ? ' (Main Outfall Drain)' : ''}<br>${p.l != null ? (+p.l).toFixed(1) : '-'} km &middot; ${esc(p.s || 'not surveyed')}`;
[[c => c <= 1, 3, 7], [c => c === 2, 2, 8], [c => c === 3, 1.4, 9], [c => c >= 4, 1, 10]].forEach(([t, w, z]) => addNet(feats(D.canals, f => !dead(f.properties.s) && t(cls(f.properties.c))), 'canals', z, { color: PAL.canal, weight: w, opacity: 0.95 }, cPop));
[[f => f.properties.j && !f.properties.m, 3.6, 7], [f => !f.properties.j && !f.properties.m && cls(f.properties.c) <= 2, 2.4, 8], [f => !f.properties.j && !f.properties.m && cls(f.properties.c) === 3, 1.5, 9], [f => !f.properties.j && !f.properties.m && cls(f.properties.c) >= 4, 1, 10]].forEach(([t, w, z]) => addNet(feats(D.drains, f => !dead(f.properties.s) && t(f)), 'drains', z, { color: PAL.drain, weight: w, opacity: 0.95 }, dPop));
addNet(feats(D.drains, f => f.properties.m), 'mod', 0, { color: PAL.mod, weight: 5, opacity: 1, lineCap: 'round' }, dPop);
addNet(D.modUp, 'mod', 0, { color: PAL.mod, weight: 4.4, opacity: 1, lineCap: 'round' }, () => '<b>Main Outfall Drain</b> (' + t('upstream part, from OpenStreetMap') + ')');
function syncNet() { const z = map.getZoom(); net.forEach(n => { const want = GROUPS[n.grp].state !== 'off' && z >= n.minZoom; if (want && !map.hasLayer(n.layer)) n.layer.addTo(map); if (!want && map.hasLayer(n.layer)) map.removeLayer(n.layer); }); }
map.on('zoomend', syncNet);
const lyProj = L.geoJSON(D.projects, { pane: 'projects', renderer: cv('projects'), style: f => ({ color: PAL.proj, weight: 2, dashArray: f.properties.status === 'Partially Developed' ? null : '7 5', fillColor: PAL.proj, fillOpacity: 0.05 }), onEachFeature: (f, l) => l.bindTooltip(`<b>${esc(f.properties.name)}</b> (${esc(f.properties.code)})<br>${esc(f.properties.status)} &middot; ${Math.round(f.properties.ha).toLocaleString()} ha`, { sticky: true }) }).addTo(map);
// reported pollution sources (Ministry tables; sensitive fields left out in data/pollution.js)
const POL = D.pollution || { features: [] }, PI = D.pollutionInfo || { total: 0, located: 0, unlocated: 0 }, polMk = {};
const lyPol = L.geoJSON(POL, { pane: 'pollution', pointToLayer: (f, ll) => L.circleMarker(ll, { pane: 'pollution', renderer: cv('pollution'), radius: 6.5, color: '#fff', weight: 1.8, fillColor: PAL.pol, fillOpacity: 1, bubblingMouseEvents: false }),
  onEachFeature: (f, l) => { polMk[f.properties.id] = l; l.bindTooltip(() => `<b>${esc(t(f.properties.cat))}</b><br>${esc(t(f.properties.dir))}`, { sticky: true }); l.on('click', () => openPol(f.properties.id)); } }).addTo(map);
// Hillah River System box
const lyBox = L.layerGroup([L.rectangle([[31.35, 44.15], [32.85, 45.7]], { pane: 'hrsBox', renderer: cv('hrsBox'), color: PAL.p1, weight: 3, dashArray: '10 6', fillColor: PAL.p1, fillOpacity: 0.12, interactive: false })]).addTo(map);
L.marker([32.95, 44.9], { pane: 'hrsBox', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab hrs">${lbl('other', 'Hillah River System')}</div>` }) }).addTo(lyBox);

/* ---------- labels ---------- */
const lyCountries = L.layerGroup();
[['Türkiye', 38.6, 36.0], ['Syria', 35.0, 38.8], ['Iraq', 33.0, 43.4], ['Iran', 32.4, 53.2], ['Saudi Arabia', 26.5, 43.5], ['Jordan', 31.1, 37.0], ['Kuwait', 29.3, 47.6]].forEach(([n, lat, lng]) => L.marker([lat, lng], { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab country">${lbl('countries', n)}</div>` }) }).addTo(lyCountries));
const lyRivLab = L.layerGroup();
(function () {
  const mid = (fc, pick) => { const f = fc.features.filter(pick)[0]; if (!f) return null; let c = f.geometry.coordinates; while (Array.isArray(c[0][0])) c = c[Math.floor(c.length / 2)]; const p = c[Math.floor(c.length / 2)]; return [p[1], p[0]]; };
  const e = mid(D.euphUp, () => true); const t = mid(D.basinRivers, f => f.properties.system === 'Tigris' && f.properties.rank === 1);
  if (e) L.marker(e, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab river">${lbl('other', 'Euphrates')}</div>` }) }).addTo(lyRivLab);
  if (t) L.marker(t, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab river tig">${lbl('other', 'Tigris')}</div>` }) }).addTo(lyRivLab);
  const ee = mid(D.euphrates, () => true); if (ee) L.marker(ee, { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab river">${lbl('other', 'Euphrates')}</div>` }) }).addTo(lyRivLab);
  L.marker([34.3, 41.0], { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab basinlab">${lbl('other', 'Euphrates basin')}</div>` }) }).addTo(lyRivLab);
})();
const lyBranchLab = L.layerGroup();
(function () { const best = {}; D.reaches.features.forEach(f => { const b = branchOf(f.properties.branch); const g = f.geometry; const ln = g.type === 'MultiLineString' ? g.coordinates[0] : g.coordinates; const fr = { Hillah: 0.5, Daghara: 0.8, Diwaniyah: 0.3 }[b] || 0.5, p = ln[Math.floor(ln.length * fr)]; if (!best[b] || f.properties.km > best[b].km) best[b] = { km: f.properties.km, p }; });
  const T = { Hillah: 'Hillah main channel', Daghara: 'Daghara branch', Diwaniyah: 'Diwaniyah / Rumaytha branch' }; Object.entries(best).forEach(([b, o]) => L.marker([o.p[1], o.p[0]], { pane: 'labels', interactive: false, icon: L.divIcon({ className: '', html: `<div class="lab branch" data-b="${b}">${dual(T[b], AR.labels.branches[b])}</div>` }) }).addTo(lyBranchLab)); })();
const cityMk = {};
D.cities.features.forEach(f => { const n = f.properties.name; cityMk[n] = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { pane: 'cities', icon: L.divIcon({ className: '', html: `<div class="city"><i></i><span>${dual(n, f.properties.ar)}</span></div>`, iconSize: [0, 0] }), keyboard: false, title: n }); cityMk[n].bindTooltip(`${esc(n)} ${f.properties.ar ? '&middot; <span dir="rtl">' + esc(f.properties.ar) + '</span>' : ''}`, { direction: 'top', offset: [0, -4] }); });
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
const modMk = D.modStations.features.map((f, i) => { const p = f.properties; const m = L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]], { pane: 'stations', title: p.id + ' ' + p.name, icon: L.divIcon({ className: 'mk-wrap', iconSize: [24, 24], iconAnchor: [12, 12], html: `<div class="mk mod"><svg viewBox="-13 -13 26 26" width="24" height="24"><rect x="-8.5" y="-8.5" width="17" height="17" rx="2" fill="#fff" stroke="${PAL.mod}" stroke-width="3.2"/></svg></div>` }) }); m.bindTooltip(`<b>${esc(p.id)}</b> ${esc(p.short)}`, { permanent: true, direction: 'right', offset: [11, 0], className: 'stn-label mod' }); m.on('click', () => openMod(i)); m._p = p; return m; });
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
const tt = (x) => t(x);
const capT = (c) => lang === 'ar' ? String(c).replace(/^(Planned location - photo|Existing station - photo)/, (m) => AR.ui[m] || m) : c;
let curCard = null;
function renderCard(s) {
  curCard = s;
  const ex = s.status === 'existing', ph = s.photos || [], col = colorOf(s);
  const row = (k, v) => `<div class="r"><dt>${k}</dt><dd>${v || na()}</dd></div>`;
  const dms = (v, p, n) => { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), sec = ((a - d - m / 60) * 3600).toFixed(1); return `${d}°${m}'${sec}"${v >= 0 ? p : n}`; };
  $('#card').innerHTML = `<div class="chead"><span class="badge" style="background:${col}"></span><div><h3>${esc(s.id)} &middot; ${esc(s.name)}</h3><span class="sub">${ex ? t('Existing station') : t('Proposed') + ' &middot; ' + t(PLAB[s.priority])}${s.attention ? ' &middot; <b class="warn">' + t('needs attention') + '</b>' : ''}</span></div><button class="x" id="cardX" type="button" aria-label="Close">&times;</button></div>
  ${ph.length ? `<div class="photo"><img id="cardImg" src="${esc(ph[0].src)}" alt="${esc(capT(ph[0].caption))}">${ph.length > 1 ? '<button class="pn l" id="phPrev" type="button">&#10094;</button><button class="pn r" id="phNext" type="button">&#10095;</button>' : ''}<span class="cap" id="cardCap">${esc(capT(ph[0].caption))}${ph.length > 1 ? ' (1/' + ph.length + ')' : ''}</span></div>` : ''}
  ${techOn && !ex ? `<h4 class="th">${t('Technologies that could be installed here')}</h4><div class="tech">${TECH.map(t => `<figure><img src="img/${t[0]}" alt="${esc(tt(t[1]))}"><figcaption><b>${esc(tt(t[1]))}</b>${esc(tt(t[2]))}</figcaption></figure>`).join('')}</div><div class="fine">${t('Illustrative images; source and licence to be confirmed.')}</div>` : ''}
  <dl>${ex ? row(t('Condition'), esc(s.statusText)) + row(t('Basis'), esc(s.attentionBasis)) + row(t('Parameters measured now'), esc(s.parametersCurrent)) + row(t('Telemetry'), esc(s.telemetry)) : row(t('Purpose of the site'), esc(s.role)) + row(t('Branch'), esc(s.branch) + (s.riverKm != null ? ' &middot; ' + t('chainage') + ' ' + s.riverKm + ' ' + t('km') : '')) + row(t('Parameters'), esc(s.parametersProposed)) + row(t('Telemetry'), esc(s.telemetry))}
  ${row(t('Coordinates'), `<span dir="ltr">${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}<br><span class="dms">${dms(s.lat, 'N', 'S')} ${dms(s.lng, 'E', 'W')}</span></span>`)}${linkTarget(s) ? row(t('Linked site'), `<a href="#" data-go="${esc(linkTarget(s))}">${esc(linkTarget(s))}</a>`) : ''}</dl>${lang === 'ar' ? '<div class="fine">' + t('Station details are in English, as in the design document.') + '</div>' : ''}`;
  $('#card').classList.toggle('tech-on', techOn && !ex);
  $('#cardX').onclick = closeCard;
  const upd = (d) => { photoIx = (photoIx + d + ph.length) % ph.length; $('#cardImg').src = ph[photoIx].src; $('#cardCap').textContent = capT(ph[photoIx].caption) + ' (' + (photoIx + 1) + '/' + ph.length + ')'; };
  $('#phPrev') && ($('#phPrev').onclick = () => upd(-1)); $('#phNext') && ($('#phNext').onclick = () => upd(1));
  $('#card').querySelectorAll('[data-go]').forEach(a => a.onclick = (e) => { e.preventDefault(); if (mk[a.dataset.go] && !map.hasLayer(mk[a.dataset.go])) mk[a.dataset.go].addTo(stationLayer); openCard(a.dataset.go, true); });
}
function openMod(i) { const m = modMk[i], p = m._p, ll = m.getLatLng(); cardId = 'MOD' + i; curCard = { mod: i };
  $('#card').innerHTML = `<div class="chead"><span class="badge sq" style="border-color:${PAL.mod}"></span><div><h3>${esc(p.id)} &middot; ${esc(p.name)}</h3><span class="sub">${t('Proposed monitoring point on the Main Outfall Drain')}</span></div><button class="x" id="cardX" type="button" aria-label="Close">&times;</button></div>
  ${p.photo ? `<div class="photo"><img src="${esc(p.photo)}" alt="${esc(p.name)}"><span class="cap">${t('Site photograph from the MOD stations table')}</span></div>` : ''}
  <dl><div class="r"><dt>${t('Monitoring type')}</dt><dd>${t(p.type)}</dd></div><div class="r"><dt>${t('Role')}</dt><dd>${t('One of four proposed stations along the Main Outfall Drain (the Third River): drainage water quality, salinity and pollution sources.')}</dd></div><div class="r"><dt>${t('Coordinates')}</dt><dd dir="ltr">${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}</dd></div><div class="r"><dt>${t('Priority and parameters')}</dt><dd>${na()}</dd></div></dl><div class="fine">${t('Locations and photographs from the MOD monitoring-stations table (received 2026-11-02); priority and parameters are to be confirmed.')}</div>`;
  $('#cardX').onclick = closeCard; $('#card').classList.remove('tech-on'); $('#card').classList.add('open'); document.body.classList.add('card-open'); }

const POLQ = { ok: 'Location as given in the source table', corrected: 'Location corrected by the project (an error in the source coordinates); approximate', estimated: 'Location estimated from the description; approximate' };
function openPol(id) { const l = polMk[id]; if (!l) return; const p = l.feature.properties, ll = l.getLatLng(); cardId = 'POL' + id; curCard = { pol: id };
  const row = (k, v, rtl) => v ? `<div class="r"><dt>${t(k)}</dt><dd${rtl ? ' dir="rtl" class="arv"' : ''}>${rtl ? esc(v) : v}</dd></div>` : '';
  $('#card').innerHTML = `<div class="chead"><span class="badge dot" style="background:${PAL.pol}"></span><div><h3>${esc(t(p.cat))}</h3><span class="sub">${t('Reported pollution source')} &middot; ${esc(t(p.dir))}</span></div><button class="x" id="cardX" type="button" aria-label="Close">&times;</button></div>
  <dl>${row('Outlet (as recorded, Arabic)', p.ar, 1)}${row('Receiving water (as recorded, Arabic)', p.w, 1)}${row('Type (as recorded, Arabic)', p.tp, 1)}${row('Location', t(POLQ[p.q] || POLQ.ok))}<div class="r"><dt>${t('Coordinates')}</dt><dd dir="ltr">${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}</dd></div></dl>
  <div class="fine">${t('From the Ministry of Water Resources pollution-source tables (Diwaniyah, Babylon, Muthanna). Descriptions stay in Arabic as recorded. Discharge values, responsible parties and follow-up actions are not shown.')}</div>`;
  $('#cardX').onclick = closeCard; $('#card').classList.remove('tech-on'); $('#card').classList.add('open'); document.body.classList.add('card-open'); }

/* ---------- scene engine ---------- */
let si = 0, st = 0, exploring = false, first = true;
const LEG = { euph: ['line', PAL.river, 4, 'Euphrates River (freshwater)'], reaches: ['line', PAL.branch, 4, 'Hillah River System (branches)'], canals: ['line', PAL.canal, 2, 'Irrigation canals (freshwater)'], drains: ['line', PAL.drain, 2, 'Drainage canals (drainage water)'], mod: ['line', PAL.mod, 5, 'Main Outfall Drain (MOD)'], projects: ['dash', PAL.proj, 2, 'Irrigation projects'], basinRivers: ['line', PAL.basinRiver, 1.5, 'Rivers of the basin'], lakes: ['box', PAL.lake, 0, 'Lakes and reservoirs'], basin: ['box', 'rgba(21,101,192,.25)', 0, 'Euphrates basin'], iraq: ['dash', PAL.iraq, 2, 'Iraq'], hrsBox: ['dash', PAL.p1, 2, 'Hillah River System'], gaps: ['line', PAL.ok, 5, 'River within 25 km of an existing station'], pollution: ['dot', PAL.pol, 0, 'Reported pollution sources'] };
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
  if (S0.barrage) { if (!barrage) { const e = byId['EX-01']; barrage = L.marker([e.lat, e.lng], { pane: 'cities', interactive: false, icon: L.divIcon({ className: '', html: `<div class="barrage"><i></i><span>${lbl('other', 'Hindiya Barrage')}</span></div>`, iconSize: [0, 0] }) }); } set(barrage, true); } else if (barrage) set(barrage, false);
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
  const pn = S0.panel && ((lang === 'ar' && AR.panels[S0.panel]) || D.panels[S0.panel]); $('#panel').classList.toggle('open', !!pn); if (pn) $('#panel').innerHTML = `<h3>${esc(pn.title)}</h3><ul>${pn.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>${pn.foot ? `<div class="foot">${esc(pn.foot)}</div>` : ''}`;
  if (camChanged && S0.camera) fitCamera(S0.camera, instant);
  // text
  let stats = S0.stats || (S0.id === 'gaps' ? [{ v: Math.round(gapStats.total - gapStats.covered) + ' km', l: 'of river beyond ' + RADIUS + ' km of an existing station', c: 'warn' }, { v: Math.round(100 * gapStats.covered / gapStats.total) + ' %', l: 'of river within the indicative radius', c: 'good' }, { v: S.filter(s => s.gapSite).length + ' of 14', l: 'proposed sites with no existing station nearby' }] : []);
  const A = lang === 'ar' ? AR.scenes[si] : null, AS = (A && A.steps && A.steps[st]) || {};
  let title = S0.title, line = S0.line || '', notes = SC[si].notes, action = SC[si].action;
  if (A) {
    title = A.title; line = AS.line || A.line || ''; notes = A.notes || notes; action = A.action || action;
    if (S0.id === 'gaps') stats = [{ v: Math.round(gapStats.total - gapStats.covered) + ' ' + t('km'), l: t('of river beyond 25 km of an existing station'), c: 'warn' }, { v: Math.round(100 * gapStats.covered / gapStats.total) + ' %', l: t('of river within the indicative radius'), c: 'good' }, { v: S.filter(s => s.gapSite).length + ' ' + t('of') + ' 14', l: t('proposed sites with no existing station nearby') }];
    else { const as = AS.stats || A.stats; if (as && S0.stats) stats = as.map((x, k) => Object.assign({}, S0.stats[k] || {}, x)); }
  }
  $('#sceneNo').textContent = (si + 1) + ' / ' + SC.length; $('#sceneTitle').textContent = title; $('#sceneLine').textContent = line;
  $('#sceneStats').innerHTML = stats.map(x => `<div class="stat ${x.c || ''}"><b>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join('');
  $('#notesTitle').textContent = title; $('#notesBody').textContent = notes; $('#notesAction').textContent = action;
  legend(S0);
  $('#dots').querySelectorAll('button').forEach((b, i) => { b.classList.toggle('on', i === si); b.classList.toggle('done', i < si); });
  $('#prev').disabled = si === 0 && st === 0; $('#next').disabled = si === SC.length - 1 && st >= stepsOf(si) - 1;
  $('#stepDots').innerHTML = stepsOf(si) > 1 ? Array.from({ length: stepsOf(si) }, (_, k) => `<i class="${k === st ? 'on' : ''}"></i>`).join('') : '';
}
function legend(S0) {
  const items = []; Object.entries(S0.layers).forEach(([n, v]) => { if (v === 'on' && LEG[n]) items.push(LEG[n]); });
  const sw = (t, c, w) => t === 'line' ? `<i class="ln" style="border-top:${Math.max(2, w)}px solid ${c}"></i>` : t === 'dash' ? `<i class="ln" style="border-top:2px dashed ${c}"></i>` : t === 'dot' ? `<i class="dt" style="background:${c}"></i>` : `<i class="bx" style="background:${c}"></i>`;
  const stn = S0.stations && S0.stations !== 'none' ? (S0.noExisting ? [] : [`<div class="lg"><i class="dm" style="background:${PAL.navy}"></i>${t('Existing station')}</div>`]).concat(S0.stations.priority || S0.stations.gapSites ? [1, 2, 3].filter(p => !S0.stations.priority || S0.stations.priority.includes(p) || S0.stations.gapSites).map(p => `<div class="lg"><i class="dm ho" style="border-color:${PCOL[p]}"></i>${t('Proposed')}${lang === 'ar' ? '، ' : ', '}${t(PLAB[p])}</div>`) : []) : [];
  const mods = (S0.mods || S0.id === 'decision') ? [`<div class="lg"><i class="sqr" style="border-color:${PAL.mod}"></i>${t('Proposed MOD station')}</div>`] : [];
  const l = items.map(([ty, c, w, lab]) => `<div class="lg">${sw(ty, c, w)}${esc(t(lab))}</div>`).concat(stn, mods); $('#legend').innerHTML = l.length ? l.join('') : ''; $('#legend').style.display = l.length ? '' : 'none';
}
const stepsOf = (i) => (SC[i].steps ? SC[i].steps.length : 1);
function go(i, j, opts) { const sceneChanged = i !== si || first; si = Math.max(0, Math.min(SC.length - 1, i)); st = Math.max(0, Math.min(stepsOf(si) - 1, j || 0)); if (exploring) setExplore(false, true); const S0 = stateOf(si, st); S0.id = SC[si].id; applyState(S0, sceneChanged || (SC[si].steps && SC[si].steps[st] && SC[si].steps[st].camera) || (opts && opts.forceCam), first); first = false; writeHash(); }
const next = () => { if (exploring) return; if (st < stepsOf(si) - 1) go(si, st + 1); else if (si < SC.length - 1) go(si + 1, 0); };
const prev = () => { if (exploring) return; if (st > 0) go(si, st - 1, { forceCam: true }); else if (si > 0) go(si - 1, stepsOf(si - 1) - 1); };
function writeHash() { const h = `#s=${si + 1}${st ? '&p=' + st : ''}${lang === 'ar' ? '&l=ar' : ''}`; if (location.hash !== h) history.replaceState(null, '', h); }
function readHash() { const m = Object.fromEntries((location.hash.slice(1) || '').split('&').map(x => x.split('='))); return [Math.max(0, (+m.s || 1) - 1), +m.p || 0]; }

/* ---------- explore mode (Q&A): topics, station search, filters, layers, basemap, link to the full interactive map ---------- */
const EXP = [['basin', 'Euphrates and Tigris basins'], ['iraq', 'Iraq'], ['euph', 'Euphrates River'], ['basinRivers', 'Rivers of the basin'], ['lakes', 'Lakes and reservoirs'], ['reaches', 'Hillah River System (branches)'], ['canals', 'Irrigation canals'], ['drains', 'Drainage canals'], ['mod', 'Main Outfall Drain'], ['projects', 'Irrigation projects'], ['pollution', 'Reported pollution sources'], ['gaps', 'River within 25 km of an existing station'], ['gov', 'Governorate boundaries'], ['stations', 'Monitoring stations']];
const CHIPS = [['existing', 'Existing'], ['p1', '1st priority'], ['p2', '2nd priority'], ['p3', '3rd priority'], ['mod', 'MOD stations']];
const EX = { chips: new Set(CHIPS.map(c => c[0])), stationsOn: true, branchKey: null, gapOnly: false, topic: null, q: '', open: { topics: true, find: false, show: false, layers: true, base: false } };
const exVisible = (s) => EX.stationsOn && (s.status === 'existing' ? EX.chips.has('existing') : EX.chips.has('p' + s.priority)) && (!EX.branchKey || s.branchKey === EX.branchKey) && (!EX.gapOnly || s.status === 'existing' || s.gapSite);
function refreshStations() {
  stationLayer.clearLayers(); linkLayer.clearLayers();
  S.forEach(s => { if (exVisible(s)) mk[s.id].addTo(stationLayer); });
  modMk.forEach(m => { if (EX.stationsOn && EX.chips.has('mod')) m.addTo(stationLayer); });
}
function resetExplore() { EX.chips = new Set(CHIPS.map(c => c[0])); EX.stationsOn = true; EX.branchKey = null; EX.gapOnly = false; EX.topic = null; EX.q = ''; focusBranch(''); }
const IS_FILE = location.protocol === 'file:', FULL_URL = IS_FILE ? 'interactive/index.html' : 'https://faisalalyaseein.github.io/hillah-monitoring-network/';
function openFull() { const c = map.getCenter(), s = cardId && byId[cardId] ? '&s=' + cardId : ''; window.open(FULL_URL + '#c=' + c.lat.toFixed(4) + ',' + c.lng.toFixed(4) + ',' + map.getZoom() + s + '&from=' + (si + 1) + '_' + st, '_blank'); }
function renderExplore() {
  const sec = (k, title, body) => `<details data-sec="${k}" ${EX.open[k] ? 'open' : ''}><summary>${t(title)}</summary>${body}</details>`;
  const topics = (D.topics || []).map(tp => `<button type="button" class="tp ${EX.topic === tp.id ? 'on' : ''}" data-tp="${tp.id}">${esc(t(tp.title))}</button>`).join('');
  const chips = CHIPS.map(([k, l]) => `<button type="button" class="chip ${EX.chips.has(k) ? 'on' : ''}" data-chip="${k}">${t(l)}</button>`).join('');
  const topicNote = (EX.branchKey || EX.gapOnly) ? `<div class="fine">${t('Topic filter on')} &middot; <a href="#" data-clr="1">${t('Show all stations')}</a></div>` : '';
  const layers = EXP.map(([k, lab]) => `<label><input type="checkbox" data-k="${k}" ${(k === 'stations' ? EX.stationsOn : GROUPS[k].state !== 'off') ? 'checked' : ''}><span>${t(lab)}</span></label>`).join('');
  const bmb = (b, lab) => `<button data-b="${b}" class="${curBase === b ? 'on' : ''}">${t(lab)}</button>`;
  $('#layers').innerHTML = `<div class="exhead"><b>${t('Explore')}</b><button type="button" id="exBack">${t('Back to story')}</button></div>`
    + sec('topics', 'Q&A topics', `<div class="tps">${topics}</div>`)
    + sec('find', 'Find a station', `<input id="exQ" type="search" placeholder="${esc(t('Station ID or name'))}" value="${esc(EX.q)}" autocomplete="off"><div id="exRes"></div>`)
    + sec('show', 'Stations shown', `<div class="chips">${chips}</div>${topicNote}`)
    + sec('layers', 'Map layers', layers)
    + sec('base', 'Basemap', `<div class="bm">${bmb('light', 'Light grey')}${bmb('streets', 'Streets')}${bmb('topo', 'Terrain')}${bmb('imagery', 'Imagery')}${bmb('vector', 'Vector only (offline)')}</div><div class="fine">${t('Imagery, streets and terrain need internet.')}</div>`)
    + `<div class="exact"><button type="button" id="exFull">${t('Open full interactive map')}</button><button type="button" id="exPrint">${t('Print / save as PDF')}</button></div><div class="fine">${t('Free exploration. Canals and drains show more detail as you zoom in. Click a station, a canal or a drain for its details.')}</div>`;
  fillResults();
}
function fillResults() {
  const q = EX.q.trim().toLowerCase(), box = $('#exRes'); if (!box) return;
  if (!q) { box.innerHTML = `<div class="fine">${t('Type an ID (for example H-01) or part of a name.')}</div>`; return; }
  const all = S.map(s => ({ id: s.id, name: s.name, sub: s.status === 'existing' ? t('Existing station') : t(PLAB[s.priority]), kind: 's' })).concat(modMk.map((m, i) => ({ id: m._p.id, name: m._p.short || m._p.name, sub: t('Proposed MOD station'), kind: 'm', i })));
  const res = all.filter(x => (x.id + ' ' + x.name).toLowerCase().includes(q)).slice(0, 8);
  box.innerHTML = res.length ? res.map(x => `<button type="button" class="res" data-st="${esc(x.id)}" data-kind="${x.kind}" data-i="${x.i == null ? '' : x.i}"><b>${esc(x.id)}</b> ${esc(x.name)}<small>${esc(x.sub)}</small></button>`).join('') : `<div class="fine">${t('No match')}</div>`;
}
function pickStation(id, kind, i) {
  if (kind === 'm') { const m = modMk[+i]; if (!stationLayer.hasLayer(m)) m.addTo(stationLayer); map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 12), { duration: 1.2 }); openMod(+i); }
  else { const s = byId[id]; if (!stationLayer.hasLayer(mk[id])) mk[id].addTo(stationLayer); map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 12), { duration: 1.2 }); openCard(id, false); }
}
function topicBounds(f) {
  if (f.b) return L.latLngBounds(f.b);
  if (f.branch) { let b = null; lyReach.eachLayer(l => { if (branchOf(l.feature.properties.branch) === f.branch) { const lb = l.getBounds(); b = b ? b.extend(lb) : L.latLngBounds(lb.getSouthWest(), lb.getNorthEast()); } }); return b; }
  if (f.mod) return L.latLngBounds(modMk.map(m => m.getLatLng())).pad(0.5);
  if (f.pol) return lyPol.getBounds().pad(0.08);
  return null;
}
function applyTopic(id) {
  const tp = (D.topics || []).find(x => x.id === id); if (!tp) return;
  EX.topic = id; EX.branchKey = tp.branchKey || null; EX.gapOnly = !!tp.gapOnly; EX.stationsOn = true; EX.chips = new Set(tp.chips || []);
  const on = new Set(tp.layers || []); EXP.forEach(([k]) => { if (k !== 'stations') setGroup(k, on.has(k) ? 'on' : 'off'); }); syncNet();
  focusBranch((tp.fit && tp.fit.branch) || ''); closeCard(); refreshStations(); renderExplore();
  const f = tp.fit || {}, b = topicBounds(f);
  if (b) fitCamera({ b }, false); else if (f.st && byId[f.st]) map.flyTo([byId[f.st].lat, byId[f.st].lng], f.z || 11, { duration: 1.6 });
  if (tp.open) setTimeout(() => { if (exploring && EX.topic === id) openCard(tp.open); }, 1700);
}
function setExplore(on, silent) {
  const was = exploring; exploring = on; document.body.classList.toggle('explore', on); $('#exploreBtn').classList.toggle('on', on);
  if (on) {
    if (!was) { closeCard(); $('#panel').classList.remove('open'); resetExplore(); document.body.classList.remove('nolabels'); [...Object.keys(GROUPS)].forEach(n => { if (n !== 'labels' && GROUPS[n].state === 'dim') setGroup(n, 'on'); }); syncNet(); refreshStations(); }
    renderExplore();
  } else { if (was && curBase !== 'light') setBase('light'); if (!silent) go(si, st, { forceCam: true }); }
}
$('#layers').addEventListener('change', e => { const k = e.target.dataset.k; if (!k) return; if (k === 'stations') { EX.stationsOn = e.target.checked; refreshStations(); return; } setGroup(k, e.target.checked ? 'on' : 'off'); syncNet(); });
$('#layers').addEventListener('input', e => { if (e.target.id === 'exQ') { EX.q = e.target.value; fillResults(); } });
$('#layers').addEventListener('toggle', e => { const k = e.target.dataset && e.target.dataset.sec; if (k) EX.open[k] = e.target.open; }, true);
$('#layers').addEventListener('click', e => {
  const x = e.target; let b;
  if ((b = x.closest('[data-b]'))) { setBase(b.dataset.b); $('#layers').querySelectorAll('[data-b]').forEach(y => y.classList.toggle('on', y === b)); }
  else if ((b = x.closest('[data-tp]'))) applyTopic(b.dataset.tp);
  else if ((b = x.closest('[data-chip]'))) { const k = b.dataset.chip; EX.chips.has(k) ? EX.chips.delete(k) : EX.chips.add(k); EX.topic = null; refreshStations(); renderExplore(); }
  else if ((b = x.closest('[data-clr]'))) { e.preventDefault(); EX.branchKey = null; EX.gapOnly = false; EX.topic = null; focusBranch(''); refreshStations(); renderExplore(); }
  else if ((b = x.closest('[data-st]'))) pickStation(b.dataset.st, b.dataset.kind, b.dataset.i);
  else if (x.closest('#exBack')) setExplore(false);
  else if (x.closest('#exFull')) openFull();
  else if (x.closest('#exPrint')) window.print();
});
window.addEventListener('beforeprint', () => {
  document.body.classList.add('printing'); map.invalidateSize();
  if (exploring) { const lay = {}; Object.keys(GROUPS).forEach(n => { if (GROUPS[n].state === 'on' && LEG[n]) lay[n] = 'on'; }); const pr = [1, 2, 3].filter(p => EX.chips.has('p' + p)), anyS = EX.stationsOn && (EX.chips.has('existing') || pr.length);
    legend({ layers: lay, stations: anyS ? { priority: pr } : 'none', noExisting: !EX.chips.has('existing'), mods: EX.stationsOn && EX.chips.has('mod') }); }
});
window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); map.invalidateSize(); if (!exploring) legend(stateOf(si, st)); });

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
/* ---------- language switch (English / Arabic) ---------- */
const menuHtml = () => SC.map((s, i) => `<button type="button" data-i="${i}"><b>${i + 1}</b> ${esc(lang === 'ar' && AR.scenes[i] ? AR.scenes[i].title : s.title)}</button>`).join('');
const srcEn = $('#sources ul').innerHTML;
function applyLang() {
  document.body.classList.toggle('lang-ar', lang === 'ar'); document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#prev').innerHTML = '&#10094; ' + t('Back'); $('#next').innerHTML = t('Next') + ' &#10095;';
  $('#langBtn').textContent = lang === 'ar' ? 'English' : 'عربي'; $('#sceneHide').textContent = t('Hide'); $('#offline').textContent = t('Offline: simple basemap shown. The story works fully.');
  $('#sources ul').innerHTML = lang === 'ar' ? AR.sourcesHtml : srcEn; $('#menu').innerHTML = menuHtml();
  $('#dots').querySelectorAll('button').forEach((b, i) => { const ti = lang === 'ar' && AR.scenes[i] ? AR.scenes[i].title : SC[i].title; b.title = (i + 1) + '. ' + ti; });
  try { localStorage.setItem('cwrm_story_lang', lang); } catch (e) {}
  if (exploring) setExplore(true, true); else applyState(Object.assign(stateOf(si, st), { id: SC[si].id }), false, true);
  if (cardId && curCard && !exploring) { if (curCard.mod != null) openMod(curCard.mod); else if (curCard.pol != null) openPol(curCard.pol); else renderCard(curCard); }
  writeHash();
}
const setLang = (l) => { lang = l; applyLang(); };
$('#langBtn').onclick = () => setLang(lang === 'ar' ? 'en' : 'ar');
document.addEventListener('keydown', e => { if (e.target.matches('input,select,textarea')) return; if (e.key === 'l' || e.key === 'L') setLang(lang === 'ar' ? 'en' : 'ar'); });
if (lang === 'ar') map.whenReady(() => setTimeout(applyLang, 50));

/* ---------- presenter safety: offline notice, image preloading, blank screen (B), elapsed timer (T) ---------- */
(function () {
  const chip = $('#offline'), show = () => chip.classList.add('on'), hide = () => chip.classList.remove('on');
  window.addEventListener('offline', show); window.addEventListener('online', hide); if (!navigator.onLine) show();
  const gl = TILES.light && TILES.light.getMaplibreMap && TILES.light.getMaplibreMap();
  if (gl) { gl.on('error', e => { const m = String((e.error && e.error.message) || ''); if (/fetch|network|Failed|style/i.test(m)) show(); }); gl.on('load', hide); }
  setTimeout(() => { const src = []; S.forEach(s => (s.photos || []).forEach(p => src.push(p.src))); TECH.forEach(t => src.push('img/' + t[0])); src.forEach(u => { const i = new Image(); i.src = u; }); }, 2500);
  const t0 = { v: Date.now() }, tm = $('#timer'), fmt = (ms) => { const sec = Math.floor(ms / 1000); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
  setInterval(() => { if (tm.classList.contains('on')) tm.textContent = fmt(Date.now() - t0.v) + ' / ' + t('10 to 12 min'); }, 1000);
  document.addEventListener('keydown', e => { if (e.target.matches('input,select,textarea')) return; const k = e.key.toLowerCase(); if (k === 'b') $('#blank').classList.toggle('on'); else if (k === 't') tm.classList.toggle('on'); else if (k === 'home') t0.v = Date.now(); });
  $('#blank').onclick = () => $('#blank').classList.remove('on');
})();
window.CWRM_story = { go, next, prev, map, explore: setExplore, setLang };
})();
