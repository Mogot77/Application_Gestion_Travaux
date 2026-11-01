/* Écrans : liste des demandes, fiche de nouvelle demande, qualification */
(function (A) {
  const E = A.esc;

  /* =====================================================================
     1. Liste des demandes
     ===================================================================== */
  const TABS = [
    ['toutes', 'Toutes', () => true],
    ['a_traiter', 'À traiter', d => !A.CLOSED.includes(d.statut)],
    ['a_qualifier', 'À qualifier', d => A.QUALIF.includes(d.statut)],
    ['a_planifier', 'À planifier', d => ['a_planifier', 'acces_impossible'].includes(d.statut)],
    ['occupants', "Demandes d'occupants", d => d.origine === 'occupant' && !A.CLOSED.includes(d.statut)],
    ['a_reactualiser', 'À réactualiser', d => d.statut === 'a_reactualiser'],
    ['cloturees', 'Clôturées', d => A.CLOSED.includes(d.statut)],
  ];
  const PER_PAGE = 12;

  const actionFor = d => {
    switch (d.statut) {
      case 'a_qualifier': case 'en_qualification': return ['Qualifier', `#/demande/${d.id}`];
      case 'a_valider_occupant': return ['Valider', `#/demande/${d.id}`];
      case 'a_planifier': return ['Planifier', `#/planning?sel=${d.id}`];
      case 'acces_impossible': return ['Reprogrammer', `#/planning?sel=${d.id}`];
      case 'a_reactualiser': return ['Relancer', `#/demande/${d.id}`];
      case 'consultation': return ['Devis', `#/devis/${d.consultationId}`];
      case 'realisee': case 'cloturee': return ['Rapport', `#/fiche/${d.id}`];
      default: return ['Ouvrir', `#/demande/${d.id}`];
    }
  };

  const filtered = () => {
    const ui = A.ui.dem;
    const all = A.visibleDemandes();
    const tabFn = (TABS.find(t => t[0] === ui.tab) || TABS[1])[2];
    const q = ui.q.trim().toLowerCase();
    return all.filter(tabFn).filter(d => {
      const log = A.Log(d.logementId) || {};
      if (q && !`${d.id} ${log.id} ${log.adresse} ${log.ville} ${d.lignes.map(l => l.nature + ' ' + l.lot + ' ' + l.piece).join(' ')}`.toLowerCase().includes(q)) return false;
      if (ui.etab && log.etab !== ui.etab) return false;
      if (ui.dept && log.dept !== ui.dept) return false;
      if (ui.lot && !d.lignes.some(l => l.lot === ui.lot)) return false;
      if (ui.urgence && d.urgence !== ui.urgence) return false;
      if (ui.circuit && !d.lignes.some(l => l.circuit === ui.circuit)) return false;
      if (ui.statut && d.statut !== ui.statut) return false;
      return true;
    }).sort((a, b) => b.recueLe.localeCompare(a.recueLe));
  };

  A.V.demandes = {
    render() {
      const ui = A.ui.dem = A.ui.dem || { tab: 'a_traiter', q: '', etab: '', dept: '', lot: '', urgence: '', circuit: '', statut: '', page: 0, sel: [] };
      const all = A.visibleDemandes();
      const rows = filtered();
      const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
      ui.page = Math.min(ui.page, pages - 1);
      const shown = rows.slice(ui.page * PER_PAGE, ui.page * PER_PAGE + PER_PAGE);
      const etabs = [...new Set(A.S.logements.map(l => l.etab))];
      const month = A.TODAY.slice(0, 7);
      const horsProc = all.filter(d => ['mail', 'tel'].includes(d.origine) && d.recueLe.startsWith(month)).length;
      const reac = all.filter(d => d.statut === 'a_reactualiser').length;
      const sub = A.S.profil === 'etab' ? 'Les demandes de votre établissement.' : 'Toutes les demandes, tous circuits. Les établissements ne voient que les leurs.';
      const fsel = (k, label, list) => `<select class="flt${ui[k] ? ' on' : ''}" data-ch="dfilt" data-k="${k}" aria-label="${label}">${A.opts(list, ui[k], label)}</select>`;

      return A.layout('demandes', `
        <div class="pagehead" style="margin-bottom:8px">
          <div><h1 style="margin-bottom:4px">Demandes d'intervention</h1><p class="muted" style="margin:0">${sub}</p></div>
          <div class="row">
            <button class="btn" data-act="export">Exporter Excel</button>
            <button class="btn" data-act="printSel" ${ui.sel.length ? '' : 'disabled'}>Imprimer les fiches sélectionnées${ui.sel.length ? ` (${ui.sel.length})` : ''}</button>
          </div>
        </div>
        <nav class="tabs" aria-label="Files">
          ${TABS.map(t => { const n = all.filter(t[2]).length; return `<button class="tab${ui.tab === t[0] ? ' on' : ''}" data-act="dtab" data-v="${t[0]}">${t[1]} ${t[0] === 'cloturees' ? '' : `<b${t[0] === 'a_reactualiser' && n ? ' style="background:#F1EAFE;color:#6D28D9"' : ''}>${n}</b>`}</button>`; }).join('')}
        </nav>
        <div class="row" style="gap:8px;margin-bottom:16px">
          <label class="flt" style="width:280px;cursor:text">${A.ic.search()}<input id="dq" data-in="dq" value="${E(ui.q)}" placeholder="N°, logement, adresse…" style="border:0;outline:0;font:inherit;flex:1;min-width:0"></label>
          ${A.S.profil !== 'etab' ? fsel('etab', 'Établissement', etabs) : ''}
          ${fsel('dept', 'Département', [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }])}
          ${fsel('lot', 'Lot', Object.keys(A.S.ref.lots))}
          ${fsel('urgence', 'Urgence', A.S.ref.urgences.map(u => ({ v: u.k, l: u.l })))}
          ${fsel('circuit', 'Circuit', A.S.ref.circuits.map(c => ({ v: c.k, l: c.l })))}
          ${fsel('statut', 'Statut', Object.entries(A.STAT).map(([k, v]) => ({ v: k, l: v[0] })))}
          ${['etab', 'dept', 'lot', 'urgence', 'circuit', 'statut', 'q'].some(k => ui[k]) ? '<button class="linkbtn s13" data-act="dclear">Effacer les filtres</button>' : ''}
        </div>
        <div class="card tbl-wrap">
          <table class="t nowrap" style="min-width:1180px">
            <thead><tr><th></th><th>N° demande</th><th>Reçue le</th><th>Établissement</th><th>Logement · ville</th><th>Problèmes</th><th>Urgence</th><th>Circuit</th><th>Statut</th><th>Ancienneté</th><th>Photos</th><th></th></tr></thead>
            <tbody>
            ${shown.length ? shown.map(d => {
              const log = A.Log(d.logementId) || {};
              const [al, ah] = actionFor(d);
              const age = A.age(d);
              const reacSt = d.statut === 'a_reactualiser';
              const l0 = d.lignes[0] || {};
              return `<tr class="${reacSt ? '' : ''}" ${reacSt ? 'style="background:#FAF7FF"' : d.urgence === 'urgent' && !A.CLOSED.includes(d.statut) ? 'style="background:#FFFBFA"' : ''}>
                <td><input type="checkbox" data-ch="dsel" data-id="${d.id}" ${ui.sel.includes(d.id) ? 'checked' : ''} aria-label="Sélectionner ${d.id}"></td>
                <td><a href="#/demande/${d.id}"><strong>${d.id}</strong></a></td>
                <td>${A.fd(d.recueLe)}</td>
                <td>${E(log.etab || '')}${d.origine === 'occupant' ? '<small>déposée par l\'occupant</small>' : d.origine === 'mail' ? '<small>reçue par mail</small>' : d.origine === 'tel' ? '<small>reçue par téléphone</small>' : ''}</td>
                <td>${E(A.logShort(log))}<small>${E(log.ville || '')} (${E(log.dept || '')})</small></td>
                <td>${E(A.shortLot(l0.lot))} · ${E(l0.nature || '')}${d.lignes.length > 1 ? `<small>+${d.lignes.length - 1} ligne${d.lignes.length > 2 ? 's' : ''}</small>` : ''}</td>
                <td>${A.urgChip(d.urgence)}</td>
                <td class="${A.circuitOf(d) ? '' : 'muted'}">${E(A.circuitOf(d) || 'à définir')}</td>
                <td>${A.statChip(d)}${d.statut === 'a_completer' && d.motifRenvoi ? `<small>${E(d.motifRenvoi.toLowerCase())}</small>` : ''}${reacSt ? `<small>rejet auto le ${A.fd(A.addDays(d.recueLe, 80))}</small>` : ''}</td>
                <td ${age > 60 && !A.CLOSED.includes(d.statut) ? 'style="color:#6D28D9;font-weight:700"' : ''}>${A.CLOSED.includes(d.statut) ? '<span class="muted">—</span>' : age + ' j'}</td>
                <td>${A.nbPhotos(d)}</td>
                <td><a href="${ah}">${al}</a></td>
              </tr>`;
            }).join('') : `<tr><td colspan="12" class="empty">Aucune demande ne correspond à ces critères.</td></tr>`}
            </tbody>
          </table>
          <div class="row between" style="padding:12px 16px;font-size:13px">
            <span class="muted">${shown.length} demande${shown.length > 1 ? 's' : ''} affichée${shown.length > 1 ? 's' : ''} sur ${rows.length}</span>
            <div class="row" style="gap:6px">
              <button class="btn btn-sm" data-act="dpage" data-v="-1" ${ui.page ? '' : 'disabled'}>Précédent</button>
              <span class="muted">${ui.page + 1} / ${pages}</span>
              <button class="btn btn-sm" data-act="dpage" data-v="1" ${ui.page < pages - 1 ? '' : 'disabled'}>Suivant</button>
            </div>
          </div>
        </div>
        <div class="row" style="margin-top:16px;gap:16px;font-size:13px;align-items:stretch">
          <div class="card pad-s row" style="flex:1 1 300px;flex-wrap:nowrap"><span class="chip rx">${reac}</span><span>demande${reac > 1 ? 's' : ''} de plus de 2 mois : le demandeur a 15 jours pour les réactualiser, sinon rejet automatique.</span></div>
          <div class="card pad-s row" style="flex:1 1 300px;flex-wrap:nowrap"><span class="chip h48">${horsProc}</span><span>demande${horsProc > 1 ? 's' : ''} reçue${horsProc > 1 ? 's' : ''} hors procédure ce mois-ci (mail, téléphone), saisie${horsProc > 1 ? 's' : ''} par la coordination.</span></div>
        </div>`);
    },
    acts: {
      dtab(el) { A.ui.dem.tab = el.dataset.v; A.ui.dem.page = 0; A.render(); },
      dq(el) { A.ui.dem.q = el.value; A.ui.dem.page = 0; A.render(); },
      dfilt(el) { A.ui.dem[el.dataset.k] = el.value; A.ui.dem.page = 0; A.render(); },
      dclear() { Object.assign(A.ui.dem, { q: '', etab: '', dept: '', lot: '', urgence: '', circuit: '', statut: '', page: 0 }); A.render(); },
      dpage(el) { A.ui.dem.page += Number(el.dataset.v); A.render(); },
      dsel(el) { const s = A.ui.dem.sel; const i = s.indexOf(el.dataset.id); if (el.checked && i < 0) s.push(el.dataset.id); if (!el.checked && i >= 0) s.splice(i, 1); A.render(); },
      printSel() { if (A.ui.dem.sel.length) A.go('#/fiche/' + A.ui.dem.sel.join(',')); },
      export() {
        const rows = filtered();
        const data = [['N° demande', 'Reçue le', 'Établissement', 'Logement', 'Ville', 'Ligne', 'Pièce', 'Lot', 'Nature', 'Description', 'Urgence', 'Circuit', 'Imputation', 'Statut', 'Ancienneté (j)']];
        rows.forEach(d => { const log = A.Log(d.logementId) || {}; d.lignes.forEach((l, i) => data.push([d.id, A.fdy(d.recueLe), log.etab, log.id, log.ville, i + 1, l.piece, l.lot, l.nature, l.description, (A.URG[d.urgence] || [''])[0], A.circuitLabel(l.circuit), l.imputation, A.STAT[d.statut][0], A.age(d)])); });
        A.download(`demandes_${A.TODAY}.csv`, A.csv(data));
        A.toast(`${rows.length} demandes exportées (CSV lisible par Excel)`, 'ok');
      },
    },
  };

  /* =====================================================================
     2. Fiche de nouvelle demande
     ===================================================================== */
  const emptyLine = () => ({ piece: '', lot: '', nature: '', description: '', photos: [], extra: {} });
  const newDraft = (logId, constatId) => {
    const p = A.profil(); const log = A.Log(logId);
    return {
      auteur: p.nom, fonction: p.fonction, tel: '', logementId: logId || '', urgence: '', dateSouhaitee: '',
      acces: log ? log.acces : '', numCles: log ? log.cles : '', lieuCles: A.S.ref.cles[0],
      facturation: 'Non', sinistre: 'Non', sinistreInfo: { nature: '', date: '', fuite: '', tiers: '', constat: '' },
      observations: '', lignes: [emptyLine()], canal: A.S.profil === 'coord' ? 'Mail' : '', constatId: constatId || '', savedAt: A.now(),
    };
  };
  const check = dr => {
    const items = [];
    const log = A.Log(dr.logementId);
    items.push([log ? 'ok' : 'wa', log ? 'Logement sélectionné' : 'Logement à sélectionner']);
    items.push([dr.urgence ? 'ok' : 'wa', dr.urgence ? 'Urgence renseignée' : "Niveau d'urgence à choisir"]);
    const complete = dr.lignes.filter(l => l.piece && l.lot && l.nature && l.description.trim());
    items.push([complete.length === dr.lignes.length && complete.length ? 'ok' : 'wa', complete.length === dr.lignes.length ? `${complete.length} problème${complete.length > 1 ? 's' : ''} décrit${complete.length > 1 ? 's' : ''}` : `${dr.lignes.length - complete.length} ligne(s) incomplète(s)`]);
    dr.lignes.forEach((l, i) => { if (!l.photos.length) items.push(['wa', `Ligne ${i + 1} : photo manquante`]); });
    if (dr.sinistre === 'Oui') items.push([dr.sinistreInfo.nature ? 'ok' : 'wa', dr.sinistreInfo.nature ? 'Sinistre décrit' : 'Nature du sinistre à préciser']);
    items.push(['na', dr.facturation === 'Oui' ? 'Validation hiérarchique : requise (refacturation)' : 'Validation hiérarchique : non requise']);
    return { items, ok: items.every(i => i[0] !== 'wa') };
  };
  const lineStatus = l => {
    if (!(l.piece && l.lot && l.nature && l.description.trim())) return A.chip('À compléter', 'gr');
    if (!l.photos.length) return A.chip('Photo manquante', 'h48');
    return A.chip('Complète', 'ok');
  };

  const lineHtml = (l, i, dr, log) => {
    const pp = A.piecesFor(log);
    const natures = l.lot ? A.S.ref.lots[l.lot] || [] : [];
    const ok = l.piece && l.lot && l.nature && l.description.trim() && l.photos.length;
    const extraDem = l.lot === 'Déménagement / transfert' ? `
      <div class="grid-auto" style="--min:200px;margin-top:12px;padding:12px;background:#F9FAFB;border-radius:8px">
        <div><span class="lbl">Logement d'arrivée</span><select class="in" id="lx${i}a" data-ch="dlx" data-i="${i}" data-k="arrivee">${A.opts(A.S.logements.map(x => ({ v: x.id, l: `${x.id} · ${x.ville}` })), l.extra.arrivee, '—')}</select></div>
        <div><span class="lbl">Date et plage horaire</span><input class="in" id="lx${i}b" data-in="dlx" data-i="${i}" data-k="plage" value="${E(l.extra.plage || '')}" placeholder="ex. 12/11 matin"></div>
        <div><span class="lbl">Volume</span><select class="in" id="lx${i}c" data-ch="dlx" data-i="${i}" data-k="volume">${A.opts(['Quelques meubles', 'Studio', 'T2', 'T3', 'T4'], l.extra.volume, '—')}</select></div>
        <div><span class="lbl">Étages et ascenseur</span><input class="in" id="lx${i}d" data-in="dlx" data-i="${i}" data-k="etages" value="${E(l.extra.etages || '')}" placeholder="départ / arrivée"></div>
        <div><span class="lbl">Besoins</span><input class="in" id="lx${i}e" data-in="dlx" data-i="${i}" data-k="besoins" value="${E(l.extra.besoins || '')}" placeholder="cartons, véhicule, 2e ouvrier"></div>
        <div><span class="lbl">Présence du ménage le jour J</span><select class="in" id="lx${i}f" data-ch="dlx" data-i="${i}" data-k="presence">${A.opts(['Oui', 'Non', 'Ne sait pas'], l.extra.presence, '—')}</select></div>
      </div>` : '';
    return `<div class="line" style="${ok ? '' : 'border:2px solid #F2A5A5;background:#FFFBFB'}">
      <div class="row between" style="margin-bottom:12px">
        <strong style="font-size:14px">Ligne ${i + 1}</strong>
        <div class="row" style="gap:8px">${lineStatus(l)}${dr.lignes.length > 1 ? `<button class="linkbtn small" data-act="ddelline" data-i="${i}">Supprimer</button>` : ''}</div>
      </div>
      <div class="grid-auto" style="--min:200px">
        <div><label class="lbl" for="lp${i}">Pièce</label><select class="in${l.piece ? "" : " miss"}" id="lp${i}" data-ch="dl" data-i="${i}" data-k="piece">
          <option value="">Choisir…</option>
          <optgroup label="Pièces du logement${log ? ' · ' + E(log.typo) : ''}">${A.opts(pp.pieces, l.piece)}</optgroup>
          <optgroup label="Autres">${A.opts(pp.autres, l.piece)}</optgroup></select></div>
        <div><label class="lbl" for="ll${i}">Lot de travaux</label><select class="in${l.lot ? "" : " miss"}" id="ll${i}" data-ch="dl" data-i="${i}" data-k="lot">${A.opts(Object.keys(A.S.ref.lots), l.lot, 'Choisir…')}</select></div>
        <div><label class="lbl" for="ln${i}">Nature</label><select class="in${l.nature ? "" : " miss"}" id="ln${i}" data-ch="dl" data-i="${i}" data-k="nature" ${l.lot ? '' : 'disabled'}>${A.opts(natures, l.nature, l.lot ? 'Choisir…' : "Choisir d'abord le lot")}</select></div>
      </div>
      <div style="margin-top:12px"><label class="lbl" for="lt${i}">Description${l.lot && l.lot.startsWith('Autre') ? ' (obligatoire)' : ''}</label><textarea class="in${l.description.trim() ? "" : " miss"}" id="lt${i}" rows="2" style="min-height:56px" data-in="dl" data-i="${i}" data-k="description" placeholder="Ce que l'on constate, depuis quand, ce qui a déjà été fait">${E(l.description)}</textarea></div>
      ${extraDem}
      <div style="margin-top:12px">
        <span class="lbl">Photos (${l.photos.length})</span>
        <div class="row" style="gap:10px">
          ${l.photos.map((p, j) => A.photo(p, 96, 72, { del: 'ddelph', data: `data-i="${i}" data-j="${j}"` })).join('')}
          ${l.photos.length ? A.addPhoto('dphoto', `data-i="${i}"`) : A.addPhoto('dphoto', `data-i="${i}"`, 'Prendre ou ajouter une photo (obligatoire)', 320, 72, true)}
        </div>
      </div>
    </div>`;
  };

  A.V.nouvelle = {
    render(p, q) {
      const S = A.S;
      if (q.log && (!S.draft || S.draft.logementId !== q.log)) { S.draft = newDraft(q.log, q.constat); A.save(); }
      if (!S.draft) { S.draft = newDraft(); A.save(); }
      const dr = S.draft;
      const log = A.Log(dr.logementId);
      const ck = check(dr);
      const villes = [...new Set(S.logements.map(l => l.ville))].sort();
      const segU = A.S.ref.urgences.map(u => `<button type="button" class="${dr.urgence === u.k ? { urgent: 'on-u', h48: 'on-h', prog: 'on-p' }[u.k] : ''}" data-act="dseg" data-k="urgence" data-v="${u.k}">${u.l}</button>`).join('');
      const urgDesc = (A.S.ref.urgences.find(u => u.k === dr.urgence) || { d: 'Urgent : sécurité, fuite active, porte bloquée, panne générale.' }).d;
      const si = dr.sinistreInfo;
      const constat = dr.constatId && A.Ce(dr.constatId);

      return A.layout('', `
        <div class="pagehead">
          <div><div class="crumb"><a href="#/demandes">Demandes</a> › Nouvelle demande</div><h1>Fiche de demande d'intervention</h1></div>
          <div class="row" style="gap:10px">${A.chip('Brouillon', 'gr')}<span class="muted s13">N° attribué à l'envoi · enregistré automatiquement à ${A.ftime(dr.savedAt)}</span></div>
        </div>
        ${constat ? `<div class="note info" style="margin-bottom:16px">${A.ic.info()}<span>Demande créée depuis le constat <strong>${constat.id}</strong> du ${A.fd(constat.date)} (${E(constat.signalements.join(', ') || 'sans signalement')}).</span></div>` : ''}
        <div class="cols">
          <div class="col-main">
            <section class="card pad">
              <div class="sec-h"><span class="step">1</span><h2 class="h2">Auteur et logement concerné</h2></div>
              <div class="grid-auto" style="--min:190px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #EEF0F3">
                <div><span class="lbl">Auteur de la demande</span><input class="in" id="fa" data-in="df" data-k="auteur" value="${E(dr.auteur)}"></div>
                <div><label class="lbl" for="ff">Fonction</label><select class="in" id="ff" data-ch="df" data-k="fonction">${A.opts(S.ref.fonctions, dr.fonction)}</select></div>
                <div><span class="lbl">Service</span><div class="in ro">${E(log ? log.etab : A.profil().etab || '—')}</div></div>
                <div><label class="lbl" for="ft">Téléphone</label><input class="in" id="ft" type="tel" data-in="df" data-k="tel" value="${E(dr.tel)}" placeholder="06 ·· ·· ·· ··"></div>
                ${A.S.profil === 'coord' ? `<div><label class="lbl" for="fc">Reçue par</label><select class="in" id="fc" data-ch="df" data-k="canal">${A.opts(['Fiche (saisie directe)', 'Mail', 'Téléphone'], dr.canal)}</select></div>` : ''}
              </div>
              <label class="lbl" for="flog">Logement ou bureau</label>
              <select class="in${log ? "" : " miss"}" id="flog" data-ch="dlog">
                <option value="">Rechercher par n°, adresse ou ville…</option>
                ${villes.map(v => `<optgroup label="${E(v)}">${S.logements.filter(l => l.ville === v && (A.S.profil !== 'etab' || l.etab === A.profil().etab || l.typo === 'BUR')).map(l => `<option value="${l.id}"${l.id === dr.logementId ? ' selected' : ''}>${E(A.logLabel(l))}</option>`).join('')}</optgroup>`).join('')}
              </select>
              ${log ? `<div class="grid-auto" style="--min:190px;margin-top:14px">
                <div><span class="lbl">Établissement</span><div class="in ro">${E(log.etab)}</div></div>
                <div><span class="lbl">Code section</span><div class="in ro">${E(log.section)}</div></div>
                <div><span class="lbl">Typologie</span><div class="in ro">${E(log.typo === 'BUR' ? 'Bureaux' : log.typo)} · ${E(log.etage)}</div></div>
                <div><span class="lbl">CGL</span><div class="in ro">${E(log.cgl)}</div></div>
                <div><span class="lbl">Dispositif</span><div class="in ro">${E(log.dispositif)}</div></div>
                <div><span class="lbl">Ménage (n° famille)</span><div class="in ro">${E(log.menage)}</div></div>
              </div>
              <p class="muted small" style="margin:10px 0 0">Champs remplis automatiquement depuis le référentiel logements. Logement introuvable ? Contacter la coordination.</p>` : ''}
            </section>

            <section class="card pad">
              <div class="sec-h"><span class="step">2</span><h2 class="h2">Intervention</h2></div>
              <div class="grid-auto" style="--min:300px;gap:16px">
                <div><span class="lbl">Niveau d'urgence</span><div class="seg${dr.urgence ? "" : " miss"}" role="group" aria-label="Niveau d'urgence">${segU}</div><p class="muted small" style="margin:6px 0 0">${E(urgDesc)}</p></div>
                <div><label class="lbl" for="fdate">Date d'intervention souhaitée</label><input class="in" type="date" id="fdate" data-ch="df" data-k="dateSouhaitee" value="${E(dr.dateSouhaitee)}" min="${A.TODAY}"><p class="muted small" style="margin:6px 0 0">Facultatif</p></div>
                <div><label class="lbl" for="facc">Précisions d'accès</label><input class="in" id="facc" data-in="df" data-k="acces" value="${E(dr.acces)}" placeholder="Bâtiment, étage, porte, code"></div>
                <div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px">
                  <div><label class="lbl" for="fcl">N° de clés</label><input class="in" id="fcl" data-in="df" data-k="numCles" value="${E(dr.numCles)}"></div>
                  <div><label class="lbl" for="flc">Mise à disposition des clés</label><select class="in" id="flc" data-ch="df" data-k="lieuCles">${A.opts(S.ref.cles, dr.lieuCles)}</select></div>
                </div>
                <div><span class="lbl">Facturation à l'usager pressentie</span>${A.seg('dseg', ['Oui', 'Non', 'Ne sait pas'], dr.facturation, 'data-k="facturation"')}<p class="muted small" style="margin:6px 0 0">Décision finale par la coordination.</p></div>
                <div><span class="lbl">Sinistre à déclarer à une assurance ?</span>${A.seg('dseg', ['Oui', 'Non', 'Ne sait pas'], dr.sinistre, 'data-k="sinistre"')}<p class="muted small" style="margin:6px 0 0">Dégât des eaux (y compris venant d'un voisin ou des parties communes), incendie, effraction, bris de glace.</p></div>
                <div style="grid-column:1/-1"><label class="lbl" for="fobs">Observations</label><textarea class="in" id="fobs" data-in="df" data-k="observations" placeholder="Présence de l'occupant, contraintes horaires…">${E(dr.observations)}</textarea></div>
              </div>
              ${dr.sinistre === 'Oui' ? `<div style="margin-top:16px;padding:14px;border-radius:8px;background:#FAF7FF;border:1px solid #DCCCF9">
                <strong class="s13" style="color:#6D28D9">Sinistre / assurance — informations complémentaires</strong>
                <div class="grid-auto" style="--min:220px;margin-top:10px">
                  <div><span class="lbl">Nature du sinistre</span><select class="in${si.nature ? "" : " miss"}" id="fsn" data-ch="dsin" data-k="nature">${A.opts(S.ref.natSinistre, si.nature, 'Choisir…')}</select></div>
                  <div><span class="lbl">Date de survenance</span><input class="in" type="date" id="fsd" data-ch="dsin" data-k="date" value="${E(si.date)}" max="${A.TODAY}"></div>
                  <div><span class="lbl">Fuite stoppée</span><select class="in" id="fsf" data-ch="dsin" data-k="fuite">${A.opts(['Oui', 'Non', 'Sans objet'], si.fuite, '—')}</select></div>
                  <div><span class="lbl">Tiers concerné</span><select class="in" id="fst" data-ch="dsin" data-k="tiers">${A.opts(['Aucun', 'Voisin', 'Syndic', 'Bailleur'], si.tiers, '—')}</select></div>
                  <div><span class="lbl">Constat amiable rempli</span><select class="in" id="fsc" data-ch="dsin" data-k="constat">${A.opts(['Oui (photo jointe)', 'Non'], si.constat, '—')}</select></div>
                </div></div>` : ''}
            </section>

            <section class="card pad">
              <div class="sec-h"><span class="step">3</span><h2 class="h2">Problèmes à traiter</h2><span class="muted s13">une ligne par problème · photo obligatoire</span></div>
              ${dr.lignes.map((l, i) => lineHtml(l, i, dr, log)).join('')}
              <button class="btn btn-w btn-dash" data-act="daddline">+ Ajouter un problème</button>
            </section>
          </div>

          <aside class="col-side" style="position:sticky;top:80px">
            <div class="card pad">
              <h2 class="h2" style="margin-bottom:14px">Avant envoi</h2>
              <ul class="checklist">${ck.items.map(([k, t]) => `<li><span class="ck-${k}">${k === 'ok' ? '✓' : k === 'wa' ? '!' : '–'}</span>${E(t)}</li>`).join('')}</ul>
              <button class="btn btnp btn-w" style="margin-top:18px" data-act="dsend" ${ck.ok ? '' : 'disabled'}>Envoyer la demande</button>
              <button class="btn btn-w" style="margin-top:10px" data-act="dsave">Enregistrer le brouillon</button>
              <button class="linkbtn small" style="margin-top:12px" data-act="ddiscard">Abandonner ce brouillon</button>
            </div>
            <div class="card pad s13" style="line-height:1.5">
              <h2 class="h2" style="font-size:14px;margin-bottom:8px">Après l'envoi</h2>
              <p style="margin:0 0 6px">Accusé de réception par mail avec le n° de demande.</p>
              <p style="margin:0 0 6px">Photos classées automatiquement dans le dossier du logement.</p>
              <p style="margin:0">Suivi du statut dans l'onglet <a href="#/demandes">Demandes</a>.</p>
            </div>
          </aside>
        </div>`);
    },
    acts: {
      df(el) { const dr = A.S.draft; dr[el.dataset.k] = el.value; dr.savedAt = A.now(); A.save(); if (el.tagName === 'SELECT' || el.type === 'date') A.render(); },
      dlog(el) {
        const dr = A.S.draft; dr.logementId = el.value; const log = A.Log(el.value);
        if (log) { dr.acces = log.acces || dr.acces; dr.numCles = log.cles !== '—' ? log.cles : ''; }
        const pp = A.piecesFor(log); dr.lignes.forEach(l => { if (l.piece && ![...pp.pieces, ...pp.autres].includes(l.piece)) l.piece = ''; });
        A.save(); A.render();
      },
      dseg(el) { A.S.draft[el.dataset.k] = el.dataset.v; A.save(); A.render(); },
      dsin(el) { A.S.draft.sinistreInfo[el.dataset.k] = el.value; A.save(); A.render(); },
      dl(el) {
        const l = A.S.draft.lignes[+el.dataset.i]; const k = el.dataset.k;
        l[k] = el.value;
        if (k === 'lot') { l.nature = ''; if (l.lot === 'Sinistre / assurance') A.S.draft.sinistre = 'Oui'; }
        A.S.draft.savedAt = A.now(); A.save(); A.render();
      },
      dlx(el) { A.S.draft.lignes[+el.dataset.i].extra[el.dataset.k] = el.value; A.save(); if (el.tagName === 'SELECT') A.render(); },
      dphoto(el) {
        const i = +el.dataset.i;
        A.readPhotos(el.files).then(ph => { A.S.draft.lignes[i].photos.push(...ph); A.saveNow(); A.render(); }).catch(() => A.toast('Photo illisible', 'err'));
      },
      ddelph(el) { A.S.draft.lignes[+el.dataset.i].photos.splice(+el.dataset.j, 1); A.save(); A.render(); },
      daddline() { A.S.draft.lignes.push(emptyLine()); A.save(); A.render(); },
      ddelline(el) { A.S.draft.lignes.splice(+el.dataset.i, 1); A.save(); A.render(); },
      dsave() { A.S.draft.savedAt = A.now(); A.saveNow(); A.toast('Brouillon enregistré', 'ok'); A.render(); },
      ddiscard() {
        A.modal({ title: 'Abandonner le brouillon', danger: true, okLabel: 'Abandonner', body: '<p style="margin:0">Les informations et photos saisies seront perdues.</p>', onOk() { A.S.draft = null; A.saveNow(); A.go('#/demandes'); } });
      },
      dsend() {
        const dr = A.S.draft; if (!check(dr).ok) return;
        const log = A.Log(dr.logementId);
        const origine = dr.canal === 'Mail' ? 'mail' : dr.canal === 'Téléphone' ? 'tel' : 'etab';
        const d = {
          id: A.nextId('di'), recueLe: A.now(), logementId: dr.logementId, origine, auteur: dr.auteur, fonction: dr.fonction, tel: dr.tel,
          urgence: dr.urgence, dateSouhaitee: dr.dateSouhaitee, acces: dr.acces, numCles: dr.numCles, lieuCles: dr.lieuCles,
          facturation: dr.facturation, sinistre: dr.sinistre, sinistreInfo: dr.sinistre === 'Oui' ? dr.sinistreInfo : null,
          observations: dr.observations, message: '', consommables: [], historique: [], statut: 'a_qualifier', ft: '', constatId: dr.constatId || '',
          lignes: dr.lignes.map(l => ({
            piece: l.piece, lot: l.lot, nature: l.nature, description: l.description, photos: l.photos, extra: l.extra,
            imputation: dr.facturation === 'Oui' ? 'Usager (refacturation)' : 'Equalis',
            circuit: l.lot === 'Sinistre / assurance' ? 'sinistre' : '', duree: 60, urgence: '', statut: '',
          })),
        };
        A.hist(d, origine === 'etab' ? `Demande créée par ${dr.auteur}` : `Saisie par la coordination (${dr.canal.toLowerCase()})`);
        const nph = A.nbPhotos(d);
        if (nph) A.hist(d, `${nph} photo${nph > 1 ? 's' : ''} classée${nph > 1 ? 's' : ''} dans ${log.dept} › ${log.ville} › ${log.id}`);
        A.hist(d, 'Accusé de réception envoyé au demandeur');
        if (d.constatId) { const c = A.Ce(d.constatId); if (c) { c.demandeId = d.id; c.suite = 'demande'; } }
        A.S.demandes.unshift(d);
        A.S.draft = null;
        A.saveNow();
        A.toast(`Demande ${d.id} envoyée · accusé de réception envoyé`, 'ok');
        A.go('#/demande/' + d.id);
      },
    },
  };

  /* =====================================================================
     3. Fiche demande / qualification par la coordination
     ===================================================================== */
  const cur = () => A.D(A.cur.params[0]);

  const actionsBar = d => {
    if (A.S.profil === 'etab') {
      if (d.statut === 'a_completer') return `<button class="btn btnp" data-act="completee">J'ai complété la demande</button>`;
      if (d.statut === 'a_reactualiser') return `<button class="btn btnp" data-act="reactualisee">Confirmer : le besoin est toujours d'actualité</button>`;
      return d.ft ? `<a class="btn" href="#/fiche/${d.id}">Fiche imprimable</a>` : '';
    }
    const B = [];
    if (A.QUALIF.includes(d.statut)) {
      B.push(`<a class="btn" href="#/consultation/${d.id}" ${d.consultationId ? `data-act="goDevis"` : ''}>Consulter des entreprises</a>`);
      B.push(`<button class="btn" data-act="renvoyer">Renvoyer à l'établissement</button>`);
      B.push(`<button class="btn btnd" data-act="rejeter">Rejeter</button>`);
      B.push(`<button class="btn btnp" data-act="valider">${d.statut === 'a_valider_occupant' ? 'Valider la demande occupant' : 'Valider et planifier'}</button>`);
    }
    if (d.statut === 'a_completer') { B.push(`<button class="btn" data-act="completee">Marquer comme complétée</button>`, `<button class="btn btnd" data-act="rejeter">Rejeter</button>`); }
    if (d.statut === 'a_reactualiser') { B.push(`<button class="btn" data-act="relancer">Relancer le demandeur</button>`, `<button class="btn" data-act="reactualisee">Réactualisée</button>`, `<button class="btn btnd" data-act="rejeter">Rejeter</button>`); }
    if (['a_planifier', 'acces_impossible'].includes(d.statut)) B.push(`<a class="btn" href="#/fiche/${d.id}">Fiche imprimable</a>`, `<a class="btn btnp" href="#/planning?sel=${d.id}">${d.statut === 'acces_impossible' ? 'Reprogrammer' : 'Planifier'}</a>`);
    if (['planifiee', 'en_cours'].includes(d.statut)) B.push(`<a class="btn" href="#/fiche/${d.id}">Fiche imprimable</a>`, `<a class="btn" href="#/planning?sel=${d.id}&w=${(A.nextRdv(d) || {}).date || ''}">Voir au planning</a>`);
    if (d.statut === 'realisee') B.push(`<a class="btn" href="#/fiche/${d.id}">Rapport</a>`, `<button class="btn btnp" data-act="cloturer">Réceptionner et clôturer</button>`);
    if (d.statut === 'consultation' || (d.statut === 'prestataire' && d.consultationId)) B.push(`<a class="btn btnp" href="#/devis/${d.consultationId}">Devis et décision</a>`);
    if (d.statut === 'prestataire') B.push(`<button class="btn btnp" data-act="presteFait">Intervention du prestataire réalisée</button>`);
    if (d.statut === 'prestataire' && !d.consultationId) B.unshift(`<a class="btn" href="#/consultation/${d.id}">Consulter des entreprises</a>`);
    if (d.statut === 'bailleur') B.push(`<button class="btn" data-act="relancerBailleur">Relancer le bailleur</button>`, `<button class="btn btnp" data-act="bailleurFait">Travaux faits par le bailleur</button>`);
    if (d.statut === 'sinistre') B.push(`<button class="btn" data-act="declaration">Déclaration envoyée à l'assureur</button>`, `<button class="btn btnp" data-act="sinistreTravaux">Passer en travaux ST</button>`);
    if (d.statut === 'cloturee') B.push(`<a class="btn" href="#/fiche/${d.id}">Rapport</a>`);
    return B.join('');
  };

  const lineQualif = (d, l, i, edit) => {
    const ph = (l.photos || []).map(p => A.photo(p, 64, 48)).join('');
    const apres = (l.photosApres || []).length ? `<div class="row" style="gap:6px;margin-top:6px"><span class="muted small">Après :</span>${l.photosApres.map(p => A.photo(p, 64, 48)).join('')}</div>` : '';
    const circ = A.S.ref.circuits.find(c => c.k === l.circuit);
    const head = `<div class="row between" style="align-items:flex-start;margin-bottom:${edit ? 12 : 0}px;flex-wrap:nowrap">
        <div><strong class="s13">${i + 1} · ${E(A.lineLabel(l))}</strong><p class="muted s13" style="margin:4px 0 0">${E(l.description)}</p>
          ${l.extra && Object.keys(l.extra).length ? `<p class="small muted" style="margin:4px 0 0">${Object.entries(l.extra).filter(([, v]) => v).map(([k, v]) => `${E(k)} : ${E(v)}`).join(' · ')}</p>` : ''}
          ${!edit ? `<div class="row" style="gap:6px;margin-top:8px">${l.circuit ? A.chip(A.circuitLabel(l.circuit), 'gr') : ''}${l.imputation ? A.chip(l.imputation, l.imputation.startsWith('Usager') ? 'h48' : 'gr') : ''}${l.circuit === 'ST' ? A.chip(A.fdur(l.duree), 'gr') : ''}${l.statut === 'realisee' ? A.chip('Réalisée', 'ok') : l.statut === 'partielle' ? A.chip('Partielle', 'h48') : l.statut === 'non_realisee' ? A.chip('Non réalisée', 'u') : ''}</div>` : ''}
          ${apres}
        </div>
        <div class="row" style="gap:6px;flex-wrap:nowrap">${ph}${d.statut === 'a_completer' ? A.addPhoto('qphoto', `data-i="${i}"`, '+', 48, 48) : ''}</div>
      </div>`;
    if (!edit) return `<div class="line" style="padding:14px">${head}</div>`;
    return `<div class="line" style="padding:14px">${head}
      <div class="grid-auto" style="--min:170px">
        <div><span class="lbl">Imputation</span><select class="in sm" id="qi${i}" data-ch="lq" data-i="${i}" data-k="imputation">${A.opts(A.S.ref.imputations, l.imputation)}</select></div>
        <div><span class="lbl">Circuit</span><select class="in sm" id="qc${i}" data-ch="lq" data-i="${i}" data-k="circuit">${A.opts(A.S.ref.circuits.map(c => ({ v: c.k, l: c.l })), l.circuit, 'Choisir…')}</select>${circ ? `<div class="muted small" style="margin-top:4px">${E(circ.d)}</div>` : ''}</div>
        <div><span class="lbl">Durée estimée</span><div class="stepper"><button type="button" data-act="ldur" data-i="${i}" data-v="-30" aria-label="Moins 30 minutes">−</button><strong>${A.fdur(l.duree)}</strong><button type="button" data-act="ldur" data-i="${i}" data-v="30" aria-label="Plus 30 minutes">+</button></div></div>
        <div><span class="lbl">Urgence retenue</span><select class="in sm" id="qu${i}" data-ch="lq" data-i="${i}" data-k="urgence">${A.opts(A.S.ref.urgences.map(u => ({ v: u.k, l: u.l })), l.urgence || d.urgence)}</select></div>
      </div></div>`;
  };

  A.V.qualif = {
    render([id]) {
      const d = A.D(id);
      if (!d) return A.layout('demandes', `<div class="card pad empty">Demande ${E(id)} introuvable. <a href="#/demandes">Retour aux demandes</a></div>`);
      if (d.statut === 'a_qualifier' && A.S.profil !== 'etab') { d.statut = 'en_qualification'; A.hist(d, 'Prise en charge par la coordination'); A.save(); }
      const log = A.Log(d.logementId) || {};
      const edit = A.QUALIF.includes(d.statut) && A.S.profil !== 'etab';
      const totalST = d.lignes.filter(l => l.circuit === 'ST').reduce((s, l) => s + l.duree, 0);
      const rdvs = A.S.rdvs.filter(r => r.demandeId === d.id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut));
      const lastC = A.S.constats.filter(c => c.logementId === log.id).sort((a, b) => b.date.localeCompare(a.date))[0];
      const autres = A.S.demandes.filter(x => x.logementId === log.id && x.id !== d.id);
      const ouvertes = autres.filter(x => !A.CLOSED.includes(x.statut));
      const n12 = autres.filter(x => A.diffDays(x.recueLe, A.TODAY) <= 365).length;
      const rapports = rdvs.filter(r => r.rapport);
      const age = A.age(d);

      return A.layout('demandes', `
        <div class="crumb"><a href="#/demandes">Demandes</a> › ${d.id}</div>
        <div class="pagehead">
          <div class="t"><h1>${d.id}</h1>${A.urgChip(d.urgence)}${A.statChip(d)}${d.ft ? A.chip(d.ft, 'gr') : ''}
            <span class="muted s13">reçue le ${A.fd(d.recueLe)} à ${A.ftime(d.recueLe)} · ${age ? `il y a ${age} jour${age > 1 ? 's' : ''}` : "aujourd'hui"}</span></div>
          <div class="row" style="gap:8px">${actionsBar(d)}</div>
        </div>
        ${d.statut === 'a_completer' ? `<div class="note warn" style="margin-bottom:16px"><strong>Renvoyée pour complément :</strong> ${E(d.motifRenvoi || '')}${d.msgRenvoi ? ' — « ' + E(d.msgRenvoi) + ' »' : ''}. Ajoutez les photos ou précisions demandées.</div>` : ''}
        ${d.statut === 'a_reactualiser' ? `<div class="note" style="margin-bottom:16px;background:#FAF7FF;border-color:#DCCCF9">Demande de plus de 2 mois sans intervention. Sans réactualisation avant le <strong>${A.fd(A.addDays(d.recueLe, 80))}</strong>, elle sera rejetée automatiquement (motif « Non réactualisée »).</div>` : ''}
        ${d.statut === 'rejetee' ? `<div class="note" style="margin-bottom:16px">Rejetée : ${E(d.motifRejet || '')}</div>` : ''}
        <div class="cols">
          <div class="col-main">
            <section class="card pad">
              <h2 class="h2" style="margin-bottom:14px">Demande</h2>
              <div class="grid-auto" style="--min:320px;gap:16px">
                ${A.kv([['Demandeur', `${E(d.auteur)}, ${E(d.fonction.toLowerCase())}`], ['Téléphone', E(d.tel || '—')], ['Établissement', `${E(log.etab)} · ${E(log.section)}`], ['Facturation pressentie', E(d.facturation)], ['Sinistre', E(d.sinistre) + (d.sinistreInfo ? ` · ${E(d.sinistreInfo.nature)}` : '')], ['Date souhaitée', d.dateSouhaitee ? A.fday(d.dateSouhaitee) : '—']])}
                ${A.kv([['Logement', `<a href="#/logement/${log.id}">${log.id}</a> · ${E(log.typo)} · ${E(log.ville)} (${E(log.dept)})`], ['Adresse', E(A.logAdr(log))], ['Accès', E(d.acces || log.acces || '—')], ['Clés', `${E(d.numCles || '—')} · ${E((d.lieuCles || '').toLowerCase())}`], ['Observations', E(d.observations || '—')]])}
              </div>
            </section>
            <section class="card pad">
              <div class="row between" style="margin-bottom:14px"><h2 class="h2">${edit ? 'Qualification par ligne' : 'Travaux demandés'}</h2>${totalST ? `<span class="muted s13">Durée totale estimée (ST) : <strong>${A.fdur(totalST)}</strong></span>` : ''}</div>
              ${d.lignes.map((l, i) => lineQualif(d, l, i, edit)).join('')}
            </section>
            ${edit ? `<section class="card pad"><h2 class="h2" style="margin-bottom:10px">Message à l'établissement</h2>
              <textarea class="in" id="qmsg" data-in="qmsg" placeholder="Facultatif : visible par le demandeur avec le statut">${E(d.message || '')}</textarea></section>` : ''}
            ${rapports.map(r => {
              const rp = r.rapport; const o = A.Ouv(r.ouvrierId);
              return `<section class="card pad"><div class="row between" style="margin-bottom:12px"><h2 class="h2">Rapport d'intervention · ${A.fd(r.date)}</h2><a href="#/fiche/${d.id}">Voir le rapport PDF</a></div>
                ${A.kv([['Ouvrier', E(o.nom)], ['Horaires', `${A.ftime(r.debutReel) || r.debut} – ${A.ftime(r.finReel) || ''}`], ['Temps passé', A.fdur(rp.tempsMin)], ['Consommables', E(rp.conso.map(c => `${c.nom} × ${c.qte}`).join(', ') || '—')], ['Travaux ajoutés', E((rp.supps || []).map(s => `${s.piece} · ${s.nature} (${s.suiteLabel})`).join(', ') || '—')], ['Observations', E(rp.obs || '—')], ['Signature', rp.signature ? `<img src="${rp.signature}" alt="Signature" style="height:40px">` : E(rp.signataire || '—')]])}
              </section>`;
            }).join('')}
          </div>
          <aside class="col-side">
            ${rdvs.length ? `<div class="card pad"><h2 class="h2" style="margin-bottom:12px">Planification</h2>
              ${rdvs.map(r => `<div class="row between s13" style="padding:6px 0;border-bottom:1px solid #EEF0F3"><span>${A.fday(r.date)} · ${r.debut} · ${E(A.Ouv(r.ouvrierId).nom)}</span>${A.chip({ done: 'Réalisée', running: 'En cours', planned: 'Prévue', imp: 'Accès impossible' }[r.etat], { done: 'ok', running: 'ok', planned: 'pg', imp: 'u' }[r.etat])}</div>`).join('')}
            </div>` : ''}
            <div class="card pad"><h2 class="h2" style="margin-bottom:12px">Historique</h2>
              <ol class="hist">${d.historique.map(h => `<li><span></span><div>${E(h.t)}<div class="muted small">${A.fdt(h.at)}</div></div></li>`).join('')}</ol>
            </div>
            <div class="card pad"><h2 class="h2" style="margin-bottom:12px">Logement ${log.id}</h2>
              ${A.kv([['Dernier constat', lastC ? `${A.fd(lastC.date)} · propreté ${lastC.proprete}/6, bâti ${E(lastC.bati.toLowerCase())}` : 'aucun'], ['Interventions 12 mois', String(n12)], ['Demande ouverte', ouvertes.length ? ouvertes.map(x => `<a href="#/demande/${x.id}">${x.id}</a>`).join(', ') : 'aucune autre']])}
              <a href="#/logement/${log.id}" style="display:inline-block;margin-top:12px;font-size:13px">Voir la fiche logement</a>
            </div>
          </aside>
        </div>`);
    },
    acts: {
      lq(el) { const d = cur(); const l = d.lignes[+el.dataset.i]; l[el.dataset.k] = el.value; if (el.dataset.k === 'circuit' && el.value === 'bailleur') l.imputation = 'Bailleur propriétaire'; A.save(); A.render(); },
      ldur(el) { const l = cur().lignes[+el.dataset.i]; l.duree = Math.max(30, l.duree + Number(el.dataset.v)); A.save(); A.render(); },
      qmsg(el) { cur().message = el.value; A.save(); },
      qphoto(el) { const d = cur(); const i = +el.dataset.i; A.readPhotos(el.files).then(ph => { d.lignes[i].photos.push(...ph); A.hist(d, `${ph.length} photo(s) ajoutée(s) à la ligne ${i + 1}`); A.saveNow(); A.render(); }); },
      goDevis(el, e) { e.preventDefault(); A.go('#/devis/' + cur().consultationId); },
      valider() {
        const d = cur();
        if (d.lignes.some(l => !l.circuit)) return A.toast('Choisissez un circuit pour chaque ligne', 'err');
        d.lignes.forEach(l => { if (!l.urgence) l.urgence = d.urgence; });
        if (d.message && d.message.trim()) A.hist(d, `Message à l'établissement : « ${d.message.trim()} »`);
        const cs = new Set(d.lignes.map(l => l.circuit));
        if (cs.has('ST')) {
          d.ft = d.ft || A.nextId('ft'); d.statut = 'a_planifier';
          A.hist(d, `Qualifiée · ${d.ft} · à planifier (${A.fdur(A.dureeST(d))})`);
          if (cs.size > 1) A.hist(d, `Autres lignes : ${[...cs].filter(c => c !== 'ST').map(A.circuitLabel).join(', ')}`);
          A.saveNow(); A.toast(`${d.id} qualifiée · à planifier`, 'ok'); A.go('#/planning?sel=' + d.id);
        } else if (cs.has('prestataire')) {
          d.statut = 'prestataire'; A.hist(d, 'Qualifiée · circuit prestataire'); A.saveNow();
          A.toast('Circuit prestataire : lancez la consultation', 'ok'); A.go('#/consultation/' + d.id);
        } else if (cs.has('sinistre')) {
          d.statut = 'sinistre'; A.hist(d, 'Qualifiée · sinistre / assurance : déclaration à faire'); A.saveNow(); A.render();
        } else {
          d.statut = 'bailleur'; A.hist(d, `Demande transmise au bailleur (${(A.Log(d.logementId) || {}).bailleur})`); A.saveNow(); A.toast('Demande transmise au bailleur', 'ok'); A.render();
        }
      },
      renvoyer() {
        const d = cur();
        A.modal({
          title: `Renvoyer ${d.id} à l'établissement`, okLabel: 'Renvoyer',
          body: `<div><label class="lbl">Motif (obligatoire)</label><select class="in" name="motif">${A.opts(A.S.ref.motifsRenvoi)}</select></div>
                 <div><label class="lbl">Message au demandeur</label><textarea class="in" name="msg" placeholder="Précisez ce qui manque"></textarea></div>`,
          onOk(f, fd) { d.statut = 'a_completer'; d.motifRenvoi = fd.get('motif'); d.msgRenvoi = fd.get('msg'); A.hist(d, `Renvoyée à l'établissement : ${d.motifRenvoi}`); A.saveNow(); A.toast('Demande renvoyée · le demandeur est notifié'); A.render(); },
        });
      },
      rejeter() {
        const d = cur();
        A.modal({
          title: `Rejeter ${d.id}`, okLabel: 'Rejeter la demande', danger: true,
          body: `<div><label class="lbl">Motif de rejet (obligatoire)</label><select class="in" name="motif">${A.opts(A.S.ref.motifsRejet)}</select></div>
                 <div><label class="lbl">Commentaire</label><textarea class="in" name="msg"></textarea></div>`,
          onOk(f, fd) { d.statut = 'rejetee'; d.motifRejet = fd.get('motif') + (fd.get('msg') ? ' — ' + fd.get('msg') : ''); A.hist(d, `Rejetée : ${d.motifRejet}`); A.saveNow(); A.toast('Demande rejetée'); A.render(); },
        });
      },
      completee() { const d = cur(); d.statut = 'a_qualifier'; A.hist(d, "Complétée par l'établissement"); A.saveNow(); A.toast('Demande renvoyée en qualification', 'ok'); A.render(); },
      relancer() { const d = cur(); A.hist(d, 'Relance envoyée au demandeur pour réactualisation'); A.saveNow(); A.toast('Relance envoyée'); A.render(); },
      reactualisee() { const d = cur(); d.statut = 'a_qualifier'; d.recueLe = A.now(); A.hist(d, 'Réactualisée par le demandeur : besoin confirmé'); A.saveNow(); A.toast('Demande réactualisée', 'ok'); A.render(); },
      cloturer() { const d = cur(); d.statut = 'cloturee'; A.hist(d, 'Réceptionnée et clôturée par la coordination'); A.saveNow(); A.toast(`${d.id} clôturée`, 'ok'); A.render(); },
      bailleurFait() { const d = cur(); d.statut = 'cloturee'; d.dateIntervention = A.TODAY; A.hist(d, 'Travaux réalisés par le bailleur · clôturée'); A.saveNow(); A.render(); },
      relancerBailleur() { const d = cur(); A.hist(d, 'Relance envoyée au bailleur'); A.saveNow(); A.toast('Relance envoyée au bailleur'); A.render(); },
      presteFait() { const d = cur(); d.statut = 'realisee'; d.dateIntervention = d.dateIntervention || A.TODAY; d.lignes.forEach(l => { l.statut = 'realisee'; }); A.hist(d, 'Intervention du prestataire réalisée · à réceptionner'); A.saveNow(); A.render(); },
      declaration() { const d = cur(); A.hist(d, "Déclaration de sinistre envoyée à l'assureur"); A.saveNow(); A.toast('Déclaration enregistrée'); A.render(); },
      sinistreTravaux() { const d = cur(); d.lignes.forEach(l => { l.circuit = 'ST'; }); d.ft = d.ft || A.nextId('ft'); d.statut = 'a_planifier'; A.hist(d, 'Indemnisation actée · travaux confiés au service technique'); A.saveNow(); A.go('#/planning?sel=' + d.id); },
    },
  };
})(window.App);
