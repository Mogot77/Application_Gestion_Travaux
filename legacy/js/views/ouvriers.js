/* Écran : gestion des ouvriers du service technique (création, modification, désactivation, suppression) */
(function (A) {
  const E = A.esc;
  const COLORS = ['#1D4ED8', '#0F766E', '#B54708', '#6D28D9', '#BE185D', '#15803D', '#B42318', '#0369A1', '#854D0E', '#374151'];

  A.ouvActifs = () => A.S.ouvriers.filter(o => o.actif !== false);

  const stats = o => {
    const rdvs = A.S.rdvs.filter(r => r.ouvrierId === o.id);
    const ws = A.weekStart(A.TODAY);
    const week = rdvs.filter(r => A.weekStart(r.date) === ws).reduce((s, r) => s + r.duree, 0);
    const avenir = rdvs.filter(r => r.etat === 'planned' && r.date >= A.TODAY).length;
    return { total: rdvs.length, week, avenir };
  };

  const form = o => {
    const metiers = [...new Set([...A.S.ouvriers.map(x => x.metier), ...Object.keys(A.S.ref.lots).map(A.shortLot)])].filter(Boolean);
    const color = o.color || COLORS[A.S.ouvriers.length % COLORS.length];
    return `
      <div><label class="lbl" for="on">Nom affiché (obligatoire)</label><input class="in" id="on" name="nom" value="${E(o.nom || '')}" placeholder="ex. Karim B." required></div>
      <div><label class="lbl" for="om">Métier / spécialité</label><input class="in" id="om" name="metier" list="om-list" value="${E(o.metier || '')}" placeholder="ex. Plomberie"><datalist id="om-list">${metiers.map(m => `<option value="${E(m)}">`).join('')}</datalist></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><label class="lbl" for="ot">Téléphone</label><input class="in" id="ot" name="tel" type="tel" value="${E(o.tel || '')}" placeholder="06 ·· ·· ·· ··"></div>
        <div><label class="lbl" for="oe">E-mail (agenda Outlook)</label><input class="in" id="oe" name="email" type="email" value="${E(o.email || '')}" placeholder="prenom.nom@equalis.fr"></div>
      </div>
      <div><span class="lbl">Couleur sur le planning et la carte</span>
        <div class="row" style="gap:8px">${COLORS.map(c => `<label style="cursor:pointer"><input type="radio" name="color" value="${c}" ${c === color ? 'checked' : ''} style="position:absolute;opacity:0"><span class="av" style="background:${c};width:28px;height:28px;outline:${c === color ? '3px solid #111827' : 'none'};outline-offset:2px" data-swatch></span></label>`).join('')}</div></div>`;
  };

  const openForm = (o) => {
    const isNew = !o;
    A.modal({
      title: isNew ? 'Nouvel ouvrier' : `Modifier ${o.nom}`, okLabel: isNew ? 'Créer' : 'Enregistrer',
      body: form(o || {}),
      onOk(f, fd) {
        const nom = (fd.get('nom') || '').trim();
        if (!nom) { A.toast('Le nom est obligatoire', 'err'); return false; }
        if (A.S.ouvriers.some(x => x.nom.toLowerCase() === nom.toLowerCase() && (!o || x.id !== o.id))) { A.toast('Un ouvrier porte déjà ce nom', 'err'); return false; }
        const email = (fd.get('email') || '').trim();
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { A.toast('E-mail invalide', 'err'); return false; }
        const data = { nom, metier: (fd.get('metier') || '').trim(), tel: (fd.get('tel') || '').trim(), email, color: fd.get('color') || COLORS[0] };
        if (isNew) { A.S.ouvriers.push(Object.assign({ id: 'o' + Date.now().toString(36), actif: true }, data)); A.toast(`${nom} ajouté`, 'ok'); }
        else { Object.assign(o, data); A.toast('Modifications enregistrées', 'ok'); }
        A.saveNow(); A.render();
      },
    });
    // mise en évidence de la couleur choisie dans la modale
    document.querySelectorAll('#modal-root input[name=color]').forEach(r => r.addEventListener('change', () => {
      document.querySelectorAll('#modal-root [data-swatch]').forEach(s => { s.style.outline = 'none'; });
      r.nextElementSibling.style.outline = '3px solid #111827';
    }));
  };

  A.V.ouvriers = {
    render() {
      const ui = A.ui.ouv = A.ui.ouv || { q: '', inactifs: false };
      const q = ui.q.toLowerCase();
      const list = A.S.ouvriers.filter(o => (ui.inactifs || o.actif !== false) && (!q || `${o.nom} ${o.metier} ${o.tel || ''} ${o.email || ''}`.toLowerCase().includes(q)));
      const nInactifs = A.S.ouvriers.filter(o => o.actif === false).length;
      const can = A.S.profil !== 'etab';
      return A.layout('ouvriers', `
        <div class="pagehead">
          <div><h1 style="margin-bottom:4px">Ouvriers du service technique</h1><p class="muted" style="margin:0">${A.ouvActifs().length} actif${A.ouvActifs().length > 1 ? 's' : ''}${nInactifs ? ` · ${nInactifs} désactivé${nInactifs > 1 ? 's' : ''}` : ''}. Les ouvriers actifs apparaissent dans le planning, la carte des tournées et l'application mobile.</p></div>
          ${can ? '<button class="btn btnp" data-act="oNew">+ Nouvel ouvrier</button>' : ''}
        </div>
        ${can ? '' : '<div class="note" style="margin-bottom:16px">Lecture seule pour les établissements.</div>'}
        <div class="row" style="gap:10px;margin-bottom:16px">
          <label class="flt" style="width:280px;cursor:text">${A.ic.search()}<input id="oq" data-in="oQ" value="${E(ui.q)}" placeholder="Nom, métier, téléphone…" style="border:0;outline:0;font:inherit;flex:1;min-width:0"></label>
          ${nInactifs ? `<label class="row s13" style="gap:6px"><input type="checkbox" data-ch="oInact" ${ui.inactifs ? 'checked' : ''}> Afficher les ouvriers désactivés</label>` : ''}
        </div>
        <div class="card tbl-wrap">
          <table class="t" style="min-width:900px">
            <thead><tr><th></th><th>Nom</th><th>Métier</th><th>Téléphone</th><th>E-mail</th><th>Cette semaine</th><th>À venir</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              ${list.map(o => { const s = stats(o); const off = o.actif === false;
                return `<tr ${off ? 'style="opacity:.6"' : ''}>
                  <td style="width:44px"><i class="av" style="background:${o.color}">${E(A.initials(o.nom))}</i></td>
                  <td><strong>${E(o.nom)}</strong></td>
                  <td>${E(o.metier || '—')}</td>
                  <td>${E(o.tel || '—')}</td>
                  <td>${o.email ? E(o.email) : '<span class="muted">—</span>'}</td>
                  <td>${A.fdur(s.week)} / 35 h</td>
                  <td>${s.avenir} rdv</td>
                  <td>${off ? A.chip('Désactivé', 'gr') : A.chip('Actif', 'ok')}</td>
                  <td style="white-space:nowrap;text-align:right">${can ? `
                    <button class="btn btn-sm" data-act="oEdit" data-id="${o.id}">Modifier</button>
                    <button class="btn btn-sm" data-act="oToggle" data-id="${o.id}">${off ? 'Réactiver' : 'Désactiver'}</button>
                    <button class="btn btn-sm btnd" data-act="oDel" data-id="${o.id}">Supprimer</button>` : ''}</td>
                </tr>`; }).join('') || `<tr><td colspan="9" class="empty">${A.S.ouvriers.length ? 'Aucun ouvrier ne correspond.' : 'Aucun ouvrier. Cliquez sur « + Nouvel ouvrier » pour commencer.'}</td></tr>`}
            </tbody>
          </table>
        </div>
        <p class="muted small" style="margin-top:12px">Un ouvrier qui a déjà des rendez-vous ne peut pas être supprimé (son historique et ses rapports restent liés) : désactivez-le. Un ouvrier avec des rendez-vous à venir doit d'abord être remplacé sur le planning.</p>`);
    },
    acts: {
      oQ(el) { A.ui.ouv.q = el.value; A.render(); },
      oInact(el) { A.ui.ouv.inactifs = el.checked; A.render(); },
      oNew() { openForm(null); },
      oEdit(el) { openForm(A.Ouv(el.dataset.id)); },
      oToggle(el) {
        const o = A.Ouv(el.dataset.id);
        if (o.actif !== false) {
          const s = stats(o);
          if (s.avenir) return A.toast(`${o.nom} a ${s.avenir} rendez-vous à venir : déplacez-les d'abord dans le planning`, 'err');
          o.actif = false; A.toast(`${o.nom} désactivé`);
          if (A.S.mobile.ouvrierId === o.id) { const a = A.ouvActifs()[0]; A.S.mobile.ouvrierId = a ? a.id : ''; }
        } else { o.actif = true; A.toast(`${o.nom} réactivé`, 'ok'); }
        A.saveNow(); A.render();
      },
      oDel(el) {
        const o = A.Ouv(el.dataset.id); const s = stats(o);
        if (s.total) return A.toast(`${o.nom} a ${s.total} rendez-vous dans l'historique : utilisez « Désactiver »`, 'err');
        A.modal({
          title: `Supprimer ${o.nom}`, okLabel: 'Supprimer définitivement', danger: true,
          body: `<p style="margin:0">${E(o.nom)} sera retiré de la liste des ouvriers. Cette action est définitive.</p>`,
          onOk() {
            A.S.ouvriers = A.S.ouvriers.filter(x => x.id !== o.id);
            if (A.S.mobile.ouvrierId === o.id) { const a = A.ouvActifs()[0]; A.S.mobile.ouvrierId = a ? a.id : ''; }
            A.saveNow(); A.toast(`${o.nom} supprimé`); A.render();
          },
        });
      },
    },
  };
})(window.App);
