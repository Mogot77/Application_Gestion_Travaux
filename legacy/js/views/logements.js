/* Écrans : logements, constats d'état, plan de classement des documents */
(function (A) {
  const E = A.esc;

  /* ---------- Génération des dossiers et noms de fichiers (règles de nommage) ---------- */
  A.logFolder = l => `${l.id}_${A.slug(l.adresse)}${l.apt ? `_Apt-${l.bat || ''}${A.pad(l.apt)}` : ''}`;
  A.docsFor = l => {
    const out = [];
    const ds = A.S.demandes.filter(d => d.logementId === l.id && d.statut !== 'brouillon').sort((a, b) => a.recueLe.localeCompare(b.recueLe));
    ds.forEach(d => {
      const files = [];
      const meta = (name, type, extra = {}) => files.push(Object.assign({ name, type, demande: d.id, logement: l.id, ville: l.ville, etab: l.etab, lot: '—', piece: '—', date: '', ouvrier: '' }, extra));
      meta(`${d.id}_00_Demande.pdf`, 'Demande', { date: d.recueLe.slice(0, 10) });
      d.lignes.forEach((ln, i) => {
        const base = `${d.id}_L${i + 1}_${A.slug(ln.piece)}_${A.slug(A.shortLot(ln.lot))}-${A.slug(ln.nature.split(' ')[0])}`;
        (ln.photos || []).forEach((p, j) => meta(`${base}_AVANT_${A.pad(j + 1)}.jpg`, 'Avant', { lot: A.shortLot(ln.lot), piece: ln.piece, date: d.recueLe.slice(0, 10) }));
      });
      if (d.ft) meta(`${d.id}_${d.ft}_Fiche-intervention.pdf`, 'Fiche ST');
      A.S.rdvs.filter(r => r.demandeId === d.id && r.rapport).forEach(r => {
        const o = A.Ouv(r.ouvrierId).nom;
        d.lignes.forEach((ln, i) => (ln.photosApres || []).forEach((p, j) => meta(`${d.id}_L${i + 1}_${A.slug(ln.piece)}_${A.slug(A.shortLot(ln.lot))}-${A.slug(ln.nature.split(' ')[0])}_APRES_${A.pad(j + 1)}.jpg`, 'Après', { lot: A.shortLot(ln.lot), piece: ln.piece, date: r.date, ouvrier: o })));
        (r.rapport.supps || []).forEach((s, i) => meta(`${d.id}_S${i + 1}_${A.slug(s.piece)}_${A.slug(A.shortLot(s.lot))}-${A.slug(s.nature.split(' ')[0])}_SUPP_01.jpg`, 'Supplément', { lot: A.shortLot(s.lot), piece: s.piece, date: r.date, ouvrier: o, note: 'travaux ajoutés sur place' }));
        meta(`${d.id}_Rapport_${r.date}_interne.pdf`, 'Rapport', { lot: A.shortLot(d.lignes[0].lot), date: r.date, ouvrier: o });
        meta(`${d.id}_Rapport_${r.date}_etablissement.pdf`, 'Rapport', { lot: A.shortLot(d.lignes[0].lot), date: r.date, ouvrier: o });
      });
      if (d.consultationId) {
        const c = A.Cs(d.consultationId);
        if (c) Object.entries(c.reponses).filter(([, r]) => r.statut === 'recu').forEach(([eid, r]) => meta(`${d.id}_Devis_${A.slug(A.Ent(eid).nom)}_${r.date}.pdf`, 'Devis', { date: r.date, note: 'prestataire' }));
      }
      if (d.sinistreInfo) meta(`${d.id}_Sinistre_Declaration_${d.recueLe.slice(0, 10)}.pdf`, 'Sinistre');
      out.push({ folder: `${d.id}_${d.recueLe.slice(0, 10)}`, d, files });
    });
    const cons = A.S.constats.filter(c => c.logementId === l.id).flatMap(c => c.photos.map((p, j) => ({ name: `${c.id}_${c.date}_${A.pad(j + 1)}.jpg`, type: 'Constat', demande: '—', logement: l.id, ville: l.ville, etab: l.etab, lot: '—', piece: '—', date: c.date, ouvrier: '' })));
    return { demandes: out, constats: cons };
  };

  const ext = n => { const e = n.split('.').pop(); return `<span class="ext ${e}">${e.toUpperCase()}</span>`; };

  /* =====================================================================
     Logements
     ===================================================================== */
  A.V.logements = {
    render([id]) {
      const ui = A.ui.log = A.ui.log || { q: '', dept: '', typo: '', etab: '', tab: 'synthese' };
      const S = A.S;
      const q = ui.q.toLowerCase();
      const list = S.logements.filter(l => (!q || `${l.id} ${l.adresse} ${l.ville} ${l.crypto}`.toLowerCase().includes(q)) && (!ui.dept || l.dept === ui.dept) && (!ui.typo || l.typo === ui.typo) && (!ui.etab || l.etab === ui.etab) && (A.S.profil !== 'etab' || l.etab === A.profil().etab));
      const sel = A.Log(id) || list[0];
      if (sel && sel.id !== ui.lastId) { ui.lastId = sel.id; ui.tab = A.ui.logTab || 'synthese'; A.ui.logTab = ''; }
      const groups = {};
      list.forEach(l => { const k = `${l.dept} › ${l.ville.toUpperCase()}`; (groups[k] = groups[k] || []).push(l); });
      const resume = l => {
        const ds = S.demandes.filter(d => d.logementId === l.id && !A.CLOSED.includes(d.statut) && d.statut !== 'brouillon');
        const c = S.constats.filter(x => x.logementId === l.id).sort((a, b) => b.date.localeCompare(a.date))[0];
        if (ds.some(d => d.statut === 'en_cours')) return 'intervention en cours';
        if (ds.some(d => d.statut === 'a_reactualiser')) return 'demande à réactualiser';
        if (ds.some(d => A.QUALIF.includes(d.statut))) return `${ds.length} demande${ds.length > 1 ? 's' : ''} dont à qualifier`;
        if (ds.length) return `${ds.length} demande${ds.length > 1 ? 's' : ''} en cours`;
        if (c && c.proprete <= 2) return `constat « ${S.ref.proprete[c.proprete].toLowerCase()} » le ${A.fd(c.date)}`;
        return 'aucune demande en cours';
      };

      const left = `<aside class="card" style="flex:0 1 330px;min-width:260px;align-self:stretch">
        <div style="padding:14px;border-bottom:1px solid #EEF0F3;display:flex;flex-direction:column;gap:10px">
          <div><strong>Logements</strong> <span class="muted">· ${S.logements.filter(l => l.actif).length} actifs</span></div>
          <label class="flt" style="cursor:text">${A.ic.search()}<input id="lq" data-in="lq" value="${E(ui.q)}" placeholder="N°, adresse, ville, ID Crypto" style="border:0;outline:0;font:inherit;flex:1;min-width:0"></label>
          <div class="row" style="gap:6px">
            <select class="flt${ui.dept ? ' on' : ''}" data-ch="lf" data-k="dept">${A.opts(['77', '91'], ui.dept, 'Dépt')}</select>
            <select class="flt${ui.typo ? ' on' : ''}" data-ch="lf" data-k="typo">${A.opts(['T2', 'T3', 'T4', 'BUR'], ui.typo, 'Typologie')}</select>
            ${A.S.profil !== 'etab' ? `<select class="flt${ui.etab ? ' on' : ''}" data-ch="lf" data-k="etab" style="max-width:150px">${A.opts([...new Set(S.logements.map(l => l.etab))], ui.etab, 'Établissement')}</select>` : ''}
          </div>
        </div>
        <div style="max-height:760px;overflow:auto">
        ${Object.entries(groups).map(([g, ls]) => `<div class="small" style="padding:10px 14px 4px;font-weight:700;color:#5B6472;letter-spacing:.04em">${E(g)}</div>` + ls.map(l => `
          <a href="#/logement/${l.id}" style="display:block;padding:10px 14px;text-decoration:none;color:#111827;border-left:3px solid ${sel && l.id === sel.id ? '#1D4ED8' : 'transparent'};background:${sel && l.id === sel.id ? '#F5F8FF' : 'transparent'};font-size:13px">
            <strong>${l.id}</strong> · ${E(l.typo === 'BUR' ? 'Bureaux' : l.typo)}${l.apt ? ' · apt ' + E(l.apt) : ''}<small style="display:block;color:#5B6472;margin-top:2px">${E(l.adresse)} · ${E(resume(l))}</small></a>`).join('')).join('') || '<div class="empty">Aucun logement</div>'}
        </div></aside>`;

      if (!sel) return A.layout('logements', `<div class="cols">${left}</div>`);

      const ds = S.demandes.filter(d => d.logementId === sel.id && d.statut !== 'brouillon').sort((a, b) => b.recueLe.localeCompare(a.recueLe));
      const cs = S.constats.filter(c => c.logementId === sel.id).sort((a, b) => b.date.localeCompare(a.date));
      const docs = A.docsFor(sel);
      const nDocs = docs.demandes.reduce((s, x) => s + x.files.length, 0) + docs.constats.length;
      const pieces = A.piecesFor(sel).pieces;
      const cnt = {};
      ds.filter(d => A.diffDays(d.recueLe, A.TODAY) <= 730).forEach(d => d.lignes.forEach(l => { cnt[l.piece] = cnt[l.piece] || { n: 0, open: false }; cnt[l.piece].n++; if (!A.CLOSED.includes(d.statut)) cnt[l.piece].open = true; }));
      const lastC = cs[0];
      const interDate = d => { const r = A.nextRdv(d); return r ? r.date : d.dateIntervention || ''; };

      const tabSynth = `
        <div class="cols" style="gap:16px">
          <div class="card pad" style="flex:1 1 380px">
            <h2 class="h2" style="margin-bottom:12px">Pièces et historique</h2>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
              ${pieces.map(p => { const c = cnt[p]; return `<div style="border:1px solid ${c && c.open ? '#E9A79F' : '#E3E6EB'};background:${c && c.open ? '#FFFBFA' : '#fff'};border-radius:8px;padding:10px;font-size:12px;display:flex;flex-direction:column;gap:4px;min-height:62px"><span style="font-weight:600">${E(p)}</span><b style="font-weight:500;color:${c ? '#111827' : '#9AA3B0'}">${c ? `${c.n} intervention${c.n > 1 ? 's' : ''}${c.open ? ' · en cours' : ''}` : '—'}</b></div>`; }).join('')}
            </div>
            <p class="muted small" style="margin:10px 0 0">Nombre d'interventions par pièce sur 24 mois.</p>
          </div>
          <div class="card pad" style="flex:1 1 300px">
            <h2 class="h2" style="margin-bottom:12px">Dernier constat d'état</h2>
            ${lastC ? `<div class="row" style="gap:14px;align-items:flex-start;flex-wrap:nowrap">${A.photo(lastC.photos[0], 110, 82)}
              <div class="s13" style="display:flex;flex-direction:column;gap:6px"><div><strong>${A.fdy(lastC.date)}</strong> · ${E(lastC.contexte.toLowerCase())}</div>
              <div>Propreté : ${A.chip(lastC.proprete + ' / 6', lastC.proprete <= 2 ? 'bad' : lastC.proprete <= 3 ? 'mid' : 'ok')}</div>
              <div>Bâti : ${A.chip(lastC.bati, lastC.bati === 'Bon' ? 'ok' : lastC.bati === 'Moyen' ? 'mid' : 'bad')}</div>
              <div class="muted">par ${E(lastC.auteur)}, ${E(lastC.fonction.toLowerCase())}</div></div></div>
              <button class="linkbtn s13" style="margin-top:12px" data-act="ltab" data-v="constats">Historique des constats</button>` : '<p class="muted s13">Aucun constat enregistré.</p>'}
          </div>
        </div>
        <div class="card" style="margin-top:16px;overflow:hidden">
          <div class="row between" style="padding:14px 18px"><h2 class="h2">Localisation</h2>
            <div class="row" style="gap:8px">${A.carto.approx(sel) ? A.chip('Position approximative', 'h48') : A.chip('Position précise', 'ok')}
              <button class="btn btn-sm" data-act="lGeo" data-id="${sel.id}">Géolocaliser l'adresse</button>
              ${A.carto.approx(sel) ? '' : `<button class="btn btn-sm" data-act="lGeoReset" data-id="${sel.id}">Réinitialiser</button>`}</div></div>
          <div id="carto-log" class="carto" style="height:300px;border-radius:0"></div>
          <p class="muted small" style="margin:0;padding:10px 18px">${A.carto.approx(sel) ? `Repère placé au centre de ${E(sel.ville)}. ` : ''}Déplacez le repère à la main ou utilisez « Géolocaliser l'adresse » (recherche OpenStreetMap, connexion internet nécessaire).</p>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="row between" style="padding:16px 18px 6px"><h2 class="h2">Interventions récentes</h2><span class="muted s13">${ds.filter(d => A.diffDays(d.recueLe, A.TODAY) <= 365).length} demande(s) sur 12 mois</span></div>
          ${tblInter(ds.slice(0, 5), interDate)}
        </div>`;

      const tabInter = `<div class="card">${tblInter(ds, interDate)}</div>`;
      const tabCons = `<div class="card tbl-wrap">${tblConstats(cs, false)}</div>`;
      const tabDocs = `<div class="tree"><div style="color:#94A3B8">Travaux – Logements / ${E(A.DEPTS[sel.dept])} / ${E(A.slug(sel.ville))} /</div>${treeLog(sel, true)}</div>
        <p class="muted small">Dossiers et noms créés par l'outil, jamais à la main. <a href="#/classement">Voir le plan de classement complet</a></p>`;

      return A.layout('logements', `<div class="cols" style="gap:16px">${left}
        <section style="flex:999 1 640px;min-width:0;display:flex;flex-direction:column;gap:16px">
          <div class="card pad">
            <div class="row between" style="align-items:flex-start">
              <div><div class="row" style="gap:10px"><h1>${sel.id}</h1>${A.chip(`${sel.typo === 'BUR' ? 'Bureaux' : sel.typo} · ${sel.surface} m²`, 'gr')}${A.chip(sel.actif ? 'Actif' : 'Sorti du parc', sel.actif ? 'ok' : 'gr')}</div>
                <p class="muted" style="margin:6px 0 0">${E(A.logAdr(sel))}, ${E(sel.etage)} — ${E(sel.cp)} ${E(sel.ville)}</p></div>
              <div class="row" style="gap:8px">
                <button class="btn" data-act="ltab" data-v="docs">Ouvrir le dossier documents</button>
                <a class="btn" href="#/m/constat?log=${sel.id}">Nouveau constat</a>
                <a class="btn btnp" href="#/demande/new?log=${sel.id}">Nouvelle demande</a>
              </div>
            </div>
            <div class="grid-auto" style="--min:300px;margin-top:16px;gap:16px">
              ${A.kv([['Établissement', E(sel.etab)], ['Code section', E(sel.section)], ['CGL', E(sel.cgl)], ['Dispositif', E(sel.dispositif)], ['Ménage', E(sel.menage)]])}
              ${A.kv([['ID Crypto', E(sel.crypto)], ['Bailleur', E(sel.bailleur)], ['Demande occupant', sel.dispositif === 'Solibail' ? 'Option activée' : 'Option désactivée'], ['Secteur ST', E(sel.secteur)], ['Accès · clés', `${E(sel.acces || '—')} · ${E(sel.cles)}`]])}
            </div>
          </div>
          <nav class="tabs" style="margin:0">
            ${[['synthese', 'Synthèse'], ['inter', `Interventions (${ds.length})`], ['constats', `Constats (${cs.length})`], ['docs', `Documents (${nDocs})`]].map(([k, l]) => `<button class="tab${ui.tab === k ? ' on' : ''}" data-act="ltab" data-v="${k}">${l}</button>`).join('')}
          </nav>
          ${{ synthese: tabSynth, inter: tabInter, constats: tabCons, docs: tabDocs }[ui.tab]}
        </section></div>`);
    },
    after() {
      const el = document.getElementById('carto-log'); const l = A.Log(A.ui.log && A.ui.log.lastId);
      if (!el || !l) return;
      const C = A.carto;
      A.carto.mount(el, { key: 'log-' + l.id, maxZoom: 16, markers: [
        { pos: C.DEPOT, html: C.base('D'), size: [26, 26], title: 'Dépôt ST' },
        { pos: C.posLog(l), html: C.pin('', '#1D4ED8', 32), size: [32, 32], draggable: true, z: 1000, title: `${l.id} · glisser pour repositionner`,
          onDrag(p) { l.lat = Math.round(p[0] * 1e6) / 1e6; l.lng = Math.round(p[1] * 1e6) / 1e6; A.saveNow(); A.toast('Position enregistrée', 'ok'); A.render(); } },
      ] });
      // la vue mémorisée pourrait masquer le repère : on la recale à chaque changement de logement
      if (A.ui.logMapId !== l.id) { A.ui.logMapId = l.id; C.map.setView(C.posLog(l), 15); }
    },
    acts: {
      lGeo(el) {
        const l = A.Log(el.dataset.id); el.disabled = true; el.textContent = 'Recherche…';
        A.carto.geocode(l.adresse, l.cp, l.ville).then(p => {
          if (!p) { A.toast('Adresse introuvable : placez le repère à la main', 'err'); el.disabled = false; el.textContent = "Géolocaliser l'adresse"; return; }
          l.lat = p[0]; l.lng = p[1]; A.saveNow(); A.ui.logMapId = ''; A.toast('Adresse géolocalisée', 'ok'); A.render();
        }).catch(e => { A.toast('Géocodage impossible : ' + e.message, 'err'); el.disabled = false; el.textContent = "Géolocaliser l'adresse"; });
      },
      lGeoReset(el) { const l = A.Log(el.dataset.id); delete l.lat; delete l.lng; A.saveNow(); A.ui.logMapId = ''; A.render(); },
      lq(el) { A.ui.log.q = el.value; A.render(); },
      lf(el) { A.ui.log[el.dataset.k] = el.value; A.render(); },
      ltab(el) { A.ui.log.tab = el.dataset.v; A.render(); },
    },
  };

  function tblInter(ds, interDate) {
    if (!ds.length) return '<div class="empty">Aucune intervention</div>';
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Date</th><th>N°</th><th>Pièce · travaux</th><th>Circuit</th><th>Imputation</th><th>Statut</th><th>Rapport</th></tr></thead><tbody>
      ${ds.map(d => { const di = interDate(d); const done = ['realisee', 'cloturee'].includes(d.statut);
        return `<tr><td>${di ? A.fd(di) + (di > A.TODAY || d.statut === 'planifiee' ? ' (prévue)' : '') : A.fd(d.recueLe) + ' <small>demande</small>'}</td><td><a href="#/demande/${d.id}">${d.id}</a></td><td>${E(d.lignes.map(l => l.piece).filter((v, i, a) => a.indexOf(v) === i).join(', '))} · ${E(d.lignes.map(l => l.nature).join(', '))}</td><td>${E(A.circuitOf(d) || '—')}</td><td>${E([...new Set(d.lignes.map(l => l.imputation.replace(' (refacturation)', '')))].join(' / '))}</td><td>${A.statChip(d)}</td><td>${done ? `<a href="#/fiche/${d.id}">PDF</a>` : '<span class="muted">—</span>'}</td></tr>`; }).join('')}
      </tbody></table></div>`;
  }

  function treeLog(l, open) {
    const docs = A.docsFor(l);
    const f = x => `<div class="f">${ext(x.name)}${E(x.name)}${x.note ? `<span class="cm">${E(x.note)}</span>` : ''}</div>`;
    return `<details ${open ? 'open' : ''}><summary>${E(A.logFolder(l))}/</summary>
      <details><summary>_Constats/ <span class="cm">${docs.constats.length} photo(s)</span></summary>${docs.constats.map(f).join('') || '<div class="f cm">vide</div>'}</details>
      ${docs.demandes.map((x, i) => `<details ${open && i === docs.demandes.length - 1 ? 'open' : ''}><summary>${E(x.folder)}/ <span class="cm">${A.STAT[x.d.statut][0].toLowerCase()}</span></summary>${x.files.map(f).join('')}</details>`).join('')}
    </details>`;
  }

  /* =====================================================================
     Constats d'état
     ===================================================================== */
  const propCls = n => n <= 2 ? 'bad' : n <= 3 ? 'mid' : 'ok';
  const batiCls = b => b === 'Bon' ? 'ok' : b === 'Moyen' ? 'mid' : 'bad';
  const isAlert = c => c.proprete <= 2 || c.signalements.some(s => /Chauffage d'appoint|électrique dangereuse|Détecteur/.test(s));

  function tblConstats(list, withLog) {
    if (!list.length) return '<div class="empty">Aucun constat</div>';
    return `<table class="t" style="min-width:${withLog ? 1000 : 820}px"><thead><tr><th>Date</th>${withLog ? '<th>Logement</th>' : ''}<th>Auteur</th><th>Contexte</th><th>Propreté /6</th><th>Bâti</th><th>Signalements</th><th>Photos</th><th>Suite donnée</th></tr></thead><tbody>
      ${list.map(c => { const l = A.Log(c.logementId) || {};
        const suite = c.demandeId ? `<a href="#/demande/${c.demandeId}">${c.demandeId}</a><small>créée depuis le constat</small>`
          : c.suite === 'aucune' ? '<span class="muted">Aucune</span>'
          : `${isAlert(c) ? A.chip('Alerte coordination', 'bad') + '<br>' : '<span class="muted">À examiner</span><br>'}<div class="row" style="gap:6px;margin-top:4px"><a class="small" href="#/demande/new?log=${c.logementId}&constat=${c.id}">Créer une demande</a><button class="linkbtn small" data-act="csans" data-id="${c.id}">Sans suite</button></div>`;
        return `<tr><td>${A.fd(c.date)}</td>${withLog ? `<td><a href="#/logement/${l.id}">${l.id}</a><small>${E(l.ville)} · ${E(l.typo)}</small></td>` : ''}<td>${E(c.auteur)}<small>${E(c.fonction)}</small></td><td>${E(c.contexte)}</td><td>${A.chip(c.proprete + ' / 6', propCls(c.proprete))}</td><td>${A.chip(c.bati, batiCls(c.bati))}</td>
          <td style="max-width:300px">${c.signalements.map(s => `<span class="tag">${E(s)}</span>`).join('') || '<span class="muted">—</span>'}${c.commentaire ? `<small>${E(c.commentaire)}</small>` : ''}</td>
          <td><div class="row" style="gap:4px;flex-wrap:nowrap">${c.photos.slice(0, 3).map(p => A.photo(p, 36, 28)).join('')}${c.photos.length > 3 ? `<span class="muted small">+${c.photos.length - 3}</span>` : ''}${!c.photos.length ? '<span class="muted">0</span>' : ''}</div></td><td>${suite}</td></tr>`; }).join('')}
      </tbody></table>`;
  }

  A.V.constats = {
    render() {
      const ui = A.ui.ce = A.ui.ce || { prop: '', bati: '', sig: '', ctx: '', etab: '', per: '30' };
      const S = A.S;
      const list = S.constats.filter(c => {
        const l = A.Log(c.logementId) || {};
        if (ui.prop !== '' && c.proprete > Number(ui.prop)) return false;
        if (ui.bati && c.bati !== ui.bati) return false;
        if (ui.sig && !c.signalements.includes(ui.sig)) return false;
        if (ui.ctx && c.contexte !== ui.ctx) return false;
        if (ui.etab && l.etab !== ui.etab) return false;
        if (ui.per && A.diffDays(c.date, A.TODAY) > Number(ui.per)) return false;
        if (A.S.profil === 'etab' && l.etab !== A.profil().etab) return false;
        return true;
      }).sort((a, b) => b.date.localeCompare(a.date));
      const month = S.constats.filter(c => c.date.slice(0, 7) === A.TODAY.slice(0, 7));
      const sans = S.logements.filter(l => l.typo !== 'BUR').map(l => ({ l, last: S.constats.filter(c => c.logementId === l.id).map(c => c.date).sort().pop() })).filter(x => !x.last || A.diffDays(x.last, A.TODAY) > 182);
      const sel = (k, label, opts) => `<select class="flt${ui[k] !== '' ? ' on' : ''}" data-ch="cef" data-k="${k}">${A.opts(opts, ui[k], label)}</select>`;
      return A.layout('constats', `
        <div class="pagehead">
          <div><h1 style="margin-bottom:4px">Constats d'état des logements</h1><p class="muted" style="margin:0">Déclarés par tout salarié depuis son téléphone. Ils décrivent le logement, jamais le ménage.</p></div>
          <a class="btn btnp" href="#/m/constat">+ Nouveau constat</a>
        </div>
        <div class="row" style="gap:8px;margin-bottom:16px">
          ${sel('prop', 'Propreté (0 à 6)', [0, 1, 2, 3, 4, 5].map(n => ({ v: n, l: `Propreté ≤ ${n}` })))}
          ${sel('bati', 'État du bâti', ['Bon', 'Moyen', 'Dégradé'])}
          ${sel('sig', 'Signalements', Object.values(S.ref.signalements).flat())}
          ${sel('ctx', 'Contexte', S.ref.contextes)}
          ${A.S.profil !== 'etab' ? sel('etab', 'Établissement', [...new Set(S.logements.map(l => l.etab))]) : ''}
          ${sel('per', 'Période : tout', [{ v: '30', l: 'Période : 30 jours' }, { v: '90', l: 'Période : 90 jours' }, { v: '365', l: 'Période : 12 mois' }])}
        </div>
        <div class="cols" style="gap:16px">
          <section class="card tbl-wrap" style="flex:999 1 700px;min-width:0">${tblConstats(list, true)}</section>
          <aside class="col-side" style="flex:1 1 280px">
            <div class="card pad"><h2 class="h2" style="margin-bottom:12px">Ce mois-ci</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div><div class="muted small">Constats</div><strong style="font-size:22px">${month.length}</strong></div>
                <div><div class="muted small">Propreté ≤ 2 / 6</div><strong style="font-size:22px;color:#B42318">${month.filter(c => c.proprete <= 2).length}</strong></div>
                <div><div class="muted small">Demandes créées</div><strong style="font-size:22px">${month.filter(c => c.demandeId).length}</strong></div>
                <div><div class="muted small">Alertes sécurité</div><strong style="font-size:22px;color:#B42318">${month.filter(c => c.signalements.some(s => /Chauffage d'appoint|électrique|Détecteur/.test(s))).length}</strong></div>
              </div></div>
            <div class="card pad"><h2 class="h2">Sans constat depuis plus de 6 mois</h2><p class="muted small" style="margin:4px 0 10px">Seuil réglable par la direction</p>
              <ul style="list-style:none;margin:0;padding:0;font-size:13px;display:flex;flex-direction:column;gap:8px">
                ${sans.map(x => `<li class="row between"><a href="#/logement/${x.l.id}">${x.l.id} · ${E(x.l.ville)}</a><span class="muted">${x.last ? 'dernier : ' + A.fd(x.last) : 'jamais'}</span></li>`).join('') || '<li class="muted">Aucun</li>'}
              </ul></div>
          </aside>
        </div>`);
    },
    acts: {
      cef(el) { A.ui.ce[el.dataset.k] = el.value; A.render(); },
      csans(el) { const c = A.Ce(el.dataset.id); c.suite = 'aucune'; A.saveNow(); A.toast('Constat classé sans suite'); A.render(); },
    },
  };

  /* =====================================================================
     Plan de classement SharePoint
     ===================================================================== */
  const RULES = [
    ['Département', '<n°>-<Nom>', '77-Seine-et-Marne'], ['Ville', '<Ville>', 'Corbeil-Essonnes'],
    ['Logement', '<ID>_<n°-rue>_Apt-<bât+n°>', 'LOG-0452_12-rue-des-Lilas_Apt-B31'], ['Demande', '<DI>_<date demande>', 'DI-2026-0142_2026-10-27'],
    ['Récapitulatif', '<DI>_00_Demande.pdf'], ["Photo d'une ligne", '<DI>_L<n>_<Pièce>_<Lot>-<Nature>_<AVANT|APRES>_<nn>.jpg'],
    ['Travaux sur place', '<DI>_S<n>_<Pièce>_<Lot>-<Nature>_SUPP_<nn>.jpg'], ['Fiche ST', '<DI>_<FT>_Fiche-intervention.pdf'],
    ['Rapport', '<DI>_Rapport_<date>_<interne|etablissement>.pdf'], ['Devis', '<DI>_Devis_<Entreprise>_<date>.pdf'],
    ['Sinistre', '<DI>_Sinistre_<Constat|Declaration|Expertise|Indemnisation>_<date>.pdf'], ['Photo de constat', '_Constats/<CE>_<date>_<nn>.jpg'],
  ];
  const VIEWS = [['', 'Tous les fichiers'], ['week', 'Photos de la semaine'], ['avap', 'Avant / après'], ['rap', 'Rapports'], ['devis', 'Devis'], ['cons', 'Constats']];

  A.V.classement = {
    render() {
      const ui = A.ui.cl = A.ui.cl || { v: '' };
      const S = A.S;
      const logs = S.logements.filter(l => A.S.profil !== 'etab' || l.etab === A.profil().etab);
      const byDept = {};
      logs.forEach(l => { const dk = A.DEPTS[l.dept] || l.dept; byDept[dk] = byDept[dk] || {}; (byDept[dk][A.slug(l.ville)] = byDept[dk][A.slug(l.ville)] || []).push(l); });
      const all = logs.flatMap(l => { const d = A.docsFor(l); return [...d.demandes.flatMap(x => x.files), ...d.constats]; });
      const flt = all.filter(f => !ui.v || (ui.v === 'week' && f.name.endsWith('.jpg') && f.date && A.diffDays(f.date, A.TODAY) <= 7 && A.diffDays(f.date, A.TODAY) >= 0) || (ui.v === 'avap' && ['Avant', 'Après'].includes(f.type)) || (ui.v === 'rap' && f.type === 'Rapport') || (ui.v === 'devis' && f.type === 'Devis') || (ui.v === 'cons' && f.type === 'Constat'))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      return A.layout('classement', `
        <h1 style="margin-bottom:6px">Plan de classement des documents travaux</h1>
        <p class="muted" style="margin:0 0 18px;max-width:900px">Une bibliothèque SharePoint « Travaux – Logements » dans l'équipe Teams du service technique. Dossiers et noms créés par l'outil, jamais à la main. L'arborescence ci-dessous est générée à partir des données de l'application.</p>
        <div class="cols" style="gap:16px">
          <section class="card pad" style="flex:999 1 640px;min-width:0">
            <h2 class="h2" style="margin-bottom:4px">Arborescence : Département › Ville › Logement › Demande</h2>
            <p class="muted s13" style="margin:0 0 12px">Cliquez sur un dossier pour l'ouvrir.</p>
            <div class="tree"><div>Travaux – Logements/</div>
              ${Object.entries(byDept).sort().map(([dk, villes]) => `<details open><summary>${E(dk)}/</summary>${Object.entries(villes).sort().map(([v, ls]) => `<details><summary>${E(v)}/ <span class="cm">${ls.length} logement(s)</span></summary>${ls.map(l => treeLog(l, false)).join('')}</details>`).join('')}</details>`).join('')}
              <details><summary>_A-classer/ <span class="cm">pièces jointes reçues par mail (transition)</span></summary><div class="f cm">vide</div></details>
              <details><summary>_Archives/ <span class="cm">logements sortis du parc, même structure</span></summary><div class="f cm">vide</div></details>
            </div>
          </section>
          <section class="card pad" style="flex:1 1 420px;min-width:0">
            <h2 class="h2" style="margin-bottom:4px">Règles de nommage</h2>
            <p class="muted s13" style="margin:0 0 12px">Sans accents, espaces ni caractères spéciaux · chemin complet sous 400 caractères.</p>
            <div class="tbl-wrap"><table class="t"><thead><tr><th>Élément</th><th>Modèle</th></tr></thead><tbody>
              ${RULES.map(([k, m, ex]) => `<tr><td>${E(k)}</td><td><code>${E(m)}</code>${ex ? `<br><code style="background:#E8EEFC;color:#1D4ED8">${E(ex)}</code>` : ''}</td></tr>`).join('')}
            </tbody></table></div>
          </section>
        </div>
        <section class="card pad" style="margin-top:16px">
          <div class="row between" style="margin-bottom:12px"><div><h2 class="h2">Vue SharePoint avec métadonnées</h2><p class="muted s13" style="margin:4px 0 0">Colonnes remplies automatiquement : on filtre sans toucher aux dossiers.</p></div>
            <div class="row" style="gap:6px">${VIEWS.map(([k, l]) => `<button class="btn btn-sm${ui.v === k ? ' btnp' : ''}" data-act="clv" data-v="${k}">${l}</button>`).join('')}</div></div>
          <div class="tbl-wrap"><table class="t nowrap"><thead><tr><th>Nom</th><th>N° demande</th><th>Logement</th><th>Ville</th><th>Établissement</th><th>Lot</th><th>Pièce</th><th>Type</th><th>Date</th><th>Ouvrier</th></tr></thead><tbody>
            ${flt.slice(0, 60).map(f => `<tr><td><span class="tree" style="background:none;padding:0;color:#111827;font-size:12px">${ext(f.name)}</span>${E(f.name)}</td><td>${E(f.demande)}</td><td>${E(f.logement)}</td><td>${E(f.ville)}</td><td>${E(f.etab)}</td><td>${E(f.lot)}</td><td>${E(f.piece)}</td><td>${E(f.type)}</td><td>${f.date ? A.fdy(f.date) : '—'}</td><td>${E(f.ouvrier || '—')}</td></tr>`).join('') || '<tr><td colspan="10" class="empty">Aucun fichier</td></tr>'}
          </tbody></table></div>
          <p class="muted small" style="margin:12px 0 0">${flt.length} fichier(s)${flt.length > 60 ? ' · 60 premiers affichés' : ''}. Droits : chaque établissement ne voit que les dossiers de ses logements ; coordination, service technique et direction voient tout.</p>
        </section>`);
    },
    acts: { clv(el) { A.ui.cl.v = el.dataset.v; A.render(); } },
  };
})(window.App);
