/* Écrans : consultation d'entreprises, analyse des devis et décision, portail entreprise (externe) */
(function (A) {
  const E = A.esc;

  /* ---------- Notation automatique des devis ---------- */
  A.scoreCs = c => {
    const rec = c.entreprises.filter(id => c.reponses[id] && c.reponses[id].statut === 'recu');
    const minP = Math.min(...rec.map(id => c.reponses[id].montantHT));
    const minD = Math.min(...rec.map(id => c.reponses[id].delai));
    const res = {};
    rec.forEach(id => {
      const r = c.reponses[id];
      const prix = minP / r.montantHT * c.criteres.prix;
      const delai = minD / r.delai * c.criteres.delai;
      const qualite = Math.min(c.criteres.qualite, Number(r.qualite) || 0);
      const docs = A.entDocs(A.Ent(id));
      const complet = (r.postes || []).length === c.lignes.length;
      res[id] = { prix, delai, qualite, total: prix + delai + qualite, docsOk: docs.ok, docsLabel: docs.label, complet, retenable: docs.ok && complet };
    });
    const best = Object.entries(res).filter(([, s]) => s.retenable).sort((a, b) => b[1].total - a[1].total)[0];
    return { res, best: best ? best[0] : null, rec };
  };

  /* =====================================================================
     Consultation d'entreprises
     ===================================================================== */
  const draftFor = d => {
    let c = A.S.consultations.find(x => x.demandeId === d.id && x.statut === 'brouillon');
    if (!c) {
      const lots = [...new Set(d.lignes.map(l => l.lot))];
      const log = A.Log(d.logementId);
      const ents = A.S.entreprises.filter(e => e.lots.some(l => lots.includes(l)));
      const near = ents.filter(e => e.secteur === log.secteur || e.secteur.slice(0, 2) === log.dept);
      c = {
        id: 'BR-' + d.id, demandeId: d.id, statut: 'brouillon', mode: 'devis', lignes: d.lignes.map((l, i) => i),
        descriptif: '', entreprises: (near.length ? near : ents).slice(0, 4).map(e => e.id),
        dateLimite: A.addDays(A.TODAY, 14), heureLimite: '12:00', visite: true,
        creneaux: [A.addDays(A.TODAY, 5) + 'T09:00', A.addDays(A.TODAY, 6) + 'T14:00', A.addDays(A.TODAY, 7) + 'T10:00'],
        delai: 'Sous 3 semaines après commande', criteres: { prix: 60, delai: 25, qualite: 15 }, estimation: '',
        message: 'Bonjour, merci de nous transmettre votre devis détaillé avant la date limite.', motifUnique: '',
        reponses: {}, questions: [], historique: [], decision: null,
      };
      A.S.consultations.push(c); A.save();
    }
    return c;
  };

  A.V.consultation = {
    render([id]) {
      const d = A.D(id);
      if (!d) return A.layout('demandes', '<div class="card pad empty">Demande introuvable</div>');
      if (d.consultationId && A.Cs(d.consultationId)) { setTimeout(() => location.replace('#/devis/' + d.consultationId)); return A.layout('demandes', ''); }
      const c = draftFor(d);
      const log = A.Log(d.logementId);
      const lots = [...new Set(c.lignes.map(i => d.lignes[i].lot))];
      const shown = A.S.entreprises.filter(e => c.entreprises.includes(e.id));
      const crit = c.criteres; const sumCrit = crit.prix + crit.delai + crit.qualite;
      const nph = c.lignes.reduce((s, i) => s + d.lignes[i].photos.length, 0);
      const modes = [
        ['accord', 'Bon de commande accord-cadre', 'Titulaire du lot désigné selon les règles du marché'],
        ['devis', 'Mise en concurrence par devis', 'Plusieurs entreprises consultées, choix motivé'],
        ['unique', 'Entreprise unique', 'Urgence ou montant faible, motif obligatoire'],
      ];
      const sendLabel = c.mode === 'accord' ? 'Émettre le bon de commande' : `Envoyer la consultation (${c.entreprises.length})`;
      const est = Number(c.estimation) || 0;
      const warn3 = c.mode === 'devis' && est > A.S.ref.seuils.troisDevis && c.entreprises.length < 3;

      return A.layout('demandes', `
        <div class="crumb"><a href="#/demandes">Demandes</a> › <a href="#/demande/${d.id}">${d.id}</a> › Consultation</div>
        <div class="pagehead">
          <div class="t"><h1>Consulter des entreprises</h1>${A.chip('Circuit prestataire', 'rx')}<span class="muted s13">${d.id} · ${log.id} · ${E(log.typo)} · ${E(log.ville)} (${log.dept})</span></div>
          <div class="row" style="gap:8px"><button class="btn" data-act="csSave">Enregistrer le brouillon</button><button class="btn btnp" data-act="csSend">${sendLabel}</button></div>
        </div>
        <div class="cols">
          <div class="col-main">
            <section class="card pad">
              <div class="sec-h"><span class="step">1</span><h2 class="h2">Mode d'achat</h2></div>
              <div class="seg tall">${modes.map(([k, l, s]) => `<button type="button" class="${c.mode === k ? 'on' : ''}" data-act="csMode" data-v="${k}"><strong>${l}</strong><small>${s}</small></button>`).join('')}</div>
              ${c.mode === 'unique' ? `<div style="margin-top:12px"><label class="lbl" for="csmu">Motif du recours à une entreprise unique (obligatoire)</label><input class="in" id="csmu" data-in="csF" data-k="motifUnique" value="${E(c.motifUnique)}" placeholder="Urgence, montant faible, spécialité…"></div>` : ''}
              <p class="muted small" style="margin:12px 0 0">Règle interne : au-delà de ${A.feur(A.S.ref.seuils.troisDevis)} HT, au moins 3 devis ; au-delà de ${A.feur(A.S.ref.seuils.direction)} HT, validation de la direction (seuils réglables dans les référentiels). Hors lots couverts par l'accord-cadre.</p>
            </section>
            <section class="card pad">
              <div class="sec-h"><span class="step">2</span><h2 class="h2">Travaux à chiffrer</h2></div>
              <div class="stack" style="--gap:8px">
                ${d.lignes.map((l, i) => `<label class="li-chk"><input type="checkbox" data-ch="csLine" data-i="${i}" ${c.lignes.includes(i) ? 'checked' : ''}>${A.photo(l.photos[0], 56, 42)}<div><strong class="s13">${i + 1} · ${E(A.lineLabel(l))}</strong><div class="muted small">${E(l.description)} · ${l.photos.length} photo(s)</div></div></label>`).join('')}
              </div>
              <div class="grid-auto" style="--min:260px;margin-top:14px">
                <div><label class="lbl" for="csdesc">Descriptif complémentaire</label><textarea class="in" id="csdesc" data-in="csF" data-k="descriptif" placeholder="Finitions, contraintes, matériaux">${E(c.descriptif)}</textarea></div>
                <div><span class="lbl">Pièces jointes automatiques</span><div class="in ro">Fiche travaux PDF + ${nph} photo${nph > 1 ? 's' : ''}</div>
                  <label class="lbl" for="csest" style="margin-top:10px">Estimation interne (€ HT)</label><input class="in" id="csest" type="number" min="0" data-in="csF" data-k="estimation" value="${E(c.estimation)}" placeholder="facultatif"></div>
              </div>
            </section>
            <section class="card pad">
              <div class="row between" style="margin-bottom:12px"><div class="sec-h" style="margin:0"><span class="step">3</span><h2 class="h2">Entreprises consultées</h2></div>
                <div class="row" style="gap:6px"><span class="chip gr">Lot : ${E(lots.map(A.shortLot).join(', '))}</span><span class="chip gr">Secteur : ${E(log.secteur)}</span><button class="btn btn-sm" data-act="csAddEnt">+ Ajouter une entreprise</button></div></div>
              <div class="ent hd"><span></span><span>Entreprise</span><span>Documents</span><span>Historique</span><span>Note moyenne</span><span></span></div>
              ${shown.map(e => { const dc = A.entDocs(e); return `<div class="ent"><span></span><div><strong>${E(e.nom)}</strong>${e.accordCadre ? ' ' + A.chip('Accord-cadre', 'bl') : ''}<small>${E(e.ville)} · ${E(e.activite)}</small></div><span>${A.chip(dc.label, dc.ok ? 'ok' : 'ko')}</span><span>${e.chantiers} chantier${e.chantiers > 1 ? 's' : ''}</span><span>${A.fnum(e.note, 1)} / 5</span><button class="linkbtn" data-act="csDelEnt" data-id="${e.id}" aria-label="Retirer ${E(e.nom)}">×</button></div>`; }).join('') || '<div class="empty">Aucune entreprise sélectionnée</div>'}
              ${warn3 ? `<div class="note warn" style="margin-top:10px">Estimation au-delà de ${A.feur(A.S.ref.seuils.troisDevis)} HT : consulter au moins 3 entreprises.</div>` : ''}
              <p class="muted small" style="margin:12px 0 0">Documents suivis : Kbis de moins de 3 mois, attestation URSSAF de moins de 6 mois, assurances RC et décennale. Une entreprise sans documents à jour peut être consultée, mais pas retenue.</p>
            </section>
          </div>
          <aside class="col-side">
            <section class="card pad">
              <div class="sec-h"><span class="step">4</span><h2 class="h2">Conditions</h2></div>
              <div class="stack" style="--gap:14px">
                <div><span class="lbl">Date limite de remise des devis</span><div style="display:grid;grid-template-columns:1fr 100px;gap:8px"><input class="in" type="date" id="csdl" data-ch="csF" data-k="dateLimite" value="${c.dateLimite}" min="${A.TODAY}"><input class="in" type="time" id="cshl" data-ch="csF" data-k="heureLimite" value="${c.heureLimite}"></div></div>
                <div><span class="lbl">Visite sur place</span>${A.seg('csVis', [{ k: '1', l: 'Proposée' }, { k: '0', l: 'Sans visite' }], c.visite ? '1' : '0')}
                  ${c.visite ? `<div class="stack" style="--gap:6px;margin-top:8px">${c.creneaux.map((cr, i) => `<input class="in sm" type="datetime-local" id="cscr${i}" data-ch="csCr" data-i="${i}" value="${cr}">`).join('')}</div>` : ''}</div>
                <div><label class="lbl" for="csdel">Délai d'intervention souhaité</label><input class="in" id="csdel" data-in="csF" data-k="delai" value="${E(c.delai)}"></div>
                <div><span class="lbl">Critères de choix annoncés ${sumCrit !== 100 ? `<span style="color:#B42318">(total ${sumCrit} %)</span>` : ''}</span>
                  ${[['prix', 'Prix'], ['delai', "Délai d'intervention"], ['qualite', 'Qualité et références']].map(([k, l]) => `<div class="row between s13" style="padding:6px 0;border-bottom:1px solid #EEF0F3;flex-wrap:nowrap"><span>${l}</span><span class="row" style="gap:4px;flex-wrap:nowrap"><input class="in sm" style="width:64px;min-height:30px" type="number" min="0" max="100" id="cscrit${k}" data-ch="csCrit" data-k="${k}" value="${crit[k]}"> %</span></div>`).join('')}</div>
                <div><label class="lbl" for="csmsg">Message aux entreprises</label><textarea class="in" id="csmsg" data-in="csF" data-k="message">${E(c.message)}</textarea></div>
              </div>
            </section>
            <section class="card pad s13" style="line-height:1.5">
              <strong>À l'envoi</strong>
              <p style="margin:6px 0">Chaque entreprise reçoit un mail avec un lien personnel vers le portail entreprise : fiche, photos, créneaux de visite et dépôt du devis.</p>
              <p style="margin:0">Relance automatique 2 jours avant la date limite.</p>
            </section>
          </aside>
        </div>`);
    },
    acts: {
      csMode(el) { const c = draftFor(A.D(A.cur.params[0])); c.mode = el.dataset.v;
        if (c.mode === 'accord') { const d = A.D(c.demandeId); const lots = d.lignes.map(l => l.lot); const t = A.S.entreprises.find(e => e.accordCadre && e.lots.some(l => lots.includes(l))); c.entreprises = t ? [t.id] : c.entreprises.slice(0, 1); if (!t) A.toast('Aucun titulaire d\'accord-cadre pour ce lot', 'err'); }
        if (c.mode === 'unique') c.entreprises = c.entreprises.slice(0, 1);
        A.save(); A.render(); },
      csF(el) { draftFor(A.D(A.cur.params[0]))[el.dataset.k] = el.value; A.save(); if (el.tagName === 'SELECT' || el.type === 'date' || el.dataset.k === 'estimation') A.render(); },
      csVis(el) { draftFor(A.D(A.cur.params[0])).visite = el.dataset.v === '1'; A.save(); A.render(); },
      csCr(el) { draftFor(A.D(A.cur.params[0])).creneaux[+el.dataset.i] = el.value; A.save(); },
      csCrit(el) { draftFor(A.D(A.cur.params[0])).criteres[el.dataset.k] = Math.max(0, Number(el.value) || 0); A.save(); A.render(); },
      csLine(el) { const c = draftFor(A.D(A.cur.params[0])); const i = +el.dataset.i; c.lignes = el.checked ? [...new Set([...c.lignes, i])].sort() : c.lignes.filter(x => x !== i); A.save(); A.render(); },
      csDelEnt(el) { const c = draftFor(A.D(A.cur.params[0])); c.entreprises = c.entreprises.filter(x => x !== el.dataset.id); A.save(); A.render(); },
      csAddEnt() {
        const c = draftFor(A.D(A.cur.params[0]));
        const others = A.S.entreprises.filter(e => !c.entreprises.includes(e.id));
        if (!others.length) return A.toast('Toutes les entreprises sont déjà consultées');
        A.modal({
          title: 'Ajouter une entreprise', okLabel: 'Ajouter',
          body: `<div><label class="lbl">Entreprise référencée</label><select class="in" name="e">${A.opts(others.map(e => ({ v: e.id, l: `${e.nom} — ${e.ville} · ${e.activite}` })))}</select></div>`,
          onOk(f, fd) { if (c.mode !== 'devis') c.entreprises = []; c.entreprises.push(fd.get('e')); A.save(); A.render(); },
        });
      },
      csSave() { A.saveNow(); A.toast('Brouillon de consultation enregistré', 'ok'); },
      csSend() {
        const d = A.D(A.cur.params[0]); const c = draftFor(d);
        if (!c.lignes.length) return A.toast('Sélectionnez au moins un poste à chiffrer', 'err');
        if (!c.entreprises.length) return A.toast('Sélectionnez au moins une entreprise', 'err');
        if (c.mode === 'unique' && !c.motifUnique.trim()) return A.toast('Motif obligatoire pour une entreprise unique', 'err');
        if (c.criteres.prix + c.criteres.delai + c.criteres.qualite !== 100) return A.toast('Les critères doivent totaliser 100 %', 'err');
        c.id = A.nextId('cs'); c.statut = 'envoyee'; c.envoyeeLe = A.now();
        c.entreprises.forEach(id => { c.reponses[id] = { statut: 'attente' }; });
        d.consultationId = c.id;
        d.lignes.forEach((l, i) => { if (c.lignes.includes(i)) l.circuit = 'prestataire'; });
        if (c.mode === 'accord') {
          const e = A.Ent(c.entreprises[0]); const bc = A.nextId('bc');
          c.statut = 'commande'; c.decision = { entrepriseId: e.id, motif: "Titulaire de l'accord-cadre", imputation: d.lignes[c.lignes[0]].imputation, statut: 'validee', bc, at: A.now() };
          A.hist(c, `Bon de commande ${bc} émis · ${e.nom} (accord-cadre)`);
          d.statut = 'prestataire'; A.hist(d, `Bon de commande accord-cadre ${bc} envoyé à ${e.nom}`);
          A.saveNow(); A.toast(`Bon de commande ${bc} émis`, 'ok'); A.go('#/devis/' + c.id); return;
        }
        A.hist(c, `Consultation envoyée à ${c.entreprises.length} entreprise${c.entreprises.length > 1 ? 's' : ''}`);
        d.statut = 'consultation'; A.hist(d, `Consultation ${c.id} envoyée à ${c.entreprises.length} entreprise(s) · réponses avant le ${A.fd(c.dateLimite)}`);
        A.saveNow(); A.toast(`Consultation ${c.id} envoyée`, 'ok'); A.go('#/devis/' + c.id);
      },
    },
  };

  /* =====================================================================
     Devis reçus et décision
     ===================================================================== */
  const curCs = () => A.Cs(A.cur.params[0]);

  A.V.devis = {
    render([id]) {
      const c = A.Cs(id);
      if (!c) return A.layout('demandes', '<div class="card pad empty">Consultation introuvable</div>');
      const d = A.D(c.demandeId); const log = A.Log(d.logementId);
      const sc = A.scoreCs(c);
      const ents = c.entreprises.map(A.Ent);
      const rec = sc.rec;
      const declined = c.entreprises.filter(x => c.reponses[x] && c.reponses[x].statut === 'decline').length;
      const waiting = c.entreprises.filter(x => !c.reponses[x] || c.reponses[x].statut === 'attente');
      const prices = rec.map(x => c.reponses[x].montantHT);
      const ecart = prices.length > 1 ? Math.round((Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) * 100) : null;
      const dec = c.decision || { entrepriseId: sc.best || '', motif: '', imputation: d.lignes[c.lignes[0]].imputation, statut: 'brouillon' };
      const chosen = dec.entrepriseId && c.reponses[dec.entrepriseId];
      const needDir = chosen && chosen.montantHT > A.S.ref.seuils.direction;
      const locked = dec.statut === 'validee' || dec.statut === 'a_valider';
      const stChip = c.statut === 'commande' ? A.chip('Commande passée', 'ok') : dec.statut === 'a_valider' ? A.chip('En attente de validation direction', 'h48') : A.chip(waiting.length ? 'Réponses en cours' : 'Analyse en cours', 'bl');
      const cell = (x, fn, best) => `<td class="${x === sc.best ? 'best' : ''}">${fn(x)}</td>`;
      const recOr = (x, fn) => { const r = c.reponses[x]; return r && r.statut === 'recu' ? fn(r, sc.res[x]) : '<span class="muted">—</span>'; };
      const row = (label, fn) => `<tr><td class="rl">${label}</td>${c.entreprises.map(x => cell(x, y => recOr(y, fn))).join('')}</tr>`;
      const bar = (v, max) => `${A.fnum(v, 1)}<div class="mbar"><span style="width:${Math.round(v / max * 100)}%"></span></div>`;

      return A.layout('demandes', `
        <div class="crumb"><a href="#/demandes">Demandes</a> › <a href="#/demande/${d.id}">${d.id}</a> › Consultation ${c.id}</div>
        <div class="pagehead">
          <div class="t"><h1>Devis reçus et décision</h1>${stChip}<span class="muted s13">${E(c.lignes.map(i => A.shortLot(d.lignes[i].lot)).filter((v, i, a) => a.indexOf(v) === i).join(' et '))} · ${log.id} · ${E(log.ville)} · clôture des réponses le ${A.fd(c.dateLimite)} à ${c.heureLimite}</span></div>
          <div class="row" style="gap:8px">
            ${waiting.length && c.statut !== 'commande' ? `<button class="btn" data-act="dvRelance">Relancer les non-répondants (${waiting.length})</button>` : ''}
            <button class="btn" data-act="dvExport">Exporter le tableau</button>
          </div>
        </div>
        <div class="kpis">
          <div class="card kpi"><div class="l">Entreprises consultées</div><div class="v">${c.entreprises.length}</div><div class="s">mode : ${{ devis: 'mise en concurrence', unique: 'entreprise unique', accord: 'accord-cadre' }[c.mode]}</div></div>
          <div class="card kpi"><div class="l">Devis reçus</div><div class="v">${rec.length}</div><div class="s">${declined ? declined + ' a décliné · ' : ''}${waiting.length} en attente</div></div>
          <div class="card kpi"><div class="l">Écart entre devis</div><div class="v">${ecart == null ? '—' : ecart + ' %'}</div><div class="s">du moins cher au plus cher</div></div>
          <div class="card kpi"><div class="l">Estimation interne</div><div class="v">${c.estimation ? A.feur(c.estimation) : '—'}</div><div class="s">HT</div></div>
        </div>
        <div class="cols" style="gap:16px">
          <section class="card pad" style="flex:999 1 700px;min-width:0">
            <div class="row between" style="margin-bottom:12px"><h2 class="h2">Tableau comparatif</h2><span class="muted s13">Pondération : prix ${c.criteres.prix} % · délai ${c.criteres.delai} % · qualité ${c.criteres.qualite} %</span></div>
            <div class="tbl-wrap"><table class="t cmp" style="min-width:${180 + 190 * ents.length}px">
              <thead><tr><th></th>${ents.map(e => `<th class="${e.id === sc.best ? 'best' : ''}">${E(e.nom)}${e.id === sc.best ? `<div style="margin-top:4px">${A.chip('Recommandé', 'bl')}</div>` : ''}</th>`).join('')}</tr></thead>
              <tbody>
                <tr><td class="rl">Statut</td>${c.entreprises.map(x => { const r = c.reponses[x] || { statut: 'attente' }; return cell(x, () => r.statut === 'recu' ? A.chip('Devis reçu ' + A.fd(r.date), 'ok') : r.statut === 'decline' ? A.chip('A décliné', 'gr') + `<small>${E(r.motif || '')}</small>` : A.chip('En attente', 'h48') + ` <a class="small" href="#/portail/${c.id}/${x}">portail</a>`); }).join('')}</tr>
                ${c.visite ? row('Visite sur place', r => r.visite ? 'Faite le ' + A.fd(r.visite) : 'Non') : ''}
                ${row('Montant HT', r => `<strong>${A.feur(r.montantHT)}</strong>`)}
                ${row('Montant TTC', r => `${A.feur(r.montantHT * (1 + r.tva / 100))} <span class="muted">(TVA ${A.fnum(r.tva, r.tva % 1 ? 1 : 0)} %)</span>`)}
                ${row("Délai d'intervention", r => `${r.delai} jour${r.delai > 1 ? 's' : ''}`)}
                ${row('Durée des travaux', r => `${r.duree} jour${r.duree > 1 ? 's' : ''}`)}
                ${row('Validité du devis', r => `${r.validite} mois`)}
                ${row('Postes couverts', (r, s) => s.complet ? `${r.postes.length} / ${c.lignes.length}` : A.chip(`${r.postes.length} / ${c.lignes.length} · ${c.lignes.filter(i => !r.postes.includes(i)).map(i => d.lignes[i].nature.toLowerCase()).join(', ')} absent`, 'wa'))}
                ${row('Documents administratifs', (r, s) => A.chip(s.docsOk ? 'Conformes' : s.docsLabel, s.docsOk ? 'ok' : 'ko'))}
                ${row('Devis PDF', r => `<span class="small">${E(r.pdf || 'devis.pdf')}</span>`)}
                ${row(`Note prix /${c.criteres.prix}`, (r, s) => bar(s.prix, c.criteres.prix))}
                ${row(`Note délai /${c.criteres.delai}`, (r, s) => bar(s.delai, c.criteres.delai))}
                <tr><td class="rl">Note qualité /${c.criteres.qualite}<small>saisie coordination</small></td>${c.entreprises.map(x => cell(x, y => recOr(y, (r) => `<input class="in sm" style="width:76px;min-height:30px" type="number" step="0.5" min="0" max="${c.criteres.qualite}" id="q${y}" data-ch="dvQual" data-id="${y}" value="${r.qualite == null ? '' : r.qualite}" ${locked ? 'disabled' : ''}>`))).join('')}</tr>
                ${row('Note totale /100', (r, s) => `<strong>${A.fnum(s.total, 1)}</strong>${s.retenable ? '' : ' ' + A.chip('non retenable', 'ko')}`)}
              </tbody></table></div>
            <p class="muted small" style="margin:12px 0 0">Notes calculées automatiquement : prix = devis le moins cher ÷ devis × ${c.criteres.prix} ; délai = délai le plus court ÷ délai × ${c.criteres.delai} ; qualité saisie par la coordination (références, historique, visite). Non retenable : documents non conformes ou poste manquant.</p>
          </section>
          <aside class="col-side">
            <section class="card pad">
              <h2 class="h2" style="margin-bottom:14px">Décision</h2>
              ${dec.statut === 'validee' ? `<div class="note" style="background:#E7F6EC;border-color:#A7D9B8">Commande ${E(dec.bc)} passée à <strong>${E(A.Ent(dec.entrepriseId).nom)}</strong>${chosen && chosen.montantHT ? ` pour ${A.feur(chosen.montantHT)} HT` : ''}. ${E(dec.motif)}</div>
                <p class="muted small" style="margin:10px 0 0">Bon de commande envoyé, mission planifiée côté prestataire${d.dateIntervention ? ` (intervention prévue ${A.fday(d.dateIntervention)})` : ''}, mail automatique aux entreprises non retenues.</p>
                <a class="btn btn-w" style="margin-top:12px" href="#/demande/${d.id}">Suivre la demande</a>`
              : `<div class="stack" style="--gap:14px">
                <div><label class="lbl" for="dvent">Entreprise retenue</label><select class="in" id="dvent" data-ch="dvDec" data-k="entrepriseId" ${locked ? 'disabled' : ''}>${A.opts(rec.map(x => ({ v: x, l: `${A.Ent(x).nom}${sc.res[x].retenable ? '' : ' (non retenable)'}` })), dec.entrepriseId, 'Choisir…')}</select></div>
                <div><label class="lbl" for="dvmot">Motif du choix (obligatoire)</label><textarea class="in" id="dvmot" data-in="dvDec" data-k="motif" ${locked ? 'disabled' : ''} placeholder="Meilleure note globale, délai, devis complet…">${E(dec.motif)}</textarea></div>
                <div><label class="lbl" for="dvimp">Imputation</label><select class="in" id="dvimp" data-ch="dvDec" data-k="imputation" ${locked ? 'disabled' : ''}>${A.opts(A.S.ref.imputations, dec.imputation)}</select></div>
                ${needDir ? `<div class="note warn"><div><strong>Validation de la direction requise</strong><div>Montant supérieur à ${A.feur(A.S.ref.seuils.direction)} HT</div></div></div>` : ''}
                ${dec.statut === 'a_valider'
                  ? `<button class="btn btnp btn-w" data-act="dvValider" ${A.S.profil === 'dir' ? '' : 'disabled'}>Valider (direction)</button><button class="btn btn-w" data-act="dvRefus">Refuser et revoir</button>${A.S.profil !== 'dir' ? '<p class="muted small" style="margin:0">Basculez sur le profil « Direction Immobilier » (en haut à droite) pour valider.</p>' : ''}`
                  : `<button class="btn btnp btn-w" data-act="dvSoumettre" ${rec.length ? '' : 'disabled'}>${needDir ? 'Soumettre à validation' : 'Valider et commander'}</button>`}
                <p class="muted small" style="margin:0">Après validation : bon de commande généré et envoyé, mission planifiée côté prestataire, mail automatique aux entreprises non retenues.</p>
              </div>`}
            </section>
            ${c.questions.length ? `<section class="card pad"><h2 class="h2" style="margin-bottom:6px">Questions des entreprises</h2>
              ${c.questions.map((q, i) => `<div class="qa"><strong>${E(q.q)}</strong><div style="margin-top:6px">${q.a ? `<span class="muted">Réponse :</span> ${E(q.a)}` : `<div class="row" style="gap:6px;flex-wrap:nowrap"><input class="in sm" id="qa${i}" placeholder="Réponse partagée avec toutes les entreprises"><button class="btn btn-sm" data-act="dvAnswer" data-i="${i}">Répondre</button></div>`}</div></div>`).join('')}
            </section>` : ''}
            <section class="card pad"><h2 class="h2" style="margin-bottom:12px">Historique de la consultation</h2>
              <div class="stack" style="--gap:8px">${c.historique.slice().sort((a, b) => b.at.localeCompare(a.at)).map(h => `<div class="row s13" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><span class="chip ${/reçu|émis|passée/.test(h.t) ? 'ok' : /envoyée à/.test(h.t) ? 'bl' : 'gr'}">${A.fd(h.at)}</span><span>${E(h.t)}</span></div>`).join('')}</div>
            </section>
            <section class="card pad s13"><strong>Portail entreprise</strong><p class="muted" style="margin:6px 0 10px">Lien personnel envoyé à chaque entreprise (démonstration) :</p>
              ${ents.map(e => `<div class="row between" style="padding:4px 0"><span>${E(e.nom)}</span><a href="#/portail/${c.id}/${e.id}">Ouvrir le portail</a></div>`).join('')}</section>
          </aside>
        </div>`);
    },
    acts: {
      dvQual(el) { const c = curCs(); c.reponses[el.dataset.id].qualite = Math.min(c.criteres.qualite, Math.max(0, Number(el.value) || 0)); A.save(); A.render(); },
      dvDec(el) { const c = curCs(); const sc = A.scoreCs(c); const d = A.D(c.demandeId); c.decision = c.decision || { entrepriseId: sc.best || '', motif: '', imputation: d.lignes[c.lignes[0]].imputation, statut: 'brouillon' }; c.decision[el.dataset.k] = el.value; A.save(); if (el.tagName === 'SELECT') A.render(); },
      dvRelance() { const c = curCs(); const n = c.entreprises.filter(x => !c.reponses[x] || c.reponses[x].statut === 'attente').length; A.hist(c, `Relance envoyée aux non-répondants (${n})`); A.saveNow(); A.toast('Relance envoyée'); A.render(); },
      dvAnswer(el) { const c = curCs(); const v = document.getElementById('qa' + el.dataset.i).value.trim(); if (!v) return; c.questions[+el.dataset.i].a = v; A.hist(c, 'Réponse publiée sur le portail'); A.saveNow(); A.render(); },
      dvSoumettre() {
        const c = curCs(); const sc = A.scoreCs(c); const d = A.D(c.demandeId);
        const dec = c.decision = c.decision || { entrepriseId: sc.best || '', motif: '', imputation: d.lignes[c.lignes[0]].imputation, statut: 'brouillon' };
        if (!dec.entrepriseId) return A.toast('Choisissez une entreprise', 'err');
        if (!sc.res[dec.entrepriseId].retenable) return A.toast('Entreprise non retenable : documents ou postes incomplets', 'err');
        if (!dec.motif.trim()) return A.toast('Le motif du choix est obligatoire', 'err');
        const r = c.reponses[dec.entrepriseId];
        if (r.montantHT > A.S.ref.seuils.direction) { dec.statut = 'a_valider'; A.hist(c, `Choix soumis à la direction : ${A.Ent(dec.entrepriseId).nom} (${A.feur(r.montantHT)} HT)`); A.saveNow(); A.toast('Soumis à la validation de la direction', 'ok'); A.render(); }
        else A.V.devis.acts.dvValider(null, null, true);
      },
      dvValider(el, e, force) {
        if (!force && A.S.profil !== 'dir') return;
        const c = curCs(); const d = A.D(c.demandeId); const dec = c.decision; const r = c.reponses[dec.entrepriseId]; const ent = A.Ent(dec.entrepriseId);
        dec.statut = 'validee'; dec.bc = A.nextId('bc'); dec.at = A.now(); c.statut = 'commande';
        A.hist(c, `${force ? 'Validée' : 'Validée par la direction'} · bon de commande ${dec.bc} émis · ${ent.nom}`);
        const others = c.entreprises.filter(x => x !== ent.id && c.reponses[x] && c.reponses[x].statut === 'recu').length;
        if (others) A.hist(c, `Mail envoyé aux entreprises non retenues (${others})`);
        d.statut = 'prestataire'; d.dateIntervention = A.addDays(A.TODAY, r.delai);
        c.lignes.forEach(i => { d.lignes[i].imputation = dec.imputation; });
        A.hist(d, `Commande ${dec.bc} passée à ${ent.nom} · ${A.feur(r.montantHT)} HT · intervention prévue ${A.fday(d.dateIntervention)}`);
        A.saveNow(); A.toast(`Bon de commande ${dec.bc} envoyé à ${ent.nom}`, 'ok'); A.render();
      },
      dvRefus() { const c = curCs(); c.decision.statut = 'brouillon'; A.hist(c, 'Choix refusé par la direction : à revoir'); A.saveNow(); A.render(); },
      dvExport() {
        const c = curCs(); const sc = A.scoreCs(c);
        const rows = [['Entreprise', 'Statut', 'Montant HT', 'TVA %', 'Délai (j)', 'Durée (j)', 'Validité (mois)', 'Postes', 'Documents', 'Note prix', 'Note délai', 'Note qualité', 'Total']];
        c.entreprises.forEach(x => { const r = c.reponses[x] || {}; const s = sc.res[x]; rows.push([A.Ent(x).nom, r.statut, r.montantHT, r.tva, r.delai, r.duree, r.validite, r.postes ? r.postes.length + '/' + c.lignes.length : '', s ? (s.docsOk ? 'Conformes' : s.docsLabel) : '', s ? s.prix.toFixed(1) : '', s ? s.delai.toFixed(1) : '', s ? s.qualite : '', s ? s.total.toFixed(1) : '']); });
        A.download(`${c.id}_comparatif.csv`, A.csv(rows));
      },
    },
  };

  /* =====================================================================
     Portail entreprise (vue externe)
     ===================================================================== */
  const curPortal = () => { const c = A.Cs(A.cur.params[0]); return { c, eid: A.cur.params[1] || c.entreprises[0] }; };

  A.V.portail = {
    render([csId, eid]) {
      const c = A.Cs(csId);
      if (!c) return '<div class="main"><div class="card pad empty">Lien de consultation invalide ou expiré.</div></div>';
      eid = eid || c.entreprises[0];
      const e = A.Ent(eid); const d = A.D(c.demandeId); const log = A.Log(d.logementId);
      const r = c.reponses[eid] || { statut: 'attente' };
      const draft = A.ui.portal && A.ui.portal.key === csId + eid ? A.ui.portal : (A.ui.portal = { key: csId + eid, montantHT: '', tva: '10', delai: '', duree: '', validite: '3', postes: c.lignes.slice(), pdf: '', slot: r.slot || '' });
      const closed = c.statut === 'commande' || A.diffDays(c.dateLimite, A.TODAY) > 0;
      const dc = A.entDocs(e);
      const docNames = [['kbis', 'Extrait Kbis (moins de 3 mois)'], ['urssaf', 'Attestation URSSAF (moins de 6 mois)'], ['rc', 'Assurance RC professionnelle'], ['decennale', 'Assurance décennale']];
      const photos = c.lignes.flatMap(i => d.lignes[i].photos);

      return `
        <header class="top" style="background:#0F3D3A">
          <span class="brand">Equalis · Portail entreprises</span>
          <span style="flex:1"></span>
          <div class="top-r"><span class="top-link">Connecté :</span>
            <select class="prof" data-ch="ptEnt" aria-label="Entreprise (démonstration)">${A.opts(c.entreprises.map(x => ({ v: x, l: A.Ent(x).nom })), eid)}</select>
            <a class="top-link" href="#/devis/${c.id}">← Retour Equalis</a></div>
        </header>
        <main class="main">
          <div class="pagehead" style="align-items:flex-start">
            <div><div class="muted s13">Consultation ${c.id}</div>
              <h1 style="margin:4px 0 8px">${E(c.lignes.map(i => A.shortLot(d.lignes[i].lot)).filter((v, i, a) => a.indexOf(v) === i).join(' et '))} · ${E(log.ville)} (${log.dept})</h1>
              <div class="row" style="gap:10px">${A.chip(`Réponse attendue avant le ${A.fday(c.dateLimite)} · ${c.heureLimite}`, closed ? 'gr' : 'h48')}<span class="muted s13">Logement ${E(log.typo)} occupé · adresse précise communiquée à la visite</span></div></div>
            ${r.statut === 'attente' && !closed ? '<button class="btn" data-act="ptDecline">Décliner la consultation</button>' : ''}
          </div>
          ${r.statut === 'recu' ? `<div class="note" style="background:#E7F6EC;border-color:#A7D9B8;margin-bottom:16px">Devis déposé le ${A.fd(r.date)} : ${A.feur(r.montantHT)} HT. Merci, la coordination vous informera de sa décision.</div>` : ''}
          ${r.statut === 'decline' ? `<div class="note" style="margin-bottom:16px">Vous avez décliné cette consultation (${E(r.motif || '')}).</div>` : ''}
          ${c.statut === 'commande' ? `<div class="note info" style="margin-bottom:16px">Consultation close : ${c.decision.entrepriseId === eid ? 'votre devis a été retenu, le bon de commande vous a été envoyé.' : "votre devis n'a pas été retenu. Merci de votre participation."}</div>` : ''}
          <div class="cols">
            <div class="col-main">
              <section class="card pad"><h2 class="h2" style="margin-bottom:12px">Travaux demandés</h2>
                <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px">${c.lignes.map(i => { const l = d.lignes[i]; return `<li><strong>${E(l.piece)}</strong> — ${E(l.nature.toLowerCase())} (${E(A.shortLot(l.lot).toLowerCase())}), ${E(l.description)}</li>`; }).join('')}</ol>
                <p class="muted s13">${E(c.descriptif)}${c.descriptif ? '. ' : ''}Intervention souhaitée : ${E(c.delai.toLowerCase())}.</p>
                <div class="row" style="gap:8px">${photos.map(p => A.photo(p, 96, 72)).join('')}</div>
                <div class="doc" style="margin-top:12px;border:0">${A.chip('PDF', 'ko')}<span style="flex:1">Fiche travaux ${c.id}</span><a href="#/fiche/${d.id}">Télécharger</a></div>
              </section>
              ${c.visite ? `<section class="card pad"><h2 class="h2" style="margin-bottom:12px">Visite sur place</h2>
                <div class="stack" style="--gap:8px">${c.creneaux.map(cr => `<label class="slot"><input type="radio" name="slot" data-ch="ptSlot" value="${cr}" ${(r.slot || draft.slot) === cr ? 'checked' : ''} ${closed ? 'disabled' : ''}> ${A.fdayLong(cr)} · ${A.ftime(cr).replace(':', 'h')}</label>`).join('')}</div>
                <p class="muted s13" style="margin:10px 0 0">Le créneau choisi est ajouté au planning de la coordination ; l'adresse et le contact sur place vous sont envoyés.</p></section>` : ''}
              <section class="card pad"><h2 class="h2" style="margin-bottom:10px">Une question ?</h2>
                ${c.questions.map(q => `<div class="qa"><strong>${E(q.q)}</strong><div class="muted">${q.a ? E(q.a) : 'En attente de réponse'}</div></div>`).join('')}
                ${closed ? '' : `<div class="row" style="gap:8px;flex-wrap:nowrap;margin-top:8px"><input class="in" id="ptq" placeholder="Votre question à la coordination"><button class="btn" data-act="ptAsk">Envoyer</button></div>`}
                <p class="muted s13" style="margin:10px 0 0">Questions et réponses partagées avec toutes les entreprises consultées, sans nommer l'auteur.</p></section>
            </div>
            <aside class="col-side">
              ${r.statut === 'attente' && !closed ? `<section class="card pad"><h2 class="h2" style="margin-bottom:12px">Déposer votre devis</h2>
                <div class="stack" style="--gap:12px">
                  <label class="drop">${A.ic.upload()}<span>${draft.pdf ? E(draft.pdf) : 'Glisser le devis PDF ici ou cliquer'}</span><input type="file" accept="application/pdf" data-ch="ptPdf"></label>
                  <div class="grid-auto" style="--min:130px">
                    <div><label class="lbl" for="ptm">Montant HT (€)</label><input class="in" id="ptm" type="number" min="0" step="10" data-in="ptF" data-k="montantHT" value="${E(draft.montantHT)}"></div>
                    <div><label class="lbl" for="ptt">Taux de TVA</label><select class="in" id="ptt" data-ch="ptF" data-k="tva">${A.opts([{ v: '5.5', l: '5,5 %' }, { v: '10', l: '10 %' }, { v: '20', l: '20 %' }], draft.tva)}</select></div>
                    <div><label class="lbl" for="ptd">Délai d'intervention (j)</label><input class="in" id="ptd" type="number" min="1" data-in="ptF" data-k="delai" value="${E(draft.delai)}"></div>
                    <div><label class="lbl" for="ptu">Durée des travaux (j)</label><input class="in" id="ptu" type="number" min="1" data-in="ptF" data-k="duree" value="${E(draft.duree)}"></div>
                    <div><label class="lbl" for="ptv">Validité (mois)</label><input class="in" id="ptv" type="number" min="1" data-in="ptF" data-k="validite" value="${E(draft.validite)}"></div>
                  </div>
                  <div><span class="lbl">Postes chiffrés</span>${c.lignes.map(i => `<label class="chkrow" style="font-size:13px"><input type="checkbox" data-ch="ptPoste" data-i="${i}" ${draft.postes.includes(i) ? 'checked' : ''}> ${E(d.lignes[i].piece)} · ${E(d.lignes[i].nature)}</label>`).join('')}</div>
                  <button class="btn btnp btn-w" data-act="ptDepot">Déposer le devis</button>
                </div></section>` : ''}
              <section class="card pad"><h2 class="h2" style="margin-bottom:8px">Documents de l'entreprise</h2>
                ${docNames.map(([k, l]) => { const ok = dc.st[k]; const exp = k === 'rc' || k === 'decennale' ? e.docs[k] : A.addDays(e.docs[k], k === 'kbis' ? 92 : 182); const soon = ok && A.diffDays(A.TODAY, exp) < 70;
                  return `<div class="doc"><span>${l}</span><span class="row" style="gap:8px;flex-wrap:nowrap">${A.chip(!ok ? 'Expiré' : soon ? 'Expire le ' + A.fd(exp) : 'À jour', !ok ? 'ko' : soon ? 'wa' : 'ok')}<button class="linkbtn small" data-act="ptDoc" data-k="${k}">Mettre à jour</button></span></div>`; }).join('')}
                ${dc.ok ? '' : '<p class="small" style="color:#B42318;margin:10px 0 0">Documents à mettre à jour : sans eux, votre devis ne pourra pas être retenu.</p>'}
              </section>
            </aside>
          </div>
        </main>`;
    },
    acts: {
      ptEnt(el) { A.go(`#/portail/${A.cur.params[0]}/${el.value}`); },
      ptF(el) { A.ui.portal[el.dataset.k] = el.value; },
      ptPoste(el) { const p = A.ui.portal; const i = +el.dataset.i; p.postes = el.checked ? [...new Set([...p.postes, i])] : p.postes.filter(x => x !== i); },
      ptPdf(el) { if (el.files[0]) { A.ui.portal.pdf = el.files[0].name; A.render(); } },
      ptSlot(el) {
        const { c, eid } = curPortal(); c.reponses[eid] = c.reponses[eid] || { statut: 'attente' }; c.reponses[eid].slot = el.value;
        A.hist(c, `Visite réservée par ${A.Ent(eid).nom} · ${A.fday(el.value)} ${A.ftime(el.value)}`); A.saveNow(); A.toast('Créneau de visite réservé', 'ok');
      },
      ptAsk() { const { c } = curPortal(); const v = document.getElementById('ptq').value.trim(); if (!v) return; c.questions.push({ q: v, a: '', at: A.now() }); A.hist(c, 'Question posée sur le portail'); A.saveNow(); A.toast('Question envoyée à la coordination', 'ok'); A.render(); },
      ptDepot() {
        const { c, eid } = curPortal(); const p = A.ui.portal;
        const m = Number(p.montantHT), dl = Number(p.delai), du = Number(p.duree);
        if (!p.pdf) return A.toast('Joignez le devis PDF', 'err');
        if (!(m > 0) || !(dl > 0) || !(du > 0)) return A.toast('Montant, délai et durée sont obligatoires', 'err');
        if (!p.postes.length) return A.toast('Indiquez les postes chiffrés', 'err');
        const prev = c.reponses[eid] || {};
        c.reponses[eid] = { statut: 'recu', date: A.TODAY, montantHT: m, tva: Number(p.tva), delai: dl, duree: du, validite: Number(p.validite) || 1, postes: p.postes.slice().sort(), pdf: p.pdf, visite: prev.slot && prev.slot.slice(0, 10) <= A.TODAY ? prev.slot.slice(0, 10) : '', slot: prev.slot, qualite: null };
        A.hist(c, `Devis reçu · ${A.Ent(eid).nom}`);
        A.saveNow(); A.toast('Devis déposé, merci !', 'ok'); A.render();
      },
      ptDecline() {
        const { c, eid } = curPortal();
        A.modal({ title: 'Décliner la consultation', okLabel: 'Décliner', danger: true, body: `<div><label class="lbl">Motif</label><select class="in" name="m">${A.opts(['Plan de charge', 'Hors de nos compétences', 'Secteur trop éloigné', 'Autre'])}</select></div>`,
          onOk(f, fd) { c.reponses[eid] = { statut: 'decline', date: A.TODAY, motif: fd.get('m') }; A.hist(c, `${A.Ent(eid).nom} décline : ${fd.get('m').toLowerCase()}`); A.saveNow(); A.render(); } });
      },
      ptDoc(el) {
        const { eid } = curPortal(); const e = A.Ent(eid); const k = el.dataset.k;
        const isExp = k === 'rc' || k === 'decennale';
        A.modal({ title: 'Mettre à jour le document', okLabel: 'Enregistrer',
          body: `<div><label class="lbl">${isExp ? "Date de fin de validité de l'attestation" : 'Date de délivrance du document'}</label><input class="in" type="date" name="d" value="${isExp ? A.addDays(A.TODAY, 365) : A.TODAY}"></div><div><label class="lbl">Fichier PDF</label><input type="file" accept="application/pdf"></div>`,
          onOk(f, fd) { e.docs[k] = fd.get('d'); A.saveNow(); A.toast('Document mis à jour', 'ok'); A.render(); } });
      },
    },
  };
})(window.App);
