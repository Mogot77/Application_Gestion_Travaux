/* Application mobile : ouvriers (missions, démarrage, fin, travaux supplémentaires, rapport) et constat d'état (tout salarié) */
(function (A) {
  const E = A.esc;
  const NOBODY = { id: '', nom: 'Aucun ouvrier', metier: '', color: '#9AA3B0' };
  const me = () => A.Ouv(A.S.mobile.ouvrierId) || A.ouvActifs()[0] || NOBODY;

  const tabbar = on => {
    const run = A.S.rdvs.find(r => r.ouvrierId === me().id && r.etat === 'running');
    const items = [['missions', 'Missions', '#/m/missions', A.ic.list], ['constat', 'Constat', '#/m/constat', A.ic.home], ['signaler', 'Signaler', run ? `#/m/supplement/${run.id}` : '#/m/missions?sig=1', A.ic.plus], ['profil', 'Profil', '#/m/profil', A.ic.user]];
    return `<nav class="tabbar" aria-label="Navigation">${items.map(([k, l, h, ic]) => `<a href="${h}" class="${on === k ? 'on' : ''}">${ic(on === k ? '#1D4ED8' : '#5B6472')}${l}</a>`).join('')}</nav>`;
  };
  const shell = (inner, tab) => `<div class="mshell">
      <div class="mshell-bar noprint"><a href="#/planning">← Interface bureau</a><span class="muted">Application mobile · ${E(me().nom)}</span></div>
      <div class="phone"><div class="phone-scroll">${inner}</div>${tab ? tabbar(tab) : ''}</div></div>`;
  const back = (href, title, sub, right = '') => `<div class="mhead white"><a class="mback" href="${href}" aria-label="Retour">${A.ic.back()}</a><div style="flex:1;min-width:0"><div class="s">${sub}</div><h1>${title}</h1></div>${right}</div>`;
  const elapsed = r => { if (!r.debutReel) return 0; let m = A.toMin(A.nowTime()) - A.toMin(A.ftime(r.debutReel)); if (r.debutReel.slice(0, 10) !== A.TODAY) m += 1440 * A.diffDays(r.debutReel, A.TODAY); return Math.max(0, m); };
  const stLines = d => d.lignes.map((l, i) => ({ l, i })).filter(x => x.l.circuit === 'ST' || !x.l.circuit);

  const initWork = (r, d) => {
    if (r.work) return r.work;
    r.work = { lignes: {}, motifs: {}, apres: {}, conso: d.consommables.filter(c => c.pris || c.origine === 'Stock').map(c => ({ nom: c.nom, qte: c.qte })), supps: [], obs: '', signature: '', signataire: '', corr: null };
    return r.work;
  };

  /* =====================================================================
     M1 · Mes missions
     ===================================================================== */
  A.V.m_missions = {
    render(p, q) {
      const o = me(); const day = A.S.mobile.day || A.TODAY;
      const ws = A.weekStart(A.TODAY); const days = [0, 1, 2, 3, 4].map(i => A.addDays(ws, i));
      const list = A.rdvsOf(o.id, day);
      const tomorrow = A.addDays(day, A.parse(day).getDay() === 5 ? 3 : 1);
      const next = A.rdvsOf(o.id, tomorrow);
      const tot = list.reduce((s, r) => s + r.duree, 0);
      if (q.sig) setTimeout(() => A.toast('Démarrez une mission pour signaler des travaux supplémentaires'));
      const card = r => {
        const d = r.demandeId && A.D(r.demandeId); const log = d && A.Log(d.logementId);
        const chip = r.etat === 'done' ? A.chip('Terminée', 'ok') : r.etat === 'running' ? `<span class="chip ok" id="runchip" data-start="${r.debutReel}">En cours · ${A.fdur(elapsed(r))}</span>` : r.etat === 'imp' ? A.chip('Accès impossible', 'u') : d ? A.urgChip(d.lignes[0].urgence || d.urgence) : A.chip('Prévue', 'pg');
        const href = !d ? '' : r.etat === 'done' ? `#/m/rapport/${r.id}` : r.etat === 'running' ? `#/m/terminer/${r.id}` : `#/m/mission/${r.id}`;
        const body = d ? `<div style="font-weight:600">${E(d.lignes[0].piece)} · ${E(A.shortLot(d.lignes[0].lot))} — ${E(d.lignes[0].nature)}${d.lignes.length > 1 ? ' + ' + (d.lignes.length - 1) : ''}</div>
            <div class="muted" style="margin-top:2px">${E(log.ville)} · ${E(A.logAdr(log))}${r.etat === 'done' ? ' · rapport envoyé' : ''}</div>
            ${r.etat === 'planned' ? `<div class="row muted small" style="gap:10px;margin-top:8px"><span>Durée est. ${A.fdur(r.duree)}</span><span>${d.consommables.length} consommable${d.consommables.length > 1 ? 's' : ''}</span><span>${A.nbPhotos(d)} photo${A.nbPhotos(d) > 1 ? 's' : ''}</span></div>` : ''}
            ${r.etat === 'running' ? '<div class="mbtn green" style="height:40px;font-size:14px;margin-top:10px">Reprendre la mission</div>' : ''}`
          : `<div class="muted">${E(r.label)} · ${A.fdur(r.duree)}</div>`;
        const tag = href ? 'a' : 'div';
        return `<${tag} class="mc${r.etat === 'running' ? ' run' : ''}${r.etat === 'done' ? ' done' : ''}" ${href ? `href="${href}"` : ''}><div class="r1"><strong>${r.debut} · ${d ? d.id : 'Mission'}</strong>${chip}</div>${body}</${tag}>`;
      };
      return shell(`
        <div class="mhead"><div class="s">${E(o.nom)} · ${E(o.metier)}</div><h1>Mes missions</h1></div>
        <div class="days">${days.map(dt => `<button class="day${dt === day ? ' on' : ''}" data-act="mDay" data-v="${dt}">${A.dayShort(dt)}<b>${A.parse(dt).getDate()}</b></button>`).join('')}</div>
        <div class="mbody">
          <div class="row between s13"><strong>${list.length} mission${list.length > 1 ? 's' : ''} ${day === A.TODAY ? "aujourd'hui" : 'le ' + A.fday(day)}</strong><span class="muted">${A.fdur(tot)} estimées</span></div>
          ${list.map(card).join('') || '<div class="empty">Aucune mission ce jour-là.</div>'}
          ${next.length ? `<div class="small muted" style="font-weight:700;letter-spacing:.05em;margin-top:6px">${tomorrow === A.addDays(A.TODAY, 1) ? 'DEMAIN' : A.fday(tomorrow).toUpperCase()}</div>${next.map(card).join('')}` : ''}
        </div>`, 'missions');
    },
    after() {
      const el = document.getElementById('runchip');
      if (el) A.timer = setInterval(() => { el.textContent = 'En cours · ' + A.fdur(elapsed({ debutReel: el.dataset.start })); }, 15000);
    },
    acts: { mDay(el) { A.S.mobile.day = el.dataset.v; A.save(); A.render(); } },
  };

  /* =====================================================================
     M2 · Détail et démarrage
     ===================================================================== */
  A.V.m_mission = {
    render([rid]) {
      const r = A.Rdv(rid); const d = r && r.demandeId && A.D(r.demandeId);
      if (!d) return shell('<div class="mbody"><div class="empty">Mission introuvable. <a href="#/m/missions">Retour</a></div></div>', 'missions');
      const log = A.Log(d.logementId);
      const lines = stLines(d);
      const running = A.S.rdvs.find(x => x.ouvrierId === r.ouvrierId && x.etat === 'running' && x.id !== r.id);
      const canStart = r.etat === 'planned' && r.date === A.TODAY;
      const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${log.adresse}, ${log.cp} ${log.ville}`);
      return shell(`
        ${back('#/m/missions', d.id, `${r.date === A.TODAY ? "Aujourd'hui" : A.fday(r.date)} · ${r.debut} – ${A.toTime(A.toMin(r.debut) + r.duree)}`, A.urgChip(d.lignes[0].urgence || d.urgence))}
        <div class="mbody">
          <div class="msec"><div class="k">Adresse</div><div style="font-weight:700;font-size:16px">${E(A.logAdr(log))}</div><div class="muted s13">${E(log.cp)} ${E(log.ville)} · ${log.id} · ${E(log.typo)}</div>
            <div class="row" style="gap:8px;margin-top:12px"><a class="mbtn sec" style="flex:1" href="${maps}" target="_blank" rel="noopener">${A.ic.nav()} Itinéraire</a><a class="mbtn sec" style="flex:1" href="tel:${E((d.tel || '').replace(/\s/g, ''))}">${A.ic.tel()} Référent</a></div>
            <div class="muted small" style="margin-top:6px">Référent : ${E(d.auteur)} · ${E(d.tel || 'n° non renseigné')}</div></div>
          <div class="msec"><div class="k">Accès et clés</div>${E(d.acces || log.acces || '—')}<br>Clés : ${E(d.numCles || '')} ${E((d.lieuCles || '').toLowerCase())}</div>
          <div class="msec"><div class="k">Travaux à réaliser · ${lines.length} ligne${lines.length > 1 ? 's' : ''}</div>
            ${lines.map(({ l }) => `<div class="row" style="gap:12px;flex-wrap:nowrap;align-items:flex-start;padding:6px 0">${A.photo(l.photos[0], 72, 54)}<div><strong>${E(l.piece)} · ${E(l.nature)}</strong><div class="s13">${E(l.description)}</div><div class="muted small">Durée estimée ${A.fdur(l.duree)}</div></div></div>`).join('')}</div>
          <div class="msec"><div class="k">Consommables à emporter</div>
            ${d.consommables.map((c, i) => `<label class="chkrow"><input type="checkbox" data-ch="mPris" data-i="${i}" ${c.pris ? 'checked' : ''}> ${E(c.nom)} × ${c.qte}${c.origine !== 'Stock' ? ' · <span style="color:#B54708">à acheter</span>' : ''}</label>`).join('') || '<span class="muted s13">Aucun prévu</span>'}</div>
          ${r.etat === 'imp' ? `<div class="note warn">Accès impossible signalé (${E(r.motifImp)}) · renvoyé à la coordination.</div>` : ''}
          ${running ? `<div class="note warn">Une autre mission est en cours (${E(running.label)}). Terminez-la avant d'en démarrer une nouvelle.</div>` : ''}
          ${r.etat === 'planned' && !canStart ? `<div class="note">Mission prévue ${A.fday(r.date)} : démarrage possible le jour même.</div>` : ''}
          ${r.etat === 'planned' ? `<button class="mbtn green" data-act="mStart" ${canStart && !running ? '' : 'disabled style="opacity:.45"'}>${A.ic.play()} Démarrer la mission</button>
            <button class="mbtn ghost" data-act="mImp">Accès impossible</button>
            <p class="muted small" style="margin:0;text-align:center">« Accès impossible » demande un motif et une photo, puis renvoie à la coordination.</p>` : ''}
          ${r.etat === 'running' ? `<a class="mbtn green" href="#/m/terminer/${r.id}">Reprendre la mission</a>` : ''}
        </div>`, 'missions');
    },
    acts: {
      mPris(el) { const d = A.D(A.Rdv(A.cur.params[0]).demandeId); d.consommables[+el.dataset.i].pris = el.checked; A.save(); },
      mStart() {
        const r = A.Rdv(A.cur.params[0]); const d = A.D(r.demandeId);
        r.etat = 'running'; r.debutReel = A.now(); initWork(r, d);
        d.statut = 'en_cours'; A.hist(d, `Mission démarrée par ${A.Ouv(r.ouvrierId).nom} à ${A.nowTime()}`);
        A.saveNow(); A.go('#/m/terminer/' + r.id);
      },
      mImp() {
        const r = A.Rdv(A.cur.params[0]); const d = A.D(r.demandeId);
        A.modal({
          title: 'Accès impossible', okLabel: 'Signaler à la coordination', danger: true,
          body: `<div><label class="lbl">Motif</label><select class="in" name="m">${A.opts(A.S.ref.motifsAcces)}</select></div>
                 <div><label class="lbl">Photo (porte, boîte aux lettres…) — obligatoire</label><input type="file" accept="image/*" capture="environment" name="ph" class="in" style="padding:8px"></div>
                 <div><label class="lbl">Commentaire</label><textarea class="in" name="c"></textarea></div>`,
          onOk(f, fd) {
            const file = f.querySelector('[name=ph]').files[0];
            if (!file) { A.toast('Photo obligatoire', 'err'); return false; }
            A.readPhoto(file).then(ph => {
              r.etat = 'imp'; r.motifImp = fd.get('m'); r.photoImp = ph; r.finReel = A.now();
              d.statut = 'acces_impossible';
              A.hist(d, `Accès impossible (${r.motifImp}) signalé par ${A.Ouv(r.ouvrierId).nom}${fd.get('c') ? ' : ' + fd.get('c') : ''} · à reprogrammer`);
              A.saveNow(); A.toast('Coordination prévenue · mission à reprogrammer', 'ok'); A.go('#/m/missions');
            });
          },
        });
      },
    },
  };

  /* =====================================================================
     M3 · Mission en cours / terminer
     ===================================================================== */
  const curR = () => A.Rdv(A.cur.params[0]);

  A.V.m_terminer = {
    render([rid]) {
      const r = A.Rdv(rid); const d = r && r.demandeId && A.D(r.demandeId);
      if (!d) return shell('<div class="mbody"><div class="empty">Mission introuvable</div></div>', 'missions');
      if (r.etat === 'done') { setTimeout(() => location.replace('#/m/rapport/' + rid)); return shell('', 'missions'); }
      if (r.etat !== 'running') { setTimeout(() => location.replace('#/m/mission/' + rid)); return shell('', 'missions'); }
      if (!r.debutReel) r.debutReel = A.now();
      const w = initWork(r, d); const log = A.Log(d.logementId);
      const lines = stLines(d);
      const el = elapsed(r);
      return shell(`
        <div class="mhead"><div class="s">${d.id} · ${E(log.ville)}${log.apt ? ', apt ' + E(log.apt) : ''}</div><h1>Mission en cours</h1>
          <div class="row" style="gap:10px;margin-top:8px;align-items:baseline"><span class="timer" id="mtimer" data-start="${r.debutReel}">${A.pad(Math.floor(el / 60))}:${A.pad(el % 60)}</span><span class="s">démarrée à ${A.ftime(r.debutReel)}</span></div></div>
        <div class="mbody">
          ${lines.map(({ l, i }, n) => { const st = w.lignes[i] || ''; const ap = w.apres[i] || [];
            return `<div class="msec"><div class="k">Ligne ${n + 1} · ${E(l.piece)} — ${E(l.nature)}</div>
              <div class="seg">${[['realisee', 'Réalisée'], ['partielle', 'Partielle'], ['non_realisee', 'Non réalisée']].map(([k, lb]) => `<button type="button" class="${st === k ? (k === 'realisee' ? 'on-p' : k === 'partielle' ? 'on-h' : 'on-u') : ''}" data-act="mLs" data-i="${i}" data-v="${k}">${lb}</button>`).join('')}</div>
              ${st && st !== 'realisee' ? `<input class="in sm" style="margin-top:8px" id="mm${i}" data-in="mMotif" data-i="${i}" value="${E(w.motifs[i] || '')}" placeholder="Motif (obligatoire) : pièce manquante, temps…">` : ''}
              <div class="row" style="gap:8px;margin-top:10px;flex-wrap:nowrap">
                <div style="text-align:center">${A.photo(l.photos[0], 92, 70)}<div class="small muted">AVANT</div></div>
                ${ap.map((p, j) => `<div style="text-align:center">${A.photo(p, 92, 70, { del: 'mDelAp', data: `data-i="${i}" data-j="${j}"` })}<div class="small muted">APRÈS</div></div>`).join('')}
                ${A.addPhoto('mApres', `data-i="${i}"`, ap.length ? '+' : 'Photo après', ap.length ? 50 : 92, 70, st === 'realisee' && !ap.length)}
              </div>
              ${st === 'realisee' && !ap.length ? '<p class="small" style="color:#B54708;margin:6px 0 0">Photo « après » obligatoire pour une ligne réalisée.</p>' : ''}
            </div>`; }).join('')}
          <div class="msec"><div class="k">Consommables utilisés</div>
            ${w.conso.map((c, i) => `<div class="cnt"><span>${E(c.nom)}</span><span class="st"><button data-act="mQ" data-i="${i}" data-v="-1" aria-label="Moins">−</button><strong>${c.qte}</strong><button data-act="mQ" data-i="${i}" data-v="1" aria-label="Plus">+</button></span></div>`).join('') || '<div class="muted s13">Aucun</div>'}
            <div class="row" style="gap:6px;margin-top:8px;flex-wrap:nowrap"><input class="in sm" id="mcn" placeholder="+ Ajouter un consommable"><button class="btn btn-sm" data-act="mAddC">Ajouter</button></div></div>
          <a class="mc" href="#/m/supplement/${r.id}" style="display:flex;gap:12px;align-items:center">${A.ic.plus('#1D4ED8')}<div><strong>Travaux supplémentaires</strong><div class="muted">${w.supps.length ? `${w.supps.length} ajouté${w.supps.length > 1 ? 's' : ''} · ${E(w.supps.map(s => s.piece + ', ' + s.nature.toLowerCase()).join(' ; '))}` : 'Signaler un problème constaté sur place'}</div></div></a>
          <div class="msec"><div class="k">Temps passé</div><div class="row between"><span class="muted s13">${w.corr ? 'Corrigé : ' + E(w.corr.motif) : 'Calculé au clic sur « Terminer »'}</span><strong style="font-size:18px">≈ ${A.fdur(w.corr ? w.corr.min : Math.max(el, 1))}</strong></div>
            <button class="linkbtn small" style="margin-top:6px" data-act="mCorr">Corriger (motif obligatoire)</button></div>
          <div class="msec"><div class="k">Observations</div><textarea class="in" id="mobs" data-in="mObs" placeholder="À surveiller, à prévoir…">${E(w.obs)}</textarea></div>
          <div class="msec"><div class="k">Signature (facultative)</div>
            <canvas class="sig" id="sig" width="600" height="220" aria-label="Zone de signature"></canvas>
            <div class="row between" style="margin-top:8px;flex-wrap:nowrap;gap:8px"><input class="in sm" id="msig" data-in="mSigName" value="${E(w.signataire)}" placeholder="Nom : occupant ou référent"><button class="btn btn-sm" data-act="mSigClear">Effacer</button></div></div>
          <button class="mbtn" data-act="mFinish">${A.ic.flag()} Terminer la mission</button>
          <p class="muted small" style="margin:0 0 8px;text-align:center">Génère le rapport et l'envoie à la coordination et au demandeur.</p>
        </div>`, 'missions');
    },
    after() {
      const t = document.getElementById('mtimer');
      if (t) A.timer = setInterval(() => { const m = elapsed({ debutReel: t.dataset.start }); t.textContent = `${A.pad(Math.floor(m / 60))}:${A.pad(m % 60)}`; }, 10000);
      const cv = document.getElementById('sig'); if (!cv) return;
      const r = curR(); const ctx = cv.getContext('2d');
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#111827';
      if (r.work.signature) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = r.work.signature; }
      let drawing = false;
      const pt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * cv.width / b.width, (e.clientY - b.top) * cv.height / b.height]; };
      cv.addEventListener('pointerdown', e => { drawing = true; cv.setPointerCapture(e.pointerId); const [x, y] = pt(e); ctx.beginPath(); ctx.moveTo(x, y); });
      cv.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = pt(e); ctx.lineTo(x, y); ctx.stroke(); });
      const end = () => { if (!drawing) return; drawing = false; r.work.signature = cv.toDataURL('image/png'); A.save(); };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointerleave', end);
    },
    acts: {
      mLs(el) { const w = curR().work; w.lignes[el.dataset.i] = el.dataset.v; A.save(); A.render(); },
      mMotif(el) { curR().work.motifs[el.dataset.i] = el.value; A.save(); },
      mApres(el) { const w = curR().work; const i = el.dataset.i; A.readPhotos(el.files).then(ph => { w.apres[i] = (w.apres[i] || []).concat(ph); A.saveNow(); A.render(); }); },
      mDelAp(el) { curR().work.apres[el.dataset.i].splice(+el.dataset.j, 1); A.save(); A.render(); },
      mQ(el) { const w = curR().work; const c = w.conso[+el.dataset.i]; c.qte += Number(el.dataset.v); if (c.qte <= 0) w.conso.splice(+el.dataset.i, 1); A.save(); A.render(); },
      mAddC() { const v = document.getElementById('mcn').value.trim(); if (!v) return; curR().work.conso.push({ nom: v, qte: 1 }); A.save(); A.render(); },
      mObs(el) { curR().work.obs = el.value; A.save(); },
      mSigName(el) { curR().work.signataire = el.value; A.save(); },
      mSigClear() { curR().work.signature = ''; A.save(); A.render(); },
      mCorr() {
        const r = curR();
        A.modal({ title: 'Corriger le temps passé', okLabel: 'Enregistrer', body: `<div><label class="lbl">Temps réel (minutes)</label><input class="in" type="number" min="5" step="5" name="m" value="${r.work.corr ? r.work.corr.min : Math.max(elapsed(r), 5)}"></div><div><label class="lbl">Motif (obligatoire)</label><input class="in" name="mo" placeholder="Oubli de démarrage, pause…"></div>`,
          onOk(f, fd) { if (!fd.get('mo').trim()) { A.toast('Motif obligatoire', 'err'); return false; } r.work.corr = { min: Number(fd.get('m')) || 5, motif: fd.get('mo').trim() }; A.save(); A.render(); } });
      },
      mFinish() {
        const r = curR(); const d = A.D(r.demandeId); const w = r.work; const o = A.Ouv(r.ouvrierId);
        const lines = stLines(d);
        for (const { l, i } of lines) {
          const st = w.lignes[i];
          if (!st) return A.toast(`Indiquez le statut de « ${l.piece} · ${l.nature} »`, 'err');
          if (st === 'realisee' && !(w.apres[i] || []).length) return A.toast(`Photo « après » obligatoire : ${l.piece}`, 'err');
          if (st !== 'realisee' && !(w.motifs[i] || '').trim()) return A.toast(`Motif obligatoire : ${l.piece}`, 'err');
        }
        const tempsMin = w.corr ? w.corr.min : Math.max(elapsed(r), 1);
        const supps = w.supps.map(s => Object.assign({}, s, { suiteLabel: (A.S.ref.suitesSupp.find(x => x.k === s.suite) || {}).l || '' }));
        r.etat = 'done'; r.finReel = A.now();
        r.rapport = { tempsMin, lignes: lines.map(({ i }) => w.lignes[i]), motifs: lines.map(({ i }) => w.motifs[i] || ''), conso: w.conso, supps, obs: w.obs, signature: w.signature, signataire: w.signataire, corr: w.corr };
        lines.forEach(({ l, i }) => { l.statut = w.lignes[i]; l.photosApres = (l.photosApres || []).concat(w.apres[i] || []); });
        supps.forEach(s => {
          const line = { piece: s.piece, lot: s.lot, nature: s.nature, description: s.description, photos: [s.photo], imputation: 'Equalis', circuit: 'ST', duree: s.duree, urgence: 'prog', statut: '', supp: true };
          if (s.suite === 'realise') { d.lignes.push(Object.assign(line, { statut: 'realisee', photosApres: [s.photo] })); }
          else {
            const nd = { id: A.nextId('di'), recueLe: A.now(), logementId: d.logementId, origine: 'supp', auteur: o.nom, fonction: "Chef d'équipe / ouvrier", tel: '', urgence: 'prog', dateSouhaitee: '', acces: d.acces, numCles: d.numCles, lieuCles: d.lieuCles, facturation: 'Non', sinistre: 'Non', sinistreInfo: null, observations: '', message: '', consommables: [], historique: [], lignes: [line], statut: s.suite === 'programmer' ? 'a_planifier' : 'en_qualification', ft: '', parentId: d.id };
            if (s.suite === 'programmer') nd.ft = A.nextId('ft');
            A.hist(nd, `Ajout sur place signalé par ${o.nom} lors de ${d.id}${s.suite === 'validation' ? ' · validation de la coordination demandée' : ' · à programmer'}`);
            A.S.demandes.unshift(nd);
          }
        });
        const all = d.lignes.filter(l => l.circuit === 'ST' || !l.circuit).every(l => l.statut === 'realisee');
        const otherPlanned = A.S.rdvs.some(x => x.demandeId === d.id && x.etat === 'planned');
        d.statut = all ? 'realisee' : otherPlanned ? 'planifiee' : 'a_planifier';
        A.hist(d, `Mission terminée par ${o.nom} · ${A.fdur(tempsMin)} · rapport envoyé à la coordination (complet) et à l'établissement (sans coûts)`);
        if (!all && !otherPlanned) A.hist(d, 'Travaux restants : à replanifier');
        if (supps.length) A.hist(d, `${supps.length} travaux supplémentaire(s) signalé(s) sur place`);
        A.saveNow(); A.go('#/m/rapport/' + r.id);
      },
    },
  };

  /* =====================================================================
     M4 · Travaux supplémentaires
     ===================================================================== */
  A.V.m_supp = {
    render([rid]) {
      const r = A.Rdv(rid); const d = r && r.demandeId && A.D(r.demandeId);
      if (!d || r.etat !== 'running') return shell('<div class="mbody"><div class="empty">Aucune mission en cours. <a href="#/m/missions">Mes missions</a></div></div>', 'signaler');
      const s = A.ui.supp && A.ui.supp.rid === rid ? A.ui.supp : (A.ui.supp = { rid, photo: '', piece: '', lot: d.lignes[0].lot, nature: '', description: '', duree: 30, suite: '' });
      const pp = A.piecesFor(A.Log(d.logementId));
      const max = A.S.ref.seuils.supplementMin;
      return shell(`
        ${back('#/m/terminer/' + rid, 'Travaux supplémentaires', `Rattaché à ${d.id}`)}
        <div class="mbody">
          <div class="msec"><div class="k">Photo justificative (obligatoire)</div>
            ${s.photo ? A.photo(s.photo, 326, 200, { del: 'sDelPh' }) : `<label class="addph req" style="width:100%;height:120px;font-size:14px">${A.ic.cam('#B54708', 24)} Prendre la photo<input type="file" accept="image/*" capture="environment" data-ch="sPh"></label>`}</div>
          <div class="msec stack" style="--gap:12px">
            <div><label class="lbl" for="sp">Pièce</label><select class="in" id="sp" data-ch="sF" data-k="piece"><option value="">Choisir…</option>${A.opts(pp.pieces.concat(pp.autres), s.piece)}</select></div>
            <div><label class="lbl" for="sl">Lot</label><select class="in" id="sl" data-ch="sF" data-k="lot">${A.opts(Object.keys(A.S.ref.lots), s.lot)}</select></div>
            <div><label class="lbl" for="sn">Nature</label><select class="in" id="sn" data-ch="sF" data-k="nature">${A.opts(A.S.ref.lots[s.lot] || [], s.nature, 'Choisir…')}</select></div>
            <div><label class="lbl" for="sd">Description</label><textarea class="in" id="sd" data-in="sF" data-k="description" placeholder="Ce qui est constaté">${E(s.description)}</textarea></div>
            <div><span class="lbl">Temps estimé</span><div class="stepper"><button data-act="sDur" data-v="-15" aria-label="Moins 15 minutes">−</button><strong>${A.fdur(s.duree)}</strong><button data-act="sDur" data-v="15" aria-label="Plus 15 minutes">+</button></div></div>
          </div>
          <div class="msec"><div class="k">Suite donnée</div><div class="stack" style="--gap:8px">
            ${A.S.ref.suitesSupp.map(x => { const dis = x.k === 'realise' && s.duree > max; return `<label class="radio${s.suite === x.k ? ' on' : ''}" style="${dis ? 'opacity:.45' : ''}"><input type="radio" name="suite" data-ch="sSuite" value="${x.k}" ${s.suite === x.k ? 'checked' : ''} ${dis ? 'disabled' : ''}><div><strong>${E(x.l)}</strong><div class="muted">${x.k === 'realise' ? `Jusqu'à ${A.fdur(max)} sans validation` : E(x.d)}</div></div></label>`; }).join('')}
          </div></div>
          <button class="mbtn" data-act="sAdd">Ajouter à la mission</button>
        </div>`, 'signaler');
    },
    acts: {
      sPh(el) { A.readPhotos(el.files).then(ph => { if (ph[0]) { A.ui.supp.photo = ph[0]; A.render(); } }); },
      sDelPh() { A.ui.supp.photo = ''; A.render(); },
      sF(el) { const s = A.ui.supp; s[el.dataset.k] = el.value; if (el.dataset.k === 'lot') s.nature = ''; if (el.tagName === 'SELECT') A.render(); },
      sDur(el) { const s = A.ui.supp; s.duree = Math.max(15, s.duree + Number(el.dataset.v)); if (s.suite === 'realise' && s.duree > A.S.ref.seuils.supplementMin) s.suite = ''; A.render(); },
      sSuite(el) { A.ui.supp.suite = el.value; A.render(); },
      sAdd() {
        const s = A.ui.supp; const r = A.Rdv(s.rid);
        if (!s.photo) return A.toast('Photo obligatoire', 'err');
        if (!s.piece || !s.nature) return A.toast('Pièce et nature obligatoires', 'err');
        if (!s.suite) return A.toast('Choisissez la suite donnée', 'err');
        initWork(r, A.D(r.demandeId)).supps.push({ photo: s.photo, piece: s.piece, lot: s.lot, nature: s.nature, description: s.description, duree: s.duree, suite: s.suite });
        A.ui.supp = null; A.saveNow(); A.toast('Ajouté à la mission', 'ok'); A.go('#/m/terminer/' + r.id);
      },
    },
  };

  /* =====================================================================
     M5 · Rapport automatique
     ===================================================================== */
  A.V.m_rapport = {
    render([rid]) {
      const r = A.Rdv(rid); const d = r && r.demandeId && A.D(r.demandeId);
      if (!d || !r.rapport) return shell('<div class="mbody"><div class="empty">Rapport indisponible. <a href="#/m/missions">Mes missions</a></div></div>', 'missions');
      const rp = r.rapport; const log = A.Log(d.logementId);
      const lines = stLines(d);
      const nxt = A.rdvsOf(r.ouvrierId, r.date).find(x => x.etat === 'planned' && x.demandeId);
      const all = rp.lignes.every(x => x === 'realisee');
      const l0 = lines[0].l;
      return shell(`
        <div class="ok-hero"><div class="ic">${A.ic.check()}</div><h1 style="font-size:20px">Mission terminée</h1><div class="muted s13">Rapport généré et envoyé à ${A.ftime(r.finReel)}</div></div>
        <div class="mbody">
          <div class="msec"><div class="row between" style="margin-bottom:10px"><strong>Rapport ${d.id}</strong>${A.chip(all ? 'Réalisée' : 'Partielle', all ? 'ok' : 'h48')}</div>
            <div class="k">Avant / après · ${E(l0.piece)}</div>
            <div class="row" style="gap:8px;flex-wrap:nowrap">${A.photo(l0.photos[0], 150, 110)}${A.photo((l0.photosApres || []).slice(-1)[0], 150, 110)}</div>
            <div style="margin-top:12px">
              ${lines.map(({ l }, n) => `<div class="cnt"><span>${E(l.nature)}</span><strong>${{ realisee: 'Réalisée', partielle: 'Partielle', non_realisee: 'Non réalisée' }[rp.lignes[n]]}</strong></div>`).join('')}
              ${rp.supps.map(s => `<div class="cnt"><span>${E(s.piece)} · ${E(s.nature.toLowerCase())} (ajout)</span><strong>${s.suite === 'realise' ? 'Réalisée' : s.suite === 'programmer' ? 'À programmer' : 'À valider'}</strong></div>`).join('')}
              <div class="cnt"><span>Temps passé</span><strong>${A.fdur(rp.tempsMin)}</strong></div>
              <div class="cnt"><span>Consommables</span><strong>${rp.conso.reduce((s, c) => s + c.qte, 0)} article${rp.conso.length > 1 ? 's' : ''}</strong></div>
              <div class="cnt"><span>Signature</span><strong>${rp.signature || rp.signataire ? E(rp.signataire || 'Oui') : '—'}</strong></div>
            </div></div>
          <div class="msec s13"><div class="k">Envoyé à</div>Coordination ST · version complète avec coûts<br>${E(log.etab)} · version sans coûts</div>
          <div class="msec s13"><div class="k">Classé dans</div><code style="white-space:normal;word-break:break-all">${E(A.DEPTS[log.dept])} / ${E(A.slug(log.ville))} / ${E(A.logFolder(log))} / ${d.id}_${d.recueLe.slice(0, 10)}</code></div>
          <a class="mbtn sec" href="#/fiche/${d.id}">Voir le rapport PDF</a>
          ${nxt ? `<a class="mbtn" href="#/m/mission/${nxt.id}">Mission suivante · ${nxt.debut}</a>` : '<a class="mbtn" href="#/m/missions">Retour à mes missions</a>'}
        </div>`, 'missions');
    },
  };

  /* =====================================================================
     M6 · Constat d'état (tout salarié)
     ===================================================================== */
  A.V.m_constat = {
    render(p, q) {
      const S = A.S;
      const c = A.ui.mc = A.ui.mc && (!q.log || A.ui.mc.logementId === q.log) ? A.ui.mc : { logementId: q.log || '', contexte: S.ref.contextes[0], proprete: null, bati: '', signalements: [], photos: [], commentaire: '', open: false };
      const n = c.signalements.length;
      return shell(`
        <div class="mhead"><div class="s">Ouvert à tout salarié</div><h1>Constat d'état</h1></div>
        <div class="mbody">
          <div class="msec stack" style="--gap:12px">
            <div><label class="lbl" for="cl">Logement</label><select class="in" id="cl" data-ch="cF" data-k="logementId">${A.opts(S.logements.filter(l => l.typo !== 'BUR').map(l => ({ v: l.id, l: `${l.id} · ${l.typo} · ${l.ville}` })), c.logementId, 'Choisir…')}</select></div>
            <div><label class="lbl" for="cc">Contexte de la visite</label><select class="in" id="cc" data-ch="cF" data-k="contexte">${A.opts(S.ref.contextes, c.contexte)}</select></div>
          </div>
          <div class="msec"><div class="k">Propreté · note de 0 à 6</div>
            <div class="pnote" role="group" aria-label="Note de propreté">${[0, 1, 2, 3, 4, 5, 6].map(i => `<button type="button" class="${c.proprete === i ? 'on' + (i <= 2 ? ' low' : '') : ''}" data-act="cProp" data-v="${i}">${i}</button>`).join('')}</div>
            <div class="row between small muted" style="margin-top:6px"><span>0 insalubre</span><strong style="color:#111827">${c.proprete == null ? '—' : c.proprete + ' · ' + E(S.ref.proprete[c.proprete].toLowerCase())}</strong><span>6 impeccable</span></div>
            ${c.proprete != null && c.proprete <= 2 ? '<p class="small" style="color:#B42318;margin:6px 0 0">Note ≤ 2 : la coordination sera alertée.</p>' : ''}</div>
          <div class="msec"><div class="k">État général du bâti</div>${A.seg('cBati', ['Bon', 'Moyen', 'Dégradé'], c.bati)}</div>
          <div class="msec"><div class="k">Signalements</div>
            <button class="in" data-act="cOpen" aria-expanded="${c.open}">${n ? `${n} sélectionné${n > 1 ? 's' : ''}` : 'Aucun signalement'}${A.ic.chev()}</button>
            ${c.open ? Object.entries(S.ref.signalements).map(([g, arr]) => `<div class="small muted" style="font-weight:700;letter-spacing:.04em;margin:12px 0 2px">${E(g.toUpperCase())}</div>${arr.map(s => `<label class="chkrow"><input type="checkbox" data-ch="cSig" value="${E(s)}" ${c.signalements.includes(s) ? 'checked' : ''}> ${E(s)}</label>`).join('')}`).join('') : (n ? `<div style="margin-top:8px">${c.signalements.map(s => `<span class="tag">${E(s)}</span>`).join('')}</div>` : '')}
          </div>
          <div class="msec"><div class="k">Photos (${c.photos.length})</div>
            <div class="row" style="gap:8px">${c.photos.map((ph, j) => A.photo(ph, 72, 72, { del: 'cDelPh', data: `data-j="${j}"` })).join('')}${A.addPhoto('cPh', '', '+', 72, 72)}</div></div>
          <div class="msec"><div class="k">Commentaire</div><textarea class="in" id="ccom" data-in="cF" data-k="commentaire" placeholder="Décrire le logement">${E(c.commentaire)}</textarea>
            <p class="muted small" style="margin:6px 0 0">Décrire le logement, jamais le ménage. Pas de personne sur les photos.</p></div>
          <button class="mbtn" data-act="cSave" data-v="0">Enregistrer le constat</button>
          <button class="mbtn sec" data-act="cSave" data-v="1">Enregistrer et créer une demande</button>
        </div>`, 'constat');
    },
    acts: {
      cF(el) { A.ui.mc[el.dataset.k] = el.value; if (el.tagName === 'SELECT') A.render(); },
      cProp(el) { A.ui.mc.proprete = Number(el.dataset.v); A.render(); },
      cBati(el) { A.ui.mc.bati = el.dataset.v; A.render(); },
      cOpen() { A.ui.mc.open = !A.ui.mc.open; A.render(); },
      cSig(el) { const s = A.ui.mc.signalements; const i = s.indexOf(el.value); if (el.checked && i < 0) s.push(el.value); if (!el.checked && i >= 0) s.splice(i, 1); A.render(); },
      cPh(el) { A.readPhotos(el.files).then(ph => { A.ui.mc.photos.push(...ph); A.render(); }); },
      cDelPh(el) { A.ui.mc.photos.splice(+el.dataset.j, 1); A.render(); },
      cSave(el) {
        const c = A.ui.mc;
        if (!c.logementId) return A.toast('Choisissez le logement', 'err');
        if (c.proprete == null) return A.toast('Note de propreté obligatoire', 'err');
        if (!c.bati) return A.toast("État du bâti obligatoire", 'err');
        const o = me();
        const ce = { id: A.nextId('ce'), date: A.TODAY, logementId: c.logementId, auteur: o.nom, fonction: 'Ouvrier', contexte: c.contexte, proprete: c.proprete, bati: c.bati, signalements: c.signalements.slice(), photos: c.photos.slice(), commentaire: c.commentaire, suite: '' };
        const danger = ce.signalements.some(s => /Chauffage d'appoint|électrique dangereuse/.test(s));
        if (danger || ce.proprete <= 2) ce.suite = 'alerte';
        A.S.constats.unshift(ce);
        A.ui.mc = null; A.saveNow();
        A.toast(`Constat ${ce.id} enregistré${danger ? ' · alerte sécurité envoyée à la coordination' : ce.proprete <= 2 ? ' · coordination alertée' : ''}`, danger || ce.proprete <= 2 ? 'err' : 'ok');
        if (ce.signalements.some(s => / HS$/.test(s)) && el.dataset.v !== '1') setTimeout(() => A.toast('Équipement hors service : pensez à créer une demande d\'intervention'), 600);
        A.go(el.dataset.v === '1' ? `#/demande/new?log=${ce.logementId}&constat=${ce.id}` : '#/constats');
      },
    },
  };

  /* =====================================================================
     Profil
     ===================================================================== */
  A.V.m_profil = {
    render() {
      const o = me();
      const done = A.S.rdvs.filter(r => r.ouvrierId === o.id && r.etat === 'done' && A.weekStart(r.date) === A.weekStart(A.TODAY));
      return shell(`
        <div class="mhead"><div class="s">Profil</div><h1>${E(o.nom)}</h1></div>
        <div class="mbody">
          <div class="msec"><div class="k">Connecté en tant que (démonstration)</div><select class="in" data-ch="pOuv">${A.opts(A.ouvActifs().map(x => ({ v: x.id, l: `${x.nom} — ${x.metier}` })), o.id, A.ouvActifs().length ? null : "Aucun ouvrier actif")}</select></div>
          <div class="msec"><div class="k">Cette semaine</div><div class="cnt"><span>Missions réalisées</span><strong>${done.length}</strong></div><div class="cnt"><span>Temps passé</span><strong>${A.fdur(done.reduce((s, r) => s + (r.rapport ? r.rapport.tempsMin : r.duree), 0))}</strong></div></div>
          <div class="msec s13 muted">Les missions planifiées arrivent dans votre agenda Outlook et ici. Saisissez heures, consommables et photos « après » sous 48 h.</div>
          <a class="mbtn sec" href="#/planning">Ouvrir l'interface bureau</a>
        </div>`, 'profil');
    },
    acts: { pOuv(el) { A.S.mobile.ouvrierId = el.value; A.saveNow(); A.render(); } },
  };
})(window.App);
