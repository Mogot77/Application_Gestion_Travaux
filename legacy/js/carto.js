/* Module cartographique (Leaflet + OpenStreetMap / Esri satellite).
   API : A.carto.mount(élément, { key, markers, lines, fit }) — recrée la carte à chaque rendu et mémorise le zoom / centre par clé. */
(function (A) {
  const E = A.esc;
  const C = A.carto = {};

  C.DEPOT = [48.5265, 2.676];   // dépôt du service technique, Vaux-le-Pénil
  C.BUREAU = [48.9585, 2.88];   // bureau de Meaux
  C.CENTRE = [48.72, 2.6];

  const TILES = {
    'Plan': ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
    'Satellite': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri' }],
  };

  /* ---------- Positions et distances ---------- */
  C.approx = l => !l || l.lat == null || l.lng == null;
  C.posLog = id => {
    const l = typeof id === 'object' ? id : A.Log(id);
    if (l && !C.approx(l)) return [l.lat, l.lng];
    const base = (l && A.VILLES[l.ville]) || C.DEPOT;
    // pas de géocodage : centre de la commune, légèrement décalé (stable) pour séparer les repères voisins
    const h = [...(l ? l.id : 'x')].reduce((s, c) => s + c.charCodeAt(0) * 7, 0);
    return [base[0] + ((h % 9) - 4) * 0.0035, base[1] + (((h >> 3) % 9) - 4) * 0.0045];
  };
  C.km = (a, b) => { // distance à vol d'oiseau × 1,3 ≈ distance routière
    const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
    const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(x)) * 1.3;
  };
  C.tripMin = km => Math.round(km / 35 * 60 + (km ? 5 : 0));

  /* ---------- Géocodage d'adresse (Nominatim / OpenStreetMap) ---------- */
  C.geocode = async (adresse, cp, ville) => {
    const q = `${adresse}, ${cp} ${ville}, France`;
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('Service de géocodage indisponible');
    const j = await r.json();
    return j.length ? [Number(j[0].lat), Number(j[0].lon)] : null;
  };

  /* ---------- Contenus de repères (HTML) ---------- */
  C.pin = (label, color, size = 30) => `<div class="cm-pin" style="background:${color};width:${size}px;height:${size}px">${E(label)}</div>`;
  C.avatar = (txt, color) => `<div class="cm-av" style="background:${color}">${E(txt)}</div>`;
  C.base = letter => `<div class="cm-base">${E(letter)}</div>`;

  /* ---------- Montage ----------
     spec.markers : [{ pos:[lat,lng], html, size:[w,h], anchor:[x,y], title, popup, z, draggable, onClick, onDrag }]
     spec.lines   : [{ pts:[[lat,lng],…], color, dashed, label }]                                         */
  C.mount = (el, spec) => {
    if (!el) return null;
    if (C.map) { try { C.map.remove(); } catch (e) { /* conteneur déjà détaché */ } C.map = null; }
    if (!window.L) { el.innerHTML = '<div class="empty" style="padding-top:60px">La carte n\'a pas pu être chargée : connexion internet nécessaire (bibliothèque Leaflet et fond de carte).</div>'; return null; }

    // animations de zoom coupées : leurs temporisations se déclencheraient après le rendu suivant, qui recrée la carte
    const map = L.map(el, { zoomControl: true, attributionControl: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
    const base = {}; Object.entries(TILES).forEach(([n, [u, o]]) => { base[n] = L.tileLayer(u, o); });
    const sel = A.ui.mapLayer && base[A.ui.mapLayer] ? A.ui.mapLayer : 'Plan';
    base[sel].addTo(map);
    L.control.layers(base, null, { position: 'topright', collapsed: true }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    map.on('baselayerchange', e => { A.ui.mapLayer = e.name; });

    const pts = [];
    (spec.lines || []).forEach(l => {
      L.polyline(l.pts, { color: l.color || '#1D4ED8', weight: 4, opacity: .8, dashArray: l.dashed ? '8 8' : null }).addTo(map);
      pts.push(...l.pts);
      if (l.label) {
        const mid = [(l.pts[0][0] + l.pts[l.pts.length - 1][0]) / 2, (l.pts[0][1] + l.pts[l.pts.length - 1][1]) / 2];
        L.marker(mid, { interactive: false, icon: L.divIcon({ className: 'cm-lbl', html: `<span style="border-color:${l.color || '#1D4ED8'}">${E(l.label)}</span>`, iconSize: [0, 0] }) }).addTo(map);
      }
    });
    (spec.markers || []).forEach(m => {
      const size = m.size || [30, 30];
      const icon = L.divIcon({ className: '', html: m.html, iconSize: size, iconAnchor: m.anchor || [size[0] / 2, size[1] / 2], popupAnchor: [0, -size[1] / 2] });
      const mk = L.marker(m.pos, { icon, title: m.title || '', draggable: !!m.draggable, zIndexOffset: m.z || 0 }).addTo(map);
      if (m.popup) mk.bindPopup(m.popup, { maxWidth: 280 });
      if (m.onClick) mk.on('click', () => m.onClick());
      if (m.onDrag) mk.on('dragend', e => { const p = e.target.getLatLng(); m.onDrag([p.lat, p.lng]); });
      pts.push(m.pos);
    });

    const fit = () => { if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: spec.maxZoom || 13 }); else map.setView(C.CENTRE, 9); };
    const key = spec.key || 'default'; const v = A.ui.mapView && A.ui.mapView[key];
    if (v) map.setView(v.c, v.z); else fit();
    map.on('moveend', () => { A.ui.mapView = A.ui.mapView || {}; A.ui.mapView[key] = { c: [map.getCenter().lat, map.getCenter().lng], z: map.getZoom() }; });

    const Recenter = L.Control.extend({ options: { position: 'topleft' }, onAdd() {
      const b = L.DomUtil.create('button', 'cm-recenter'); b.type = 'button'; b.textContent = 'Recentrer'; b.title = 'Ajuster la vue à tous les repères';
      L.DomEvent.disableClickPropagation(b); b.addEventListener('click', fit); return b;
    } });
    new Recenter().addTo(map);

    C.map = map;
    setTimeout(() => { if (C.map === map) map.invalidateSize(); }, 0);
    return map;
  };
})(window.App);
