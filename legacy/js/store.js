/* État de l'application, persistance locale et règles métier partagées */
(function (A) {
  const KEY = 'equalis-travaux-v2'; // v2 : données sans demandes

  A.load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) { A.S = s; return; }
    } catch (e) { /* stockage indisponible : on repart des données de démo */ }
    A.S = A.seed();
    A.saveNow();
  };
  A.saveNow = () => {
    clearTimeout(A._st);
    try { localStorage.setItem(KEY, JSON.stringify(A.S)); }
    catch (e) { A.toast('Stockage local plein : supprimez des photos ou réinitialisez la démo', 'err'); }
  };
  A.save = () => { clearTimeout(A._st); A._st = setTimeout(A.saveNow, 250); };
  A.reset = () => { try { localStorage.removeItem(KEY); } catch (e) { } A.S = A.seed(); A.ui = {}; A.saveNow(); };

  /* ---------- Accès ---------- */
  A.D = id => A.S.demandes.find(d => d.id === id);
  A.Log = id => A.S.logements.find(l => l.id === id);
  A.Ouv = id => A.S.ouvriers.find(o => o.id === id);
  A.Ent = id => A.S.entreprises.find(e => e.id === id);
  A.Rdv = id => A.S.rdvs.find(r => r.id === id);
  A.Cs = id => A.S.consultations.find(c => c.id === id);
  A.Ce = id => A.S.constats.find(c => c.id === id);

  A.nextId = kind => {
    const n = ++A.S.seq[kind];
    const p = { di: 'DI', ce: 'CE', cs: 'CS', ft: 'FT', bc: 'BC' }[kind];
    return `${p}-2026-${String(n).padStart(4, '0')}`;
  };
  A.hist = (obj, t) => { obj.historique = obj.historique || []; obj.historique.unshift({ at: A.now(), t }); };

  A.PROFILS = {
    etab: { nom: 'S. Martin', label: 'S. Martin · Service Hébergement 77', etab: 'Service Hébergement 77', fonction: 'Travailleur·se social·e' },
    coord: { nom: 'Coordination ST', label: 'Coordination ST', fonction: 'Coordination ST' },
    dir: { nom: 'Direction Immobilier', label: 'Direction Immobilier', fonction: "Directeur·rice d'établissement" },
  };
  A.profil = () => A.PROFILS[A.S.profil] || A.PROFILS.coord;

  /* ---------- Statuts ---------- */
  A.STAT = {
    brouillon: ['Brouillon', 'gr'], a_qualifier: ['À qualifier', 'gr'], a_valider_occupant: ['À valider (occupant)', 'tl'],
    en_qualification: ['En qualification', 'bl'], a_completer: ['À compléter', 'h48'], a_reactualiser: ['À réactualiser', 'rx'],
    a_planifier: ['À planifier', 'gr'], planifiee: ['Planifiée', 'pg'], en_cours: ['En cours', 'ok'],
    acces_impossible: ['Accès impossible', 'u'], realisee: ['Réalisée', 'ok'], cloturee: ['Clôturée', 'ok'],
    rejetee: ['Rejetée', 'gr'], bailleur: ['Demandée au bailleur', 'gr'], consultation: ['Consultation en cours', 'bl'],
    prestataire: ['Prestataire mandaté', 'pg'], sinistre: ['Sinistre en cours', 'rx'], annulee: ['Annulée', 'gr'],
  };
  A.CLOSED = ['cloturee', 'rejetee', 'annulee'];
  A.QUALIF = ['a_qualifier', 'en_qualification', 'a_valider_occupant'];
  A.URG = { urgent: ['Urgent', 'u', 'URGENT'], h48: ['Sous 48 h', 'h48', '48 H'], prog: ['Programmable', 'pg', 'PROG.'] };
  A.urgChip = k => A.URG[k] ? A.chip(A.URG[k][0], A.URG[k][1]) : '';
  A.circuitLabel = k => (A.S.ref.circuits.find(c => c.k === k) || {}).l || '';

  A.nextRdv = d => A.S.rdvs.filter(r => r.demandeId === d.id && r.etat !== 'imp').sort((a, b) => (b.date + b.debut).localeCompare(a.date + a.debut))[0];
  A.statChip = d => {
    const [l, c] = A.STAT[d.statut] || [d.statut, 'gr'];
    if (d.statut === 'planifiee') { const r = A.nextRdv(d); if (r) return A.chip(`Planifiée ${A.fday(r.date)}`, 'pg'); }
    if (d.statut === 'prestataire' && d.dateIntervention) return A.chip(`Planifiée ${A.fday(d.dateIntervention)}`, 'pg');
    return A.chip(l, c);
  };
  A.circuitOf = d => { const cs = [...new Set(d.lignes.map(l => l.circuit).filter(Boolean))]; return cs.length ? cs.map(A.circuitLabel).join(' + ') : ''; };
  A.dureeST = d => d.lignes.filter(l => !l.circuit || l.circuit === 'ST').reduce((s, l) => s + (l.duree || 0), 0) || 60;
  A.shortLot = lot => (lot || '').split(' / ')[0].replace(' (description obligatoire)', '');
  A.lineLabel = l => `${l.piece} — ${A.shortLot(l.lot)} · ${l.nature}`;
  A.age = d => A.diffDays(d.recueLe, A.TODAY);
  A.etabOf = d => (A.Log(d.logementId) || {}).etab || '';
  A.nbPhotos = d => d.lignes.reduce((s, l) => s + (l.photos || []).length, 0);

  A.visibleDemandes = () => {
    let list = A.S.demandes.filter(d => d.statut !== 'brouillon');
    if (A.S.profil === 'etab') list = list.filter(d => A.etabOf(d) === A.profil().etab);
    return list;
  };

  /* ---------- Logements et pièces ---------- */
  A.piecesFor = log => {
    const ref = A.S.ref;
    if (!log) return { pieces: ref.piecesLogement, autres: ref.piecesAutres };
    if (log.typo === 'BUR') return { pieces: ref.piecesBureau, autres: ref.piecesAutres };
    const n = parseInt(log.typo.slice(1), 10) || 1;
    const pieces = ref.piecesLogement.filter(p => { const m = p.match(/^Chambre (\d)/); return !m || Number(m[1]) <= n - 1; });
    return { pieces, autres: ref.piecesAutres };
  };
  A.logLabel = l => l ? `${l.id} · ${l.typo === 'BUR' ? 'Bureaux' : l.typo} · ${l.adresse}${l.bat ? ', bât. ' + l.bat : ''}${l.apt ? ', apt ' + l.apt : ''} — ${l.ville} (${l.dept})` : '';
  A.logShort = l => l ? `${l.id} · ${l.typo === 'BUR' ? 'Bureaux' : l.typo}` : '';
  A.logAdr = l => l ? `${l.adresse}${l.bat ? ', bât. ' + l.bat : ''}${l.apt ? ', apt ' + l.apt : ''}` : '';

  /* ---------- Entreprises ---------- */
  A.entDocs = e => {
    const t = A.TODAY;
    const urssafOk = A.diffDays(e.docs.urssaf, t) <= 182;
    const st = {
      kbis: A.diffDays(e.docs.kbis, t) <= 92, urssaf: urssafOk,
      rc: e.docs.rc >= t, decennale: e.docs.decennale >= t,
    };
    const ok = Object.values(st).every(Boolean);
    const label = ok ? 'À jour' : !st.urssaf ? 'URSSAF expirée' : !st.kbis ? 'Kbis > 3 mois' : 'Assurance expirée';
    return { ok, st, label };
  };

  /* ---------- Rendez-vous ---------- */
  A.rdvsOf = (ouvrierId, date) => A.S.rdvs.filter(r => r.ouvrierId === ouvrierId && r.date === date).sort((a, b) => a.debut.localeCompare(b.debut));
  A.chargeOf = (ouvrierId, date) => A.rdvsOf(ouvrierId, date).reduce((s, r) => s + (r.etat === 'imp' ? Math.min(r.duree, 120) : r.duree), 0);
  A.firstFree = (ouvrierId, date) => {
    const list = A.rdvsOf(ouvrierId, date);
    let t = A.toMin('08:00');
    list.forEach(r => { t = Math.max(t, A.toMin(r.debut) + r.duree); });
    t = Math.ceil(t / 30) * 30;
    return A.toTime(Math.min(t, A.toMin('17:00')));
  };
  A.rdvClass = r => {
    const d = r.demandeId && A.D(r.demandeId);
    const u = d ? (d.lignes[0].urgence || d.urgence) : 'prog';
    return u === 'urgent' ? 'bu' : u === 'h48' ? 'bh' : 'bp';
  };
})(window.App);
