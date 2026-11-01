/* Écran : carte de tous les logements, colorés selon les demandes en cours */
(function (A) {
  const E = A.esc, C = A.carto;

  const info = l => {
    const ds = A.S.demandes.filter(d => d.logementId === l.id && !A.CLOSED.includes(d.statut) && d.statut !== 'brouillon');
    const urgent = ds.some(d => d.urgence === 'urgent');
    return { ds, urgent, color: urgent ? '#B42318' : ds.length ? '#B54708' : '#6B7280' };
  };
  const visible = () => {
    const ui = A.ui.crt;
    return A.S.logements.filter(l => l.actif !== false
      && (A.S.profil !== 'etab' || l.etab === A.profil().etab || l.typo === 'BUR')
      && (!ui.dept || l.dept === ui.dept)
      && (!ui.etab || l.etab === ui.etab)
      && (ui.mode === 'tous' || (ui.mode === 'urgent' ? info(l).urgent : info(l).ds.length > 0)));
  };

  A.V.carte = {
    render() {
      const ui = A.ui.crt = A.ui.crt || { dept: '', etab: '', mode: 'tous' };
      const list = visible();
      const withD = list.filter(l => info(l).ds.length);
      const nUrg = list.filter(l => info(l).urgent).length;
      const approx = list.filter(l => C.approx(l)).length;
      return A.layout('carte', `
        <div class="pagehead">
          <div><h1 style="margin-bottom:4px">Carte des logements</h1><p class="muted" style="margin:0">${list.length} logement${list.length > 1 ? 's' : ''} affiché${list.length > 1 ? 's' : ''} · ${withD.length} avec une demande en cours${nUrg ? ` dont ${nUrg} urgente${nUrg > 1 ? 's' : ''}` : ''}.</p></div>
          <div class="row" style="gap:8px">
            <select class="flt${ui.dept ? ' on' : ''}" data-ch="crtF" data-k="dept">${A.opts([{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }], ui.dept, 'Tous départements')}</select>
            ${A.S.profil !== 'etab' ? `<select class="flt${ui.etab ? ' on' : ''}" data-ch="crtF" data-k="etab">${A.opts([...new Set(A.S.logements.map(l => l.etab))], ui.etab, 'Tous établissements')}</select>` : ''}
            <select class="flt${ui.mode !== 'tous' ? ' on' : ''}" data-ch="crtF" data-k="mode">${A.opts([{ v: 'tous', l: 'Tous les logements' }, { v: 'demandes', l: 'Avec demande en cours' }, { v: 'urgent', l: 'Avec urgence' }], ui.mode)}</select>
          </div>
        </div>
        <div class="cols" style="gap:16px">
          <section class="card" style="flex:999 1 640px;min-width:0;overflow:hidden"><div id="carto" class="carto" style="height:680px;border-radius:10px" role="application" aria-label="Carte des logements"></div></section>
          <aside class="col-side" style="flex:1 1 300px">
            <div class="card pad"><h2 class="h2" style="margin-bottom:10px">Légende</h2>
              <div class="stack s13" style="--gap:8px">
                <div class="row" style="gap:8px;flex-wrap:nowrap">${C.pin('2', '#B42318', 22)}Demande urgente en cours</div>
                <div class="row" style="gap:8px;flex-wrap:nowrap">${C.pin('1', '#B54708', 22)}Demande en cours</div>
                <div class="row" style="gap:8px;flex-wrap:nowrap">${C.pin('', '#6B7280', 22)}Aucune demande en cours</div>
                <div class="row" style="gap:8px;flex-wrap:nowrap">${C.base('D')}Dépôt ST · Vaux-le-Pénil</div>
              </div>
              <p class="muted small" style="margin:12px 0 0">Le chiffre indique le nombre de demandes en cours.${approx ? ` ${approx} logement${approx > 1 ? 's sont placés' : ' est placé'} au centre de leur commune : ouvrez la fiche logement pour les géolocaliser.` : ''}</p></div>
            <div class="card pad"><h2 class="h2" style="margin-bottom:10px">Demandes en cours</h2>
              ${withD.length ? `<div class="stack" style="--gap:8px">${withD.map(l => { const x = info(l); return `<a href="#/logement/${l.id}" style="text-decoration:none;color:inherit;display:block;padding:8px 10px;border:1px solid #E3E6EB;border-left:4px solid ${x.color};border-radius:8px;font-size:13px"><strong>${l.id}</strong> · ${E(l.ville)}<div class="muted small">${x.ds.map(d => d.id.slice(-4)).join(', ')} · ${x.ds.length} demande${x.ds.length > 1 ? 's' : ''}${x.urgent ? ' · urgent' : ''}</div></a>`; }).join('')}</div>` : '<div class="muted s13">Aucune demande en cours sur ce périmètre.</div>'}
            </div>
          </aside>
        </div>`);
    },
    after() {
      const markers = [{ pos: C.DEPOT, html: C.base('D'), size: [26, 26], title: 'Dépôt ST · Vaux-le-Pénil' }];
      visible().forEach(l => {
        const x = info(l);
        markers.push({
          pos: C.posLog(l), html: C.pin(x.ds.length ? String(x.ds.length) : '', x.color, 28), size: [28, 28], title: `${l.id} · ${l.ville}`, z: x.urgent ? 500 : x.ds.length ? 300 : 0,
          popup: `<strong>${E(l.id)}</strong> · ${E(l.typo === 'BUR' ? 'Bureaux' : l.typo)}<br>${E(A.logAdr(l))}, ${E(l.cp)} ${E(l.ville)}<br><span style="color:#5B6472">${E(l.etab)}</span>${C.approx(l) ? '<br><span style="color:#B54708">Position approximative</span>' : ''}
            ${x.ds.length ? '<div style="margin-top:6px">' + x.ds.map(d => `<a href="#/demande/${E(d.id)}">${E(d.id)}</a> · ${E(d.lignes[0].nature)}`).join('<br>') + '</div>' : ''}
            <div style="margin-top:8px"><a href="#/logement/${E(l.id)}">Fiche logement</a> · <a href="#/demande/new?log=${E(l.id)}">Nouvelle demande</a></div>`,
        });
      });
      C.mount(document.getElementById('carto'), { key: 'carte', markers });
    },
    acts: { crtF(el) { A.ui.crt[el.dataset.k] = el.value; A.ui.mapView = Object.assign({}, A.ui.mapView, { carte: null }); A.render(); } },
  };
})(window.App);
