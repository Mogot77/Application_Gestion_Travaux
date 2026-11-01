/* Écran : fiche d'intervention imprimable A4 (recto) et compte rendu (verso, rempli si la mission est faite) */
(function (A) {
  const E = A.esc;

  // Motif décoratif façon QR code (lien vers la mission sur mobile) — pas un vrai QR code.
  const qr = seed => {
    let h = [...seed].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
    const n = 21; let cells = '';
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#111"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#111"/>`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      h = (h * 1103515245 + 12345) >>> 0;
      if ((h >> 16) & 1) cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="#111"/>`;
    }
    return `<svg viewBox="-1 -1 23 23" width="84" height="84" aria-label="Code de saisie mobile">${cells}${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}</svg>`;
  };
  const box = on => `<span class="box">${on ? '✕' : ''}</span>`;

  const pages = d => {
    const log = A.Log(d.logementId) || {};
    const r = A.S.rdvs.filter(x => x.demandeId === d.id && x.etat !== 'imp').sort((a, b) => b.date.localeCompare(a.date))[0];
    const imp = A.S.rdvs.find(x => x.demandeId === d.id && x.etat === 'imp');
    const o = r && A.Ouv(r.ouvrierId);
    const rp = r && r.rapport;
    const lignes = d.lignes.filter(l => l.circuit === 'ST' || !l.circuit);
    const urg = A.URG[d.urgence];
    const conso = d.consommables.length ? d.consommables : [];
    const recto = `<div class="a4">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
        <div><div style="font-weight:700;font-size:13px;color:#5B6472">Equalis · Service technique</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px">FICHE D'INTERVENTION</div>
          <div style="font-size:15px;margin-top:4px"><strong>${d.id}</strong>${d.ft ? ' · ' + d.ft : ''}</div>
          <div style="margin-top:8px"><span style="display:inline-block;border:2px solid ${d.urgence === 'urgent' ? '#B42318' : '#111'};color:${d.urgence === 'urgent' ? '#B42318' : '#111'};font-weight:700;padding:2px 10px;border-radius:4px">${urg[2]}</span> <span style="color:#5B6472;margin-left:8px">Imprimée le ${A.fdy(A.TODAY)}</span></div></div>
        <div style="text-align:center">${qr(d.id)}<div style="font-size:10px;color:#5B6472">Saisie mobile</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px">
        <div><h3>Logement</h3><dl style="margin-top:8px">
          <dt>Logement</dt><dd>${log.id} · ${E(log.typo)} · ${E(log.ville)} (${log.dept})</dd>
          <dt>Adresse</dt><dd>${E(A.logAdr(log))}, ${E(log.etage)}</dd>
          <dt>Accès</dt><dd>${E(d.acces || log.acces || '—')}</dd>
          <dt>Clés</dt><dd>${E(d.numCles || '—')} · ${E((d.lieuCles || '').toLowerCase())}</dd>
          <dt>Établissement</dt><dd>${E(log.etab)} · ${E(log.section)}</dd>
          <dt>Demandeur</dt><dd>${E(d.auteur)}, ${E(d.fonction.toLowerCase())} · ${E(d.tel || '[téléphone]')}</dd></dl></div>
        <div><h3>Planification</h3><dl style="margin-top:8px">
          <dt>Ouvrier</dt><dd>${o ? E(o.nom) : '……………'}</dd>
          <dt>Date</dt><dd>${r ? A.fday(r.date) : '……………'}</dd>
          <dt>Créneau</dt><dd>${r ? `${r.debut} – ${A.toTime(A.toMin(r.debut) + r.duree)}` : '……………'}</dd>
          <dt>Durée est.</dt><dd>${A.fdur(A.dureeST(d))}</dd></dl></div>
      </div>
      <div><h3>Travaux à réaliser</h3>
        <table style="margin-top:8px"><thead><tr><th style="width:30px">N°</th><th>Pièce · lot · nature</th><th>Description</th><th style="width:60px">Durée</th><th style="width:64px">Photo</th><th style="width:40px">Fait</th></tr></thead><tbody>
          ${lignes.map((l, i) => `<tr><td>${i + 1}</td><td><strong>${E(l.piece)}</strong><br>${E(A.shortLot(l.lot))} · ${E(l.nature)}</td><td>${E(l.description)}</td><td>${A.fdur(l.duree)}</td><td>${l.photos[0] && l.photos[0] !== 'seed' ? `<img src="${l.photos[0]}" alt="" style="width:56px;height:42px;object-fit:cover">` : A.ic.photo(18)}</td><td>${box(l.statut === 'realisee')}</td></tr>`).join('')}
        </tbody></table></div>
      <div><h3>Consommables à emporter <span style="text-transform:none;font-weight:400;letter-spacing:0;color:#5B6472">· cocher au chargement</span></h3>
        <table style="margin-top:8px"><thead><tr><th style="width:40px">Pris</th><th>Désignation</th><th style="width:50px">Qté</th><th style="width:90px">Origine</th><th style="width:60px">Utilisé</th></tr></thead><tbody>
          ${conso.map(c => `<tr><td>${box(c.pris)}</td><td>${E(c.nom)}</td><td>${c.qte}</td><td>${E(c.origine)}</td><td></td></tr>`).join('')}
          <tr><td>${box()}</td><td>…………………………………</td><td></td><td></td><td></td></tr><tr><td>${box()}</td><td>…………………………………</td><td></td><td></td><td></td></tr>
        </tbody></table></div>
      ${d.observations ? `<div><h3>Observations du demandeur</h3><p style="margin:8px 0 0">${E(d.observations)}</p></div>` : ''}
      <div class="foot"><span>Saisir heures, consommables et photos « après » sur mobile sous 48 h (QR code)</span><span>Recto 1/2</span></div>
    </div>`;

    const supps = rp ? rp.supps || [] : [];
    const verso = `<div class="a4">
      <div><div style="font-size:20px;font-weight:700">COMPTE RENDU D'INTERVENTION</div><div style="font-size:14px;margin-top:4px"><strong>${d.id}</strong>${d.ft ? ' · ' + d.ft : ''}${rp ? ` · <span style="color:#15803D;font-weight:700">saisi sur mobile le ${A.fd(r.date)}</span>` : ''}</div></div>
      <div><h3>Accès au logement</h3><div style="display:flex;gap:22px;flex-wrap:wrap;margin-top:10px">
        <span>${box(!!rp)}Intervention réalisée</span><span>${box(!!imp)}Accès impossible</span>
        ${A.S.ref.motifsAcces.slice(0, 3).map(m => `<span>${box(imp && imp.motifImp === m)}${E(m)}</span>`).join('')}</div></div>
      <div><h3>Main d'œuvre</h3><table style="margin-top:8px"><thead><tr><th>Ouvrier</th><th>Début</th><th>Fin</th><th>Heures</th><th>Déplacements</th></tr></thead><tbody>
        ${rp ? `<tr><td>${E(o.nom)}</td><td>${A.ftime(r.debutReel) || r.debut}</td><td>${A.ftime(r.finReel)}</td><td>${A.fdur(rp.tempsMin)}</td><td>1</td></tr>` : '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>'}
        <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr></tbody></table></div>
      <div><h3>Statut des travaux</h3><table style="margin-top:8px"><thead><tr><th style="width:30px">N°</th><th>Ligne</th><th style="width:80px">Réalisée</th><th style="width:80px">Partielle</th><th style="width:90px">Non réalisée</th></tr></thead><tbody>
        ${lignes.map((l, i) => { const st = rp ? rp.lignes[i] : ''; return `<tr><td>${i + 1}</td><td>${E(l.piece)} · ${E(l.nature)}</td><td>${box(st === 'realisee')}</td><td>${box(st === 'partielle')}</td><td>${box(st === 'non_realisee')}</td></tr>`; }).join('')}
      </tbody></table></div>
      <div><h3>Travaux supplémentaires constatés sur place <span style="text-transform:none;font-weight:400;letter-spacing:0;color:#5B6472">(photo obligatoire sur mobile)</span></h3>
        <table style="margin-top:8px"><thead><tr><th>Pièce</th><th>Travaux</th><th style="width:70px">Temps</th><th style="width:110px">Fait / à prog.</th></tr></thead><tbody>
        ${supps.map(s => `<tr><td>${E(s.piece)}</td><td>${E(A.shortLot(s.lot))} · ${E(s.nature)} — ${E(s.description)}</td><td>${A.fdur(s.duree)}</td><td>${E(s.suiteLabel)}</td></tr>`).join('')}
        ${supps.length ? '' : '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td><td></td></tr>'}</tbody></table></div>
      <div><h3>Matériel utilisé</h3><p style="margin:8px 0 0;min-height:36px">${rp ? E(rp.conso.map(c => `${c.nom} × ${c.qte}`).join(' · ') || 'aucun') : ''}</p></div>
      <div><h3>Observations</h3><p style="margin:8px 0 0;min-height:48px">${rp ? E(rp.obs || '—') : ''}</p></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div><div style="font-size:11px;color:#5B6472;margin-bottom:4px">Signature de l'ouvrier</div><div class="sigbox">${rp ? `<span style="font-style:italic">${E(o.nom)}</span>` : ''}</div></div>
        <div><div style="font-size:11px;color:#5B6472;margin-bottom:4px">Signature occupant ou référent (facultatif)</div><div class="sigbox">${rp && rp.signature ? `<img src="${rp.signature}" alt="Signature">` : rp && rp.signataire ? `<span style="font-style:italic">${E(rp.signataire)}</span>` : ''}</div></div>
      </div>
      <div class="foot"><span>À reporter sur mobile sous 48 h · à défaut, photo de cette fiche jointe par le chef d'équipe</span><span>Verso 2/2</span></div>
    </div>`;
    return recto + verso;
  };

  A.V.fiche = {
    render([ids]) {
      const list = ids.split(',').map(A.D).filter(Boolean);
      return A.layout('', `
        <div class="pagehead noprint">
          <div><div class="crumb"><a href="#/demandes">Demandes</a> › Fiche${list.length > 1 ? 's' : ''} imprimable${list.length > 1 ? 's' : ''}</div><h1>${list.length === 1 ? list[0].id : `${list.length} fiches d'intervention`}</h1></div>
          <div class="row" style="gap:8px">${list.length === 1 ? `<a class="btn" href="#/demande/${list[0].id}">Ouvrir la demande</a>` : ''}<button class="btn btnp" data-act="print" ${list.length ? '' : 'disabled'}>Imprimer (recto / verso)</button></div>
        </div>
        ${list.length ? `<div class="a4wrap">${list.map(pages).join('')}</div>` : '<div class="card pad empty">Aucune fiche à imprimer.</div>'}`);
    },
  };
})(window.App);
