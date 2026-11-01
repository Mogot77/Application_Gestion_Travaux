/* Écran : référentiels (menus déroulants administrables par la direction, sans développement) */
(function (A) {
  const E = A.esc;

  // [clé, titre, qui renseigne, type] — type : list (tableau de chaînes), obj (tableau {k,l,d}), group (objet de listes)
  const LISTS = [
    ['fonctions', "Fonction de l'auteur", 'Pré-remplie depuis le compte · modifiable', 'list'],
    ['urgences', "Niveau d'urgence", 'Établissement · requalifiable par la coordination', 'obj'],
    ['piecesLogement', 'Pièces du logement', 'Établissement · filtrées selon la typologie (T2 : sans chambre 2 · T4 : ajoute chambre 3)', 'list'],
    ['piecesAutres', 'Pièces : autres', 'Établissement', 'list'],
    ['lots', 'Lots de travaux et natures', 'Établissement · liste en cascade, alignée si possible sur les lots de l\'accord-cadre', 'group'],
    ['cles', 'Mise à disposition des clés', 'Établissement', 'list'],
    ['imputations', 'Imputation de la charge', 'Coordination · par ligne', 'list'],
    ['circuits', "Circuit d'exécution", 'Coordination · par ligne', 'obj'],
    ['natSinistre', 'Nature du sinistre', 'Établissement · suivi par la coordination et la gestion locative', 'list'],
    ['assureurs', 'Assureur concerné', 'Coordination', 'list'],
    ['motifsRenvoi', 'Motifs de renvoi (à compléter)', 'Coordination · obligatoire pour renvoyer', 'list'],
    ['motifsRejet', 'Motifs de rejet', 'Coordination · obligatoire pour rejeter', 'list'],
    ['contextes', "Constat d'état : contexte", 'Tout salarié', 'list'],
    ['signalements', 'Signalements du constat', 'Tout salarié · cases à cocher, plusieurs choix', 'group'],
    ['motifsAcces', 'Motifs « accès impossible »', 'Ouvrier sur place · photo obligatoire', 'list'],
  ];
  const editable = A => A.S.profil !== 'etab';

  const chips = (arr, path, can) => `<div class="reflist">${arr.map((v, i) => `<span class="refitem">${E(typeof v === 'object' ? v.l : v)}${can ? `<button data-act="rfDel" data-p="${path}" data-i="${i}" aria-label="Supprimer">×</button>` : ''}</span>`).join('')}</div>`;
  const adder = (path, can) => can ? `<div class="row" style="gap:6px;margin-top:10px;flex-wrap:nowrap"><input class="in sm" id="rf-${path.replace(/[^\w]/g, '_')}" placeholder="Nouvelle valeur"><button class="btn btn-sm" data-act="rfAdd" data-p="${path}">Ajouter</button></div>` : '';

  A.V.referentiels = {
    render() {
      const ref = A.S.ref; const can = editable(A);
      const sec = ([k, t, who, type]) => {
        let body = '';
        if (type === 'list') body = chips(ref[k], k, can) + adder(k, can);
        if (type === 'obj') body = `<div class="stack" style="--gap:6px">${ref[k].map(o => `<div class="s13"><strong>${E(o.l)}</strong> <span class="muted">— ${E(o.d)}</span></div>`).join('')}</div><p class="muted small" style="margin:8px 0 0">Valeurs structurantes : modification par l'administrateur.</p>`;
        if (type === 'group') body = Object.entries(ref[k]).map(([g, arr]) => `<details style="border-top:1px solid #EEF0F3;padding:8px 0"><summary style="cursor:pointer;font-weight:600;font-size:13px">${E(g)} <span class="muted" style="font-weight:400">(${arr.length})</span></summary><div style="padding-top:8px">${chips(arr, k + '|' + g, can)}${adder(k + '|' + g, can)}</div></details>`).join('');
        return `<section class="card pad"><h2 class="h2">${E(t)}</h2><p class="muted small" style="margin:4px 0 12px">${E(who)}</p>${body}</section>`;
      };
      const s = ref.seuils;
      return A.layout('referentiels', `
        <div class="pagehead"><div><h1 style="margin-bottom:4px">Menus déroulants de la fiche travaux</h1><p class="muted" style="margin:0">Listes administrables par la direction, sans développement. Chaque menu indique qui le renseigne.</p></div>
          <div class="row" style="gap:8px"><button class="btn btnd" data-act="resetDemo">Réinitialiser les données de démo</button></div></div>
        ${can ? '' : '<div class="note" style="margin-bottom:16px">Lecture seule pour les établissements.</div>'}
        <section class="card pad" style="margin-bottom:16px"><h2 class="h2">Seuils</h2><p class="muted small" style="margin:4px 0 12px">Règles internes d'achat et de travaux sur place (valeurs à définir par la direction).</p>
          <div class="grid-auto" style="--min:240px">
            <div><label class="lbl" for="s1">3 devis minimum au-delà de (€ HT)</label><input class="in" id="s1" type="number" min="0" data-ch="rfSeuil" data-k="troisDevis" value="${s.troisDevis}" ${can ? '' : 'disabled'}></div>
            <div><label class="lbl" for="s2">Validation direction au-delà de (€ HT)</label><input class="in" id="s2" type="number" min="0" data-ch="rfSeuil" data-k="direction" value="${s.direction}" ${can ? '' : 'disabled'}></div>
            <div><label class="lbl" for="s3">Travaux sur place sans validation jusqu'à (min)</label><input class="in" id="s3" type="number" min="0" step="15" data-ch="rfSeuil" data-k="supplementMin" value="${s.supplementMin}" ${can ? '' : 'disabled'}></div>
          </div></section>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px">
          ${LISTS.map(sec).join('')}
          <section class="card pad"><h2 class="h2">Statuts</h2><p class="muted small" style="margin:4px 0 12px">Calculés par l'outil · visibles par tous</p>
            <div class="reflist">${Object.values(A.STAT).map(([l, c]) => A.chip(l, c)).join('')}</div></section>
          <section class="card pad"><h2 class="h2">Note de propreté</h2><p class="muted small" style="margin:4px 0 12px">De 0 à 6 · une note ≤ 2 alerte la coordination</p>
            <div class="stack" style="--gap:4px">${ref.proprete.map((l, i) => `<div class="s13"><strong style="display:inline-block;width:20px">${i}</strong>${E(l)}</div>`).join('')}</div></section>
        </div>`);
    },
    acts: {
      rfSeuil(el) { A.S.ref.seuils[el.dataset.k] = Math.max(0, Number(el.value) || 0); A.saveNow(); A.toast('Seuil enregistré', 'ok'); },
      rfAdd(el) {
        const p = el.dataset.p; const input = document.getElementById('rf-' + p.replace(/[^\w]/g, '_'));
        const v = input.value.trim(); if (!v) return;
        const [k, g] = p.split('|'); const arr = g ? A.S.ref[k][g] : A.S.ref[k];
        if (arr.includes(v)) return A.toast('Valeur déjà présente', 'err');
        arr.push(v); A.saveNow(); A.toast('Valeur ajoutée', 'ok'); A.render();
      },
      rfDel(el) {
        const [k, g] = el.dataset.p.split('|'); const arr = g ? A.S.ref[k][g] : A.S.ref[k];
        if (arr.length <= 1) return A.toast('La liste doit garder au moins une valeur', 'err');
        arr.splice(+el.dataset.i, 1); A.saveNow(); A.render();
      },
    },
  };
})(window.App);
