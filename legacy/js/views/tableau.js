/* Écran : tableau de bord travaux (indicateurs calculés à partir des données) */
(function (A) {
  const E = A.esc;

  const interDate = d => {
    const r = A.S.rdvs.filter(x => x.demandeId === d.id && (x.etat === 'done' || x.etat === 'running')).sort((a, b) => a.date.localeCompare(b.date))[0];
    return r ? r.date : (d.dateIntervention && d.dateIntervention <= A.TODAY ? d.dateIntervention : '');
  };
  const avg = arr => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
  const fj = n => n == null ? '—' : A.fnum(n, 1) + ' j';

  A.V.tableau = {
    render() {
      const S = A.S;
      const months = [...new Set([A.TODAY.slice(0, 7), ...S.demandes.map(d => d.recueLe.slice(0, 7))])].sort().reverse();
      const ui = A.ui.tb = A.ui.tb || { mois: A.TODAY.slice(0, 7), dept: '', etab: '' };
      const inScope = d => { const l = A.Log(d.logementId) || {}; return d.statut !== 'brouillon' && (!ui.dept || l.dept === ui.dept) && (!ui.etab || l.etab === ui.etab); };
      const scope = S.demandes.filter(inScope);
      const mois = scope.filter(d => d.recueLe.startsWith(ui.mois));
      const urg = mois.filter(d => d.urgence === 'urgent').length;
      const withDelay = scope.map(d => ({ d, j: interDate(d) ? A.diffDays(d.recueLe, interDate(d)) : null })).filter(x => x.j != null && x.j >= 0);
      const delST = avg(withDelay.filter(x => x.d.lignes.some(l => l.circuit === 'ST')).map(x => x.j));
      const delUrg = avg(withDelay.filter(x => x.d.urgence === 'urgent' && x.d.lignes.some(l => l.circuit === 'ST')).map(x => x.j));
      const rdvMois = S.rdvs.filter(r => r.date.startsWith(ui.mois) && r.demandeId && A.D(r.demandeId) && inScope(A.D(r.demandeId)));
      const reported = rdvMois.filter(r => r.rapport);
      const in48 = reported.filter(r => !r.finReel || A.diffDays(r.date, r.finReel.slice(0, 10)) <= 2).length;
      const heures = rdvMois.filter(r => r.etat === 'done').reduce((s, r) => s + (r.rapport ? r.rapport.tempsMin : r.duree), 0);
      const imp = S.rdvs.filter(r => r.date.startsWith(ui.mois) && r.etat === 'imp').length;
      const refac = mois.flatMap(d => d.lignes).filter(l => l.imputation === 'Usager (refacturation)').length;
      const hors = mois.filter(d => ['mail', 'tel'].includes(d.origine)).length;

      const lots = {};
      mois.forEach(d => d.lignes.forEach(l => { const k = l.lot; lots[k] = (lots[k] || 0) + 1; }));
      const lotRows = Object.entries(lots).sort((a, b) => b[1] - a[1]);
      const maxLot = lotRows.length ? lotRows[0][1] : 1;
      const top2 = lotRows.slice(0, 2).reduce((s, x) => s + x[1], 0), totLines = lotRows.reduce((s, x) => s + x[1], 0);
      const lotTitle = lotRows.length >= 2 ? `${A.shortLot(lotRows[0][0])} et ${A.shortLot(lotRows[1][0]).toLowerCase()} concentrent ${Math.round(top2 / totLines * 100)} % des lignes de demande` : 'Lignes de demande par lot';

      const last6 = []; { let [y, m] = ui.mois.split('-').map(Number); for (let i = 0; i < 6; i++) { last6.unshift(`${y}-${A.pad(m)}`); m--; if (!m) { m = 12; y--; } } }
      const vol = last6.map(ym => { const n = scope.filter(d => d.recueLe.startsWith(ym)).length; const h = ui.dept || ui.etab ? 0 : (S.histoMois[ym] || 0); return Math.max(n, h); });
      const maxV = Math.max(...vol, 1);

      const circ = [['ST', 'Service technique'], ['prestataire', 'Prestataire'], ['bailleur', 'Bailleur']].map(([k, l]) => [l, avg(withDelay.filter(x => x.d.lignes[0].circuit === k).map(x => x.j))]);
      const maxC = Math.max(...circ.map(c => c[1] || 0), 1);

      const etabs = [...new Set(S.logements.map(l => l.etab))].map(e => {
        const ds = scope.filter(d => A.etabOf(d) === e && d.recueLe.startsWith(ui.mois));
        const renv = ds.filter(d => d.historique.some(h => h.t.startsWith('Renvoyée'))).length;
        const supp = ds.filter(d => d.origine === 'supp').length + S.rdvs.filter(r => r.rapport && r.demandeId && A.etabOf(A.D(r.demandeId)) === e && r.date.startsWith(ui.mois)).reduce((s, r) => s + (r.rapport.supps || []).length, 0);
        const dl = avg(withDelay.filter(x => A.etabOf(x.d) === e).map(x => x.j));
        return [e, ds.length, renv, supp, dl];
      }).filter(r => r[1] || r[4] != null);

      const fsel = (k, label, opts) => `<select class="flt${ui[k] ? ' on' : ''}" data-ch="tbf" data-k="${k}">${A.opts(opts, ui[k], label)}</select>`;
      return A.layout('tableau', `
        <div class="pagehead">
          <h1>Tableau de bord travaux</h1>
          <div class="row" style="gap:8px">
            <select class="flt" data-ch="tbf" data-k="mois">${A.opts(months.map(m => ({ v: m, l: A.fmonth(m) })), ui.mois)}</select>
            ${fsel('dept', 'Tous départements', [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }])}
            ${fsel('etab', 'Tous établissements', [...new Set(S.logements.map(l => l.etab))])}
            <button class="btn" data-act="tbExport">Exporter</button>
          </div>
        </div>
        <div class="kpis">
          <div class="card kpi"><div class="l">Demandes reçues</div><div class="v">${mois.length}</div><div class="s">dont ${urg} urgente${urg > 1 ? 's' : ''}</div></div>
          <div class="card kpi"><div class="l">Délai demande → intervention ST</div><div class="v">${fj(delST)}</div><div class="s">urgentes : ${fj(delUrg)}</div></div>
          <div class="card kpi"><div class="l">Rapports saisis sous 48 h</div><div class="v">${reported.length ? Math.round(in48 / reported.length * 100) + ' %' : '—'}</div><div class="s">objectif 95 % · ${reported.length} rapport(s)</div></div>
          <div class="card kpi"><div class="l">Heures ST réalisées</div><div class="v">${A.fdur(heures)}</div><div class="s">coût : [taux horaire à définir] · ${imp} accès impossible${imp > 1 ? 's' : ''}</div></div>
          <div class="card kpi"><div class="l">Refacturable aux usagers</div><div class="v">${refac}</div><div class="s">ligne${refac > 1 ? 's' : ''} imputée${refac > 1 ? 's' : ''} à l'usager</div></div>
          <div class="card kpi"><div class="l">Demandes hors procédure</div><div class="v" style="color:${hors ? '#B54708' : '#111827'}">${hors}</div><div class="s">mail ou téléphone</div></div>
        </div>
        <div class="cols" style="gap:16px;margin-bottom:16px">
          <section class="card pad" style="flex:1 1 520px">
            <h2 class="h2s">${E(lotTitle)}</h2>
            ${lotRows.map(([k, n]) => `<div class="hb"><span>${E(k)}</span><div class="tr"><span style="width:${Math.round(n / maxLot * 100)}%"></span></div><b>${n}</b></div>`).join('') || '<div class="empty">Aucune demande sur la période</div>'}
            <p class="muted small" style="margin:8px 0 0">Nombre de lignes de demande par lot, ${A.fmonth(ui.mois).toLowerCase()}.</p>
          </section>
          <section class="card pad" style="flex:1 1 420px">
            <h2 class="h2s">Demandes reçues par mois</h2>
            <div class="vb">${vol.map((v, i) => `<div>${v}<span style="height:${Math.round(v / maxV * 86)}%;${i === 5 ? 'background:#1D4ED8' : ''}"></span></div>`).join('')}</div>
            <div class="vl">${last6.map(ym => `<span>${A.MOIS_C[Number(ym.slice(5)) - 1]}</span>`).join('')}</div>
            ${!ui.dept && !ui.etab ? '<p class="muted small" style="margin:8px 0 0">Mois antérieurs : historique importé.</p>' : ''}
          </section>
        </div>
        <div class="cols" style="gap:16px">
          <section class="card pad" style="flex:1 1 420px">
            <h2 class="h2s">Délai moyen par circuit (jours)</h2>
            ${circ.map(([l, v]) => `<div class="hb" style="grid-template-columns:150px minmax(0,1fr) 50px"><span>${l}</span><div class="tr"><span style="width:${v == null ? 0 : Math.round(v / maxC * 100)}%"></span></div><b>${v == null ? '—' : A.fnum(v, 1)}</b></div>`).join('')}
            <p class="muted small" style="margin:8px 0 0">De la date de demande à la date d'intervention, toutes périodes.</p>
          </section>
          <section class="card pad tbl-wrap" style="flex:1 1 520px">
            <h2 class="h2s">Par établissement</h2>
            <table class="t"><thead><tr><th>Établissement</th><th>Demandes</th><th>Renvoyées</th><th>Ajouts sur place</th><th>Délai moyen</th></tr></thead><tbody>
              ${etabs.map(r => `<tr><td>${E(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${fj(r[4])}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">—</td></tr>'}
            </tbody></table>
          </section>
        </div>`);
    },
    acts: {
      tbf(el) { A.ui.tb[el.dataset.k] = el.value; A.render(); },
      tbExport() {
        const S = A.S; const ui = A.ui.tb;
        const rows = [['N° demande', 'Reçue le', 'Établissement', 'Département', 'Urgence', 'Circuit', 'Statut', 'Date intervention', 'Délai (j)', 'Lignes', 'Lots']];
        S.demandes.filter(d => d.recueLe.startsWith(ui.mois) && d.statut !== 'brouillon').forEach(d => { const l = A.Log(d.logementId); const di = interDate(d); rows.push([d.id, A.fdy(d.recueLe), l.etab, l.dept, A.URG[d.urgence][0], A.circuitOf(d), A.STAT[d.statut][0], di ? A.fdy(di) : '', di ? A.diffDays(d.recueLe, di) : '', d.lignes.length, d.lignes.map(x => x.lot).join(', ')]); });
        A.download(`tableau-de-bord_${ui.mois}.csv`, A.csv(rows));
      },
    },
  };
})(window.App);
