/* Routeur, mise en page commune et délégation des événements */
(function (A) {
  const NAV = [
    ['demandes', 'Demandes', '#/demandes'],
    ['planning', 'Planning', '#/planning'],
    ['ouvriers', 'Ouvriers', '#/ouvriers'],
    ['logements', 'Logements', '#/logements'],
    ['carte', 'Carte', '#/carte'],
    ['constats', 'Constats', '#/constats'],
    ['tableau', 'Tableau de bord', '#/tableau'],
    ['classement', 'Documents', '#/classement'],
    ['referentiels', 'Référentiels', '#/referentiels'],
  ];

  A.layout = (active, inner) => `
    <header class="top">
      <a class="brand" href="#/demandes">Equalis · Travaux</a>
      <nav class="nav" aria-label="Onglets">${NAV.map(([k, l, h]) => `<a href="${h}" class="${k === active ? 'on' : ''}">${l}</a>`).join('')}</nav>
      <div class="top-r">
        <a class="btn btnp btn-sm" href="#/demande/new">+ Nouvelle demande</a>
        <a class="top-link" href="#/m/missions">${A.ic.phone()} Mobile</a>
        <select class="prof" data-ch="profil" aria-label="Profil connecté">
          ${Object.entries(A.PROFILS).map(([k, p]) => `<option value="${k}"${A.S.profil === k ? ' selected' : ''}>${A.esc(p.label)}</option>`).join('')}
        </select>
      </div>
    </header>
    <main class="main">${inner}</main>`;

  const ROUTES = [
    [/^\/demandes$/, 'demandes'],
    [/^\/demande\/new$/, 'nouvelle'],
    [/^\/demande\/([\w-]+)$/, 'qualif'],
    [/^\/planning$/, 'planning'],
    [/^\/tournees$/, 'tournees'],
    [/^\/logements$/, 'logements'],
    [/^\/logement\/([\w-]+)$/, 'logements'],
    [/^\/constats$/, 'constats'],
    [/^\/tableau$/, 'tableau'],
    [/^\/consultation\/([\w-]+)$/, 'consultation'],
    [/^\/devis\/([\w-]+)$/, 'devis'],
    [/^\/portail\/([\w-]+)(?:\/([\w-]+))?$/, 'portail'],
    [/^\/fiche\/([\w,-]+)$/, 'fiche'],
    [/^\/classement$/, 'classement'],
    [/^\/referentiels$/, 'referentiels'],
    [/^\/ouvriers$/, 'ouvriers'],
    [/^\/carte$/, 'carte'],
    [/^\/m\/missions$/, 'm_missions'],
    [/^\/m\/mission\/([\w-]+)$/, 'm_mission'],
    [/^\/m\/terminer\/([\w-]+)$/, 'm_terminer'],
    [/^\/m\/supplement\/([\w-]+)$/, 'm_supp'],
    [/^\/m\/rapport\/([\w-]+)$/, 'm_rapport'],
    [/^\/m\/constat$/, 'm_constat'],
    [/^\/m\/profil$/, 'm_profil'],
  ];

  const resolve = () => {
    const raw = (location.hash || '#/demandes').slice(1);
    const [path, qs] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    for (const [re, name] of ROUTES) {
      const m = path.match(re);
      if (m && A.V[name]) return { name, view: A.V[name], params: m.slice(1), query };
    }
    return { name: 'demandes', view: A.V.demandes, params: [], query: {} };
  };

  A.go = hash => { if (location.hash === hash) A.render(); else location.hash = hash; };

  A.render = (keepScroll = true) => {
    const root = document.getElementById('app');
    const y = window.scrollY;
    const ps = document.querySelector('.phone-scroll');
    const pst = ps ? ps.scrollTop : 0;
    const act = document.activeElement;
    const focusId = act && act.id && root.contains(act) ? act.id : null;
    let sel = null;
    try { sel = focusId && act.selectionStart != null ? [act.selectionStart, act.selectionEnd] : null; } catch (e) { sel = null; }

    clearInterval(A.timer);
    A.cur = resolve();
    try {
      root.innerHTML = A.cur.view.render(A.cur.params, A.cur.query);
      if (A.cur.view.after) A.cur.view.after(root, A.cur.params, A.cur.query);
    } catch (e) {
      console.error(e);
      root.innerHTML = A.layout('', `<div class="card pad"><h1>Erreur d'affichage</h1><p class="muted">${A.esc(e.message)}</p><button class="btn" data-act="resetDemo">Réinitialiser les données de démo</button></div>`);
    }
    if (keepScroll) {
      window.scrollTo(0, y);
      const ps2 = document.querySelector('.phone-scroll');
      if (ps2) ps2.scrollTop = pst;
    }
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus({ preventScroll: true }); try { if (sel) el.setSelectionRange(sel[0], sel[1]); } catch (e) { } }
    }
  };

  /* ---------- Actions globales ---------- */
  A.globalActs = {
    profil(el) { A.S.profil = el.value; A.saveNow(); A.toast('Profil : ' + A.profil().label); A.render(); },
    modalClose() { A.closeModal(); },
    modalBg(el, e) { if (e.target === el) A.closeModal(); },
    zoom(el) { A.modal({ title: 'Photo', body: `<img src="${el.dataset.src}" alt="Photo" style="width:100%;border-radius:8px">`, wide: true, noFooter: true }); },
    resetDemo() {
      A.modal({
        title: 'Réinitialiser la démo', danger: true, okLabel: 'Réinitialiser',
        body: '<p style="margin:0">Toutes les saisies (demandes, photos, plannings, constats, devis) seront remplacées par les données d\'exemple.</p>',
        onOk() { A.reset(); A.go('#/demandes'); A.toast('Données de démo rechargées', 'ok'); },
      });
    },
    print() { window.print(); },
  };

  const handler = attr => e => {
    const el = e.target.closest(`[data-${attr}]`);
    if (!el) return;
    const name = el.dataset[attr];
    const fn = (A.cur && A.cur.view.acts && A.cur.view.acts[name]) || A.globalActs[name];
    if (!fn) return;
    // le fond de la modale ne doit pas bloquer les clics (bouton « Valider ») sur son contenu
    if (name === 'modalBg' && e.target !== el) return;
    if (attr === 'act' && el.tagName !== 'INPUT') e.preventDefault();
    fn(el, e);
  };
  document.addEventListener('click', handler('act'));
  document.addEventListener('change', handler('ch'));
  document.addEventListener('input', handler('in'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') A.closeModal(); });

  window.addEventListener('hashchange', () => { A.closeModal(); A.render(false); window.scrollTo(0, 0); });
  window.addEventListener('beforeunload', () => A.saveNow());

  A.load();
  A.render(false);
})(window.App);
