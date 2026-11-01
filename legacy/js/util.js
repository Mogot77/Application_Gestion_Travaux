/* Utilitaires communs : dates, formats, icônes, modale, toast, photos */
window.App = { V: {}, ui: {} };
(function (A) {
  // Date de démonstration : les données d'exemple sont centrées sur la semaine du 26/10/2026.
  A.TODAY = '2026-10-29';

  const pad = n => String(n).padStart(2, '0');
  A.pad = pad;
  A.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.attr = A.esc;

  /* ---------- Dates ---------- */
  A.parse = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  A.iso = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  A.addDays = (iso, n) => { const d = A.parse(iso); d.setDate(d.getDate() + n); return A.iso(d); };
  A.diffDays = (a, b) => Math.round((A.parse(b) - A.parse(a)) / 864e5);
  A.weekStart = iso => { const d = A.parse(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return A.iso(d); };
  A.nowTime = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  A.now = () => A.TODAY + 'T' + A.nowTime();
  A.toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
  A.toTime = min => pad(Math.floor(min / 60) % 24) + ':' + pad(min % 60);
  const J = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const JL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MC = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  A.MOIS = M; A.MOIS_C = MC;
  A.fd = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '—';
  A.fdy = iso => iso ? A.fd(iso) + '/' + iso.slice(0, 4) : '—';
  A.fday = iso => iso ? J[A.parse(iso).getDay()] + ' ' + A.fd(iso) : '—';
  A.dayShort = iso => JL[A.parse(iso).getDay()].slice(0, 3);
  A.fdayLong = iso => { const d = A.parse(iso); return `${JL[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]}`; };
  A.fmonth = ym => { const [y, m] = ym.split('-').map(Number); return `${M[m - 1].replace(/^./, c => c.toUpperCase())} ${y}`; };
  A.ftime = iso => iso && iso.length > 11 ? iso.slice(11, 16) : '';
  A.fdt = iso => iso ? `${A.fd(iso)} · ${A.ftime(iso)}` : '—';
  A.fdur = min => `${Math.floor((min || 0) / 60)} h ${pad((min || 0) % 60)}`;
  A.fdurS = min => { min = min || 0; const h = Math.floor(min / 60), m = min % 60; return m ? `${h}h${pad(m)}` : `${h}h`; };
  A.feur = n => (n === '' || n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
  A.fnum = (n, dec = 1) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  A.slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '-').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  A.initials = n => n.split(/[\s.]+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();

  /* ---------- Icônes ---------- */
  const sv = (d, s = 16, c = 'currentColor', w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  A.ic = {
    chev: (c = '#5B6472') => sv('<path d="M6 9l6 6 6-6"/>', 16, c),
    search: (c = '#5B6472') => sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', 16, c),
    cal: (c = '#5B6472') => sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 16, c),
    cam: (c = 'currentColor', s = 20) => sv('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', s, c),
    photo: (s = 22) => sv('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>', s, '#7A8494', 1.8),
    back: () => sv('<path d="M15 18l-6-6 6-6"/>', 20, '#111827'),
    check: (c = '#15803D', s = 30) => sv('<path d="M5 12l5 5 9-10"/>', s, c, 2.6),
    list: (c) => sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 22, c),
    home: (c) => sv('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', 22, c),
    plus: (c) => sv('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>', 22, c),
    user: (c) => sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>', 22, c),
    phone: (c = 'currentColor') => sv('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', 15, c),
    nav: (c = '#1D4ED8') => sv('<path d="M3 11l18-8-8 18-2-8z"/>', 18, c),
    tel: (c = '#1D4ED8') => sv('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', 18, c),
    play: (c = '#fff') => sv('<path d="M7 4l13 8-13 8z"/>', 20, c),
    flag: (c = '#fff') => sv('<path d="M5 21V4h11l-2 4 2 4H5"/>', 20, c),
    info: (c = '#1D4ED8') => sv('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>', 18, c),
    file: (c = '#5B6472') => sv('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>', 18, c),
    upload: (c = '#1D4ED8') => sv('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', 22, c),
  };

  /* ---------- Fragments HTML ---------- */
  A.chip = (label, cls = 'gr', extra = '') => `<span class="chip ${cls}" ${extra}>${A.esc(label)}</span>`;
  A.opts = (list, sel, placeholder) => (placeholder != null ? `<option value="">${A.esc(placeholder)}</option>` : '') +
    list.map(o => { const v = typeof o === 'object' ? o.v : o, l = typeof o === 'object' ? o.l : o; return `<option value="${A.attr(v)}"${String(v) === String(sel) ? ' selected' : ''}>${A.esc(l)}</option>`; }).join('');
  A.seg = (act, values, sel, extra = '', clsFor) => `<div class="seg" role="group">${values.map(v => {
    const k = typeof v === 'object' ? v.k : v, l = typeof v === 'object' ? v.l : v;
    const on = String(k) === String(sel) ? (clsFor ? clsFor(k) : 'on') : '';
    return `<button type="button" class="${on}" data-act="${act}" data-v="${A.attr(k)}" ${extra}>${A.esc(l)}</button>`;
  }).join('')}</div>`;
  A.photo = (p, w = 96, h = 72, opts = {}) => {
    const inner = p && p !== 'seed' ? `<img src="${p}" alt="Photo">` : A.ic.photo(Math.min(22, w / 3));
    const del = opts.del ? `<button type="button" class="x" data-act="${opts.del}" ${opts.data || ''} aria-label="Supprimer la photo">×</button>` : '';
    const zoom = p && p !== 'seed' ? ` clk" data-act="zoom" data-src="${A.attr(p)}` : '';
    return `<div class="ph${zoom}" style="width:${w}px;height:${h}px">${inner}${del}</div>`;
  };
  A.addPhoto = (ch, data, label = '+ Photo', w = 96, h = 72, req = false, multiple = true) =>
    `<label class="addph${req ? ' req' : ''}" style="width:${w}px;height:${h}px">${req ? A.ic.cam('#B42318') : ''}${A.esc(label)}<input type="file" accept="image/*" capture="environment" ${multiple ? 'multiple' : ''} data-ch="${ch}" ${data}></label>`;
  A.kv = pairs => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${A.esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;

  /* ---------- Toast ---------- */
  A.toast = (msg, kind = '') => {
    const el = document.createElement('div');
    el.className = 'toast ' + kind; el.textContent = msg;
    document.getElementById('toast-root').appendChild(el);
    setTimeout(() => el.remove(), 3400);
  };

  /* ---------- Modale ----------
     A.modal({title, body, okLabel, onOk(form) -> false pour garder ouverte, wide, noCancel}) */
  A.modal = ({ title, body, okLabel = 'Valider', onOk, wide, danger, noFooter }) => {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="backdrop" data-act="modalBg"><form class="modal${wide ? ' wide' : ''}" novalidate>
      <header><strong style="font-size:16px">${A.esc(title)}</strong><button type="button" class="xbtn" data-act="modalClose" aria-label="Fermer">×</button></header>
      <div class="mb">${body}</div>
      ${noFooter ? '' : `<footer><button type="button" class="btn" data-act="modalClose">Annuler</button><button type="submit" class="btn ${danger ? 'btnd' : 'btnp'}">${A.esc(okLabel)}</button></footer>`}
    </form></div>`;
    const form = root.querySelector('form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!onOk || onOk(form, new FormData(form)) !== false) A.closeModal();
    });
    const first = form.querySelector('input:not([type=hidden]),select,textarea');
    if (first) first.focus();
  };
  A.closeModal = () => { document.getElementById('modal-root').innerHTML = ''; };

  /* ---------- Photos : redimensionnées pour tenir dans le stockage local ---------- */
  A.readPhoto = (file, max = 640) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
  A.readPhotos = files => Promise.all([...files].filter(f => f.type.startsWith('image/')).map(f => A.readPhoto(f)));

  /* ---------- Export ---------- */
  A.download = (name, text, mime = 'text/csv;charset=utf-8') => {
    const blob = new Blob(['﻿' + text], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  A.csv = rows => rows.map(r => r.map(c => { const s = String(c == null ? '' : c); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\n');
})(window.App);
