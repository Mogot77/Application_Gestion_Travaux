/* Écrans : planning du service technique et tournées / carte des équipes */
(function (A) {
  const E = A.esc;
  const DAY_MAX = 420; // 7 h par jour et par ouvrier

  const queue = () => A.S.demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut))
    .sort((a, b) => ({ urgent: 0, h48: 1, prog: 2 }[a.urgence] - { urgent: 0, h48: 1, prog: 2 }[b.urgence]) || a.recueLe.localeCompare(b.recueLe));

  const cardCls = d => d.statut === 'acces_impossible' ? 'u' : ({ urgent: 'u', h48: 'h48', prog: 'pg' }[d.urgence]);
  const cardTag = d => d.statut === 'acces_impossible' ? A.chip('REPROG.', 'u') : d.origine === 'supp' ? A.chip('AJOUT SUR PLACE', 'tl') : A.chip(A.URG[d.urgence][2], A.URG[d.urgence][1]);

  const loadBar = (min, max = DAY_MAX) => `<div class="load">${A.fdurS(min)} / ${A.fdurS(max)}<div class="bar"><span class="${min > max ? 'full' : ''}" style="width:${Math.min(100, Math.round(min / max * 100))}%"></span></div></div>`;

  A.V.planning = {
    render(p, q) {
      const ui = A.ui.plan = A.ui.plan || { demandeId: '', ouvrierId: '', date: '', debut: '', rdvSel: '', fUrg: '' };
      if (q.sel && q.sel !== ui.lastQ) {
        ui.lastQ = q.sel; ui.demandeId = q.sel; ui.rdvSel = ''; ui.ouvrierId = ''; ui.date = ''; ui.debut = '';
        if (q.w) A.ui.week = A.weekStart(q.w);
        const d = A.D(q.sel); const r = d && A.nextRdv(d);
        if (d && d.statut !== 'a_planifier' && d.statut !== 'acces_impossible' && r) { ui.demandeId = ''; ui.rdvSel = r.id; A.ui.week = A.weekStart(r.date); }
      }
      const ws = A.ui.week = A.ui.week || A.weekStart(A.TODAY);
      const days = [0, 1, 2, 3, 4].map(i => A.addDays(ws, i));
      const Q = queue().filter(d => !ui.fUrg || d.urgence === ui.fUrg);
      const sel = ui.demandeId && A.D(ui.demandeId);
      const totQ = queue().length;
      const hors = A.S.demandes.filter(d => ['bailleur', 'prestataire'].includes(d.statut)).length;

      const grid = A.ouvActifs().map(o => {
        const week = days.reduce((s, dt) => s + A.chargeOf(o.id, dt), 0);
        return `<div class="wk"><strong>${E(o.nom)}</strong>${E(o.metier)}${loadBar(week, DAY_MAX * 5)}</div>` + days.map(dt => {
          const list = A.rdvsOf(o.id, dt);
          let load = A.chargeOf(o.id, dt);
          const ghost = sel && ui.ouvrierId === o.id && ui.date === dt;
          if (ghost) load += A.dureeST(sel);
          const blocks = list.map(r => {
            const icon = { done: '✓ ', running: '▶ ', imp: '⚠ ', planned: '' }[r.etat];
            const cls = r.etat === 'imp' ? 'imp' : `${A.rdvClass(r)}${r.etat === 'done' ? ' done' : ''}`;
            return `<div class="blk ${cls}${ui.rdvSel === r.id ? ' sel' : ''}" data-act="selRdv" data-id="${r.id}" title="${r.debut} · ${E(r.label)}"><span>${icon}${E(r.label)}</span><span>${r.etat === 'imp' ? 'Accès impossible' : A.fdurS(r.duree)}</span></div>`;
          }).join('');
          const gh = ghost ? `<div class="blk ghost"><span>${sel.id.slice(-4)} ${E(sel.lignes[0].nature)}</span><span>${A.fdurS(A.dureeST(sel))}</span></div>` : '';
          return `<div class="cell${dt === A.TODAY ? ' today' : ''}" data-act="cell" data-o="${o.id}" data-d="${dt}" data-drop="1">${blocks}${gh}${!list.length && !ghost ? '<span class="avail">Disponible</span>' : ''}${loadBar(load)}</div>`;
        }).join('');
      }).join('');

      return A.layout('planning', `
        <div class="pagehead">
          <div class="t"><h1 style="margin-right:6px">Planning du service technique</h1>
            <button class="btn btn-sm" data-act="week" data-v="-7" aria-label="Semaine précédente">‹</button>
            <strong>${A.parse(days[0]).getDate()} – ${A.fdayLong(days[4]).replace(/^\S+ /, '')} ${days[4].slice(0, 4)}</strong>
            <button class="btn btn-sm" data-act="week" data-v="7" aria-label="Semaine suivante">›</button>
            ${ws !== A.weekStart(A.TODAY) ? '<button class="linkbtn s13" data-act="week" data-v="0">Cette semaine</button>' : ''}
          </div>
          <div class="row" style="gap:10px">
            <span class="muted s13">Agendas Outlook synchronisés à ${A.nowTime()}</span>
            <div class="seg" style="width:auto"><button class="on" style="padding:0 14px">Semaine</button><button style="padding:0 14px" data-act="goMap">Carte</button></div>
            <a class="btn" href="#/fiche/${A.S.rdvs.filter(r => r.date === A.TODAY && r.demandeId && r.etat === 'planned').map(r => r.demandeId).join(',') || 'none'}">Imprimer les fiches du jour</a>
          </div>
        </div>
        <div class="plan">
          <aside class="card plan-q">
            <div class="row between"><strong>À planifier</strong><span class="muted s13">${totQ} demande${totQ > 1 ? 's' : ''}</span></div>
            <div class="row" style="gap:6px">${['', 'urgent', 'h48', 'prog'].map(k => `<button class="btn btn-sm${ui.fUrg === k ? ' btnp' : ''}" data-act="fUrg" data-v="${k}">${k ? A.URG[k][0] : 'Toutes'}</button>`).join('')}</div>
            ${Q.map(d => { const log = A.Log(d.logementId); const l0 = d.lignes[0]; const imp = A.S.rdvs.find(r => r.demandeId === d.id && r.etat === 'imp');
              return `<div class="q ${cardCls(d)}${ui.demandeId === d.id ? ' sel' : ''}" draggable="true" data-drag="${d.id}" data-act="selQ" data-id="${d.id}">
                <div class="row between"><strong>${d.id}</strong>${cardTag(d)}</div>
                <div class="muted">${E(log.ville)} (${log.dept}) · ${E(log.typo)} · ${log.id}</div>
                <div>${E(l0.piece)} — ${E(A.shortLot(l0.lot))} · ${E(l0.nature)}${d.lignes.length > 1 ? ' · +' + (d.lignes.length - 1) : ''}</div>
                <div class="muted">${imp ? `Accès impossible le ${A.fd(imp.date)} (${E(imp.motifImp || '')})` : `Durée estimée ${A.fdur(A.dureeST(d))}`}</div>
              </div>`; }).join('') || '<div class="empty">Rien à planifier 🎉</div>'}
            <p class="muted small" style="margin:4px 0 0">Glisser une carte sur un créneau : l'ouvrier est affecté et le rendez-vous part dans son agenda.</p>
          </aside>
          <section class="card plan-g">
            <div class="pgrid">
              <div class="hd">Ouvriers</div>
              ${days.map(dt => `<div class="hd${dt === A.TODAY ? ' today' : ''}">${A.dayShort(dt)} ${A.parse(dt).getDate()}${dt === A.TODAY ? " · aujourd'hui" : ''}</div>`).join('')}
              ${grid}
            </div>
            <div class="row between muted small" style="padding:10px 14px">
              <span>✓ réalisée · ▶ en cours · ⚠ accès impossible · pointillé : en cours de planification</span>
              <span>Hors planning ST : ${hors} intervention${hors > 1 ? 's' : ''} bailleur / prestataire</span>
            </div>
          </section>
          <aside class="card plan-s">${sel ? panelPlan(sel, ui, days) : ui.rdvSel && A.Rdv(ui.rdvSel) ? panelRdv(A.Rdv(ui.rdvSel)) : `<div class="muted s13">Sélectionnez une demande à planifier (ou glissez-la sur un créneau), ou cliquez sur un rendez-vous pour le consulter.</div>`}</aside>
        </div>`);
    },
    after(root) {
      root.querySelectorAll('[data-drag]').forEach(el => el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', el.dataset.drag); e.dataTransfer.effectAllowed = 'move'; }));
      root.querySelectorAll('[data-drop]').forEach(el => {
        el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
        el.addEventListener('dragleave', () => el.classList.remove('over'));
        el.addEventListener('drop', e => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/plain'); if (!A.D(id)) return;
          Object.assign(A.ui.plan, { demandeId: id, rdvSel: '', ouvrierId: el.dataset.o, date: el.dataset.d, debut: A.firstFree(el.dataset.o, el.dataset.d) });
          A.render();
        });
      });
    },
    acts: {
      week(el) { const v = Number(el.dataset.v); A.ui.week = v ? A.addDays(A.ui.week, v) : A.weekStart(A.TODAY); A.render(); },
      goMap() { A.go('#/tournees'); },
      fUrg(el) { A.ui.plan.fUrg = el.dataset.v; A.render(); },
      selQ(el) { const ui = A.ui.plan; if (ui.demandeId !== el.dataset.id) Object.assign(ui, { demandeId: el.dataset.id, rdvSel: '', ouvrierId: '', date: '', debut: '' }); A.render(); },
      selRdv(el, e) { e.stopPropagation(); Object.assign(A.ui.plan, { rdvSel: el.dataset.id, demandeId: '' }); A.render(); },
      cell(el) {
        const ui = A.ui.plan;
        if (!ui.demandeId) return;
        Object.assign(ui, { ouvrierId: el.dataset.o, date: el.dataset.d, debut: A.firstFree(el.dataset.o, el.dataset.d) });
        A.render();
      },
      pOuv(el) { const ui = A.ui.plan; ui.ouvrierId = el.value; if (ui.date) ui.debut = A.firstFree(ui.ouvrierId, ui.date); A.render(); },
      pDate(el) { const ui = A.ui.plan; ui.date = el.value; if (ui.ouvrierId && ui.date) ui.debut = A.firstFree(ui.ouvrierId, ui.date); if (ui.date) A.ui.week = A.weekStart(ui.date); A.render(); },
      pDeb(el) { A.ui.plan.debut = el.value; A.render(); },
      pConsoDel(el) { A.D(A.ui.plan.demandeId).consommables.splice(+el.dataset.i, 1); A.save(); A.render(); },
      pConsoPris(el) { A.D(A.ui.plan.demandeId).consommables[+el.dataset.i].pris = el.checked; A.save(); },
      pConsoAdd() {
        const nom = document.getElementById('cnom').value.trim(); if (!nom) return A.toast('Désignation du consommable ?', 'err');
        A.D(A.ui.plan.demandeId).consommables.push({ nom, qte: Number(document.getElementById('cqte').value) || 1, origine: document.getElementById('corg').value, pris: false });
        A.save(); A.render();
      },
      pCancel() { Object.assign(A.ui.plan, { demandeId: '', ouvrierId: '', date: '', debut: '', lastQ: A.ui.plan.lastQ }); A.render(); },
      planifier() {
        const ui = A.ui.plan; const d = A.D(ui.demandeId); const o = A.Ouv(ui.ouvrierId);
        if (!d || !o || !ui.date || !ui.debut) return A.toast('Choisissez un ouvrier, une date et un créneau', 'err');
        const dur = A.dureeST(d);
        const r = { id: 'R' + Date.now(), ouvrierId: o.id, date: ui.date, debut: ui.debut, duree: dur, label: `${d.id.slice(-4)} ${d.lignes[0].nature.split(' ')[0]}`, etat: 'planned', demandeId: d.id };
        A.S.rdvs.push(r);
        d.ft = d.ft || A.nextId('ft');
        d.statut = 'planifiee';
        d.lignes.forEach(l => { if (l.circuit === 'ST' && !l.statut) l.statut = 'planifiee'; });
        A.hist(d, `Planifiée ${A.fday(ui.date)} ${ui.debut} · ${o.nom}`);
        A.hist(d, `Rendez-vous envoyé dans l'agenda Outlook de ${o.nom} · statut visible par l'établissement`);
        Object.assign(ui, { demandeId: '', ouvrierId: '', date: '', debut: '', rdvSel: r.id });
        A.saveNow(); A.toast(`${d.id} planifiée ${A.fday(r.date)} à ${r.debut} avec ${o.nom}`, 'ok'); A.render();
      },
      rdvCancel(el) {
        const r = A.Rdv(el.dataset.id); const d = r.demandeId && A.D(r.demandeId);
        A.S.rdvs = A.S.rdvs.filter(x => x.id !== r.id);
        if (d && !A.S.rdvs.some(x => x.demandeId === d.id && x.etat === 'planned')) { d.statut = 'a_planifier'; A.hist(d, `Rendez-vous du ${A.fday(r.date)} annulé · à replanifier`); }
        A.ui.plan.rdvSel = ''; A.saveNow(); A.toast('Rendez-vous annulé'); A.render();
      },
      rdvMove(el) {
        const r = A.Rdv(el.dataset.id); const d = A.D(r.demandeId);
        A.S.rdvs = A.S.rdvs.filter(x => x.id !== r.id);
        d.statut = 'a_planifier'; A.hist(d, `Rendez-vous du ${A.fday(r.date)} déplacé`);
        Object.assign(A.ui.plan, { rdvSel: '', demandeId: d.id, ouvrierId: r.ouvrierId, date: r.date, debut: r.debut });
        A.save(); A.render();
      },
      rdvMobile(el) { const r = A.Rdv(el.dataset.id); A.S.mobile = { ouvrierId: r.ouvrierId, day: r.date }; A.save(); A.go('#/m/mission/' + r.id); },
    },
  };

  function panelPlan(d, ui, days) {
    const log = A.Log(d.logementId);
    const dur = A.dureeST(d);
    const debs = []; for (let t = A.toMin('07:30'); t <= A.toMin('17:00'); t += 30) debs.push(A.toTime(t));
    const fin = ui.debut ? A.toTime(A.toMin(ui.debut) + dur) : '';
    let warn = '';
    if (ui.ouvrierId && ui.date && ui.debut) {
      const s = A.toMin(ui.debut), e = s + dur;
      const clash = A.rdvsOf(ui.ouvrierId, ui.date).find(r => r.etat !== 'imp' && s < A.toMin(r.debut) + r.duree && A.toMin(r.debut) < e);
      if (clash) warn = `Chevauche ${clash.label} (${clash.debut}).`;
      else if (A.chargeOf(ui.ouvrierId, ui.date) + dur > DAY_MAX) warn = 'Dépasse 7 h sur la journée.';
      if (ui.date < A.TODAY) warn = 'Date passée.';
    }
    return `
      <div class="small muted" style="font-weight:700;letter-spacing:.05em">FICHE MISSION</div>
      <div class="row between"><strong style="font-size:16px"><a href="#/demande/${d.id}">${d.id}</a></strong>${cardTag(d)}</div>
      <div class="s13">${log.id} · ${E(log.typo)} · ${E(log.ville)} (${log.dept})<div class="muted">${E(A.logAdr(log))} · clés : ${E((d.lieuCles || '').toLowerCase())}</div></div>
      <div class="s13" style="line-height:1.6">${d.lignes.filter(l => l.circuit === 'ST' || !l.circuit).map((l, i) => `<strong>${i + 1} · ${E(l.piece)} — ${E(l.nature)}</strong> · ${A.fdur(l.duree)}`).join('<br>')}</div>
      <div><span class="lbl">Durée estimée (coordinatrice)</span><div class="in ro"><strong>${A.fdur(dur)}</strong><span class="muted small">somme des lignes</span></div></div>
      <div><label class="lbl" for="pouv">Ouvrier</label><select class="in" id="pouv" data-ch="pOuv">${A.opts(A.ouvActifs().map(o => { const c = ui.date ? A.chargeOf(o.id, ui.date) : null; return { v: o.id, l: `${o.nom} — ${o.metier}${c != null ? ` · ${c >= DAY_MAX ? 'complet' : A.fdurS(c) + ' / 7h'}` : ''}` }; }), ui.ouvrierId, 'Choisir…')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 110px;gap:10px">
        <div><label class="lbl" for="pdate">Date</label><input class="in" type="date" id="pdate" data-ch="pDate" value="${ui.date}" min="${A.TODAY}"></div>
        <div><label class="lbl" for="pdeb">Début</label><select class="in" id="pdeb" data-ch="pDeb">${A.opts(debs, ui.debut, '—')}</select></div>
      </div>
      ${ui.debut && ui.date ? `<div class="s13">Créneau : <strong>${A.fday(ui.date)} · ${ui.debut} – ${fin}</strong></div>` : ''}
      ${warn ? `<div class="note warn">${E(warn)}</div>` : ''}
      <div><span class="lbl">Consommables à prévoir</span>
        ${d.consommables.map((c, i) => `<div class="row between s13" style="padding:4px 0;flex-wrap:nowrap"><label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-ch="pConsoPris" data-i="${i}" ${c.pris ? 'checked' : ''}> ${E(c.nom)} × ${c.qte} · <span class="${c.origine === 'Stock' ? 'muted' : ''}" style="${c.origine === 'Stock' ? '' : 'color:#B54708;font-weight:600'}">${E(c.origine.toLowerCase())}</span></label><button class="linkbtn small" data-act="pConsoDel" data-i="${i}">×</button></div>`).join('') || '<div class="muted small">Aucun</div>'}
        <div style="display:grid;grid-template-columns:minmax(0,1fr) 46px 92px;gap:6px;margin-top:6px">
          <input class="in sm" id="cnom" placeholder="Désignation"><input class="in sm" id="cqte" type="number" min="1" value="1" aria-label="Quantité"><select class="in sm" id="corg">${A.opts(['Stock', 'À acheter'])}</select>
        </div>
        <button class="btn btn-sm" style="margin-top:6px" data-act="pConsoAdd">+ Ajouter</button>
      </div>
      <button class="btn btnp btn-w" data-act="planifier" ${ui.ouvrierId && ui.date && ui.debut ? '' : 'disabled'}>Planifier et envoyer à l'agenda</button>
      <div class="row" style="gap:8px"><a class="btn btn-sm" href="#/fiche/${d.id}">Imprimer</a><a class="btn btn-sm" href="#/demande/${d.id}">Ouvrir</a><button class="linkbtn small" data-act="pCancel">Fermer</button></div>`;
  }

  function panelRdv(r) {
    const o = A.Ouv(r.ouvrierId); const d = r.demandeId && A.D(r.demandeId); const log = d && A.Log(d.logementId);
    const et = { done: ['Réalisée', 'ok'], running: ['En cours', 'ok'], planned: ['Prévue', 'pg'], imp: ['Accès impossible', 'u'] }[r.etat];
    return `
      <div class="small muted" style="font-weight:700;letter-spacing:.05em">RENDEZ-VOUS</div>
      <div class="row between"><strong style="font-size:16px">${d ? `<a href="#/demande/${d.id}">${d.id}</a>` : E(r.label)}</strong>${A.chip(et[0], et[1])}</div>
      ${A.kv([['Ouvrier', E(o.nom)], ['Date', A.fday(r.date)], ['Horaire', `${r.debut} – ${A.toTime(A.toMin(r.debut) + r.duree)}`], ['Logement', log ? `${log.id} · ${E(log.ville)}` : '—'], ['Travaux', d ? E(d.lignes.map(l => l.piece + ' · ' + l.nature).join(', ')) : E(r.label)]])}
      ${r.motifImp ? `<div class="note warn">Accès impossible : ${E(r.motifImp)}</div>` : ''}
      ${r.rapport ? `<div class="note">Temps passé ${A.fdur(r.rapport.tempsMin)} · ${r.rapport.conso.length} consommable(s)</div>` : ''}
      <div class="row" style="gap:8px">
        ${d ? `<a class="btn btn-sm" href="#/fiche/${d.id}">${r.rapport ? 'Rapport' : 'Fiche'}</a>` : ''}
        ${d && r.etat !== 'imp' ? `<button class="btn btn-sm" data-act="rdvMobile" data-id="${r.id}">Voir sur mobile</button>` : ''}
        ${d && r.etat === 'planned' ? `<button class="btn btn-sm" data-act="rdvMove" data-id="${r.id}">Déplacer</button>` : ''}
        ${r.etat === 'planned' ? `<button class="btn btn-sm btnd" data-act="rdvCancel" data-id="${r.id}">Annuler</button>` : ''}
      </div>`;
  }

  /* =====================================================================
     Tournées et position estimée des équipes
     ===================================================================== */
  const C = A.carto;
  const DEPOT = C.DEPOT, posLog = C.posLog, dist = C.km, tripMin = C.tripMin;

  const teamState = o => {
    const list = A.rdvsOf(o.id, A.TODAY).filter(r => r.demandeId);
    const run = list.find(r => r.etat === 'running');
    const done = list.filter(r => r.etat === 'done' || r.etat === 'imp');
    const next = list.find(r => r.etat === 'planned');
    if (run) { const l = A.Log(A.D(run.demandeId).logementId); return { pos: posLog(l.id), txt: `En mission depuis ${A.ftime(run.debutReel) || run.debut} · ${l.ville}`, short: `En mission · ${A.D(run.demandeId).id.slice(3)} · ${l.ville}`, busy: true }; }
    const last = done[done.length - 1];
    if (last) {
      const l = A.Log(A.D(last.demandeId).logementId);
      if (next) { const ln = A.Log(A.D(next.demandeId).logementId); return { pos: [(posLog(l.id)[0] + posLog(ln.id)[0]) / 2, (posLog(l.id)[1] + posLog(ln.id)[1]) / 2], txt: `En trajet vers ${ln.ville} · rdv ${next.debut}`, short: `En trajet · arrivée ≈ ${next.debut}`, busy: true }; }
      return { pos: posLog(l.id), txt: `Dernière fin ${A.ftime(last.finReel) || A.toTime(A.toMin(last.debut) + last.duree)} · ${l.ville}`, short: `Disponible · près de ${l.ville}`, busy: false };
    }
    if (next) { const ln = A.Log(A.D(next.demandeId).logementId); return { pos: DEPOT, txt: `Au dépôt · prochain rdv ${next.debut} à ${ln.ville}`, short: `Au dépôt · départ pour ${ln.ville}`, busy: false }; }
    return { pos: DEPOT, txt: 'Au dépôt', short: 'Disponible · dépôt', busy: false };
  };

  // Contenu de la carte : missions du jour par ouvrier, trajets de l'ouvrier sélectionné, positions estimées des équipes
  const mapSpec = (ouvs, hide, tour) => {
    const markers = [
      { pos: C.DEPOT, html: C.base('D'), size: [26, 26], title: 'Dépôt ST · Vaux-le-Pénil' },
      { pos: C.BUREAU, html: C.base('B'), size: [26, 26], title: 'Bureau · Meaux' },
    ];
    const lines = [];
    ouvs.forEach((o, k) => {
      if (hide.includes(o.id)) return;
      const list = A.rdvsOf(o.id, A.TODAY).filter(r => r.demandeId);
      list.forEach((r, i) => {
        const d = A.D(r.demandeId); const log = A.Log(d.logementId);
        const lbl = r.etat === 'done' ? '✓' : r.etat === 'imp' ? '!' : String(i + 1);
        const fill = r.etat === 'done' ? '#9CA3AF' : r.etat === 'imp' ? '#B42318' : o.color;
        markers.push({ pos: posLog(log), html: C.pin(lbl, fill, 26), size: [26, 26], title: `${d.id} · ${d.lignes[0].nature}`,
          popup: `<strong>${E(d.id)}</strong> · ${E(r.debut)}<br>${E(log.id)} · ${E(A.logAdr(log))}, ${E(log.ville)}<br>${E(d.lignes[0].piece)} — ${E(d.lignes[0].nature)}<br><span style="color:#5B6472">${E(o.nom)}</span><br><a href="#/demande/${E(d.id)}">Ouvrir la demande</a>` });
      });
      if (o.id === tour) {
        const pts = [DEPOT, ...list.map(r => posLog(A.D(r.demandeId).logementId))];
        for (let i = 1; i < pts.length; i++) {
          const km = dist(pts[i - 1], pts[i]);
          lines.push({ pts: [pts[i - 1], pts[i]], color: o.color, dashed: true, label: km > 2 ? `${tripMin(km)} min · ${Math.round(km)} km` : '' });
        }
      }
      const st = teamState(o);
      const ang = -Math.PI / 2 + k * (2 * Math.PI / ouvs.length), dx = Math.cos(ang) * 27, dy = Math.sin(ang) * 27; // décalage en pixels : équipes au même endroit restent lisibles
      markers.push({ pos: st.pos, html: C.avatar(A.initials(o.nom), o.color), size: [34, 34], anchor: [17 - dx, 17 - dy], z: 1000, title: `${o.nom} · ${st.txt}`, onClick: () => { A.ui.tour.ouv = o.id; A.render(); } });
    });
    A.S.demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut) && d.urgence !== 'prog').forEach(d => {
      markers.push({ pos: posLog(d.logementId), html: C.pin(d.urgence === 'urgent' ? '!' : '·', '#6B7280', 26), size: [26, 26], title: `${d.id} · non affectée`, popup: `<strong>${E(d.id)}</strong> · non affectée<br><a href="#/planning?sel=${E(d.id)}">Planifier</a>` });
    });
    return { key: 'tour', markers, lines };
  };

  A.V.tournees = {
    after() {
      const ui = A.ui.tour; if (!ui) return;
      C.mount(document.getElementById('carto'), mapSpec(A.ouvActifs(), ui.hide, ui.ouv));
    },
    render() {
      const ui = A.ui.tour = A.ui.tour || { hide: [], ouv: 'o1' };
      const ouvs = A.ouvActifs();
      if (!ouvs.some(x => x.id === ui.ouv)) ui.ouv = ouvs.length ? ouvs[0].id : '';
      const o = A.Ouv(ui.ouv) || { id: '', nom: 'Aucun ouvrier actif', metier: '', color: '#9AA3B0' };
      const tourList = A.rdvsOf(o.id, A.TODAY).filter(r => r.demandeId);
      const urgent = A.S.demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut) && d.urgence === 'urgent')[0];
      let nearest = null;
      if (urgent) {
        const p = posLog(urgent.logementId);
        nearest = ouvs.filter(x => A.chargeOf(x.id, A.TODAY) < DAY_MAX).map(x => ({ o: x, km: dist(teamState(x).pos, p) })).sort((a, b) => a.km - b.km)[0];
      }
      let prev = DEPOT;
      const timeline = [`<div class="tline"><span class="t">08:00</span><div>Départ dépôt · Vaux-le-Pénil</div></div>`].concat(tourList.map(r => {
        const d = A.D(r.demandeId); const pos = posLog(d.logementId); const km = dist(prev, pos); prev = pos;
        const icon = { done: '✓ ', running: '▶ ', imp: '⚠ ', planned: '' }[r.etat];
        return `<div class="trip">${km > 1 ? `Trajet estimé ${tripMin(km)} min · ${Math.round(km)} km` : 'Même secteur'}</div>
          <div class="tline"><span class="t">${r.debut}</span><div>${icon}<a href="#/demande/${d.id}">${d.id.replace('2026-', '')}</a> · ${E(d.lignes[0].nature)} · ${E(A.Log(d.logementId).ville)}</div></div>`;
      })).join('');

      return A.layout('planning', `
        <div class="pagehead">
          <div class="t"><h1>Tournées et position des équipes</h1>
            <div class="seg" style="width:auto"><button style="padding:0 14px" data-act="goCal">Calendrier</button><button class="on" style="padding:0 14px">Carte</button></div>
            <strong>${A.fdayLong(A.TODAY)} ${A.TODAY.slice(0, 4)} · ${A.nowTime()}</strong></div>
          <div class="row" style="gap:6px">${ouvs.map(x => `<button class="tg${ui.hide.includes(x.id) ? ' off' : ''}" data-act="tgOuv" data-id="${x.id}"><i style="background:${x.color}"></i>${E(x.nom)}</button>`).join('')}</div>
        </div>
        <div class="cols">
          <section class="card" style="flex:999 1 620px;min-width:0">
            <div id="carto" class="carto" role="application" aria-label="Carte des missions du jour et position estimée des équipes"></div>
            <div class="row between muted small" style="padding:10px 14px">
              <span>Rond coloré avec initiales : position estimée de l'équipe · rond numéroté : mission du jour (✓ réalisée, gris : non affectée) · D : dépôt ST · B : bureau Meaux</span>
              <span>Fond OpenStreetMap · bouton en haut à droite de la carte pour la vue satellite</span>
            </div>
          </section>
          <aside class="col-side">
            <div class="card pad"><h2 class="h2" style="margin-bottom:6px">Équipes en ce moment</h2>
              ${ouvs.map(x => { const st = teamState(x); const c = A.chargeOf(x.id, A.TODAY); return `<div class="team-row" data-act="tourOuv" data-id="${x.id}" ${x.id === ui.ouv ? 'style="background:#F5F8FF"' : ''}><i class="av" style="background:${x.color}">${A.initials(x.nom)}</i><div><strong>${E(x.nom)}</strong> · ${E(x.metier)}<div class="muted small">${E(st.txt)}</div></div><span class="small" style="${c > DAY_MAX ? 'color:#B42318;font-weight:700' : ''}">${A.fdur(c)} / 7 h</span></div>`; }).join('')}
            </div>
            <div class="card pad" style="${urgent ? 'border-color:#E9A79F;background:#FFFBFA' : ''}">
              ${urgent ? `<strong style="color:#B42318">Urgence non affectée · ${E(A.Log(urgent.logementId).ville)}</strong>
                <p class="s13" style="margin:6px 0 12px">${urgent.id} · ${E(urgent.lignes[0].nature.toLowerCase())}. ${nearest ? `Équipe la plus proche : ${E(nearest.o.nom)}, ≈ ${tripMin(nearest.km)} min.` : 'Aucune équipe disponible aujourd\'hui.'}</p>
                ${nearest ? `<button class="btn btnp btn-w" data-act="affecter" data-id="${urgent.id}" data-o="${nearest.o.id}">Affecter à ${E(nearest.o.nom)}</button>` : ''}`
                : `<strong>Aucune urgence non affectée</strong><p class="muted s13" style="margin:6px 0 0">Les urgences à planifier apparaissent ici avec l'équipe la plus proche.</p>`}
            </div>
            <div class="card pad"><div class="row between" style="margin-bottom:8px"><h2 class="h2">${E(o.nom)} · tournée du jour</h2><span class="muted small">véhicule de service</span></div>
              ${timeline}
              <p class="muted small" style="margin:10px 0 0">Les trajets sont ajoutés automatiquement dans son agenda Outlook entre les rendez-vous.</p>
            </div>
          </aside>
        </div>
        <div class="note info" style="margin-top:16px">${A.ic.info()}<span><strong>Position des équipes estimée, sans suivi GPS :</strong> elle est déduite de la dernière mission démarrée ou terminée sur l'application mobile, et du trajet en cours. Un suivi GPS en temps réel reste possible en option, mais impose information des salariés, consultation du CSE et inscription au registre RGPD.</span></div>`);
    },
    acts: {
      goCal() { A.go('#/planning'); },
      tgOuv(el) { const h = A.ui.tour.hide; const i = h.indexOf(el.dataset.id); if (i >= 0) h.splice(i, 1); else h.push(el.dataset.id); A.render(); },
      tourOuv(el) { A.ui.tour.ouv = el.dataset.id; A.ui.tour.hide = A.ui.tour.hide.filter(x => x !== el.dataset.id); A.render(); },
      affecter(el) {
        A.ui.plan = Object.assign(A.ui.plan || {}, { demandeId: el.dataset.id, rdvSel: '', ouvrierId: el.dataset.o, date: A.TODAY, debut: A.firstFree(el.dataset.o, A.TODAY), lastQ: el.dataset.id });
        A.ui.week = A.weekStart(A.TODAY);
        A.go('#/planning');
      },
    },
  };
})(window.App);
