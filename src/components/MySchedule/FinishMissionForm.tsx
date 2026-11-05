import { CHECKS_FIN, SUITES_SUPP } from '@/helpers/mission'
import { STATUTS } from './constants'
import PhotoPicker from './PhotoPicker'
import type { FinishMissionFormProps } from './types'

/** Formulaire de fin de mission (affiché dans la modale) : les champs sont lus par `onOk` via leur `name`. */
const FinishMissionForm = ({ debut, lignes, motifs, conso, equipe }: FinishMissionFormProps) => (
  <>
    <p className="muted m-0 text-sm">Début réel : {debut}. Le rapport d’intervention est généré à partir de ce formulaire ; le temps passé est celui du chronomètre de la mission.</p>
    <fieldset className="m-0 border-0 p-0">
      <legend className="lbl">Travaux réalisés</legend>
      {lignes.map((l, i) => (
        <div key={i} className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="min-w-[200px] flex-1 text-sm"><b>{l.piece}</b> · {l.nature}</span>
          <select className="in max-w-[170px]" name={`l${i}`} defaultValue="realisee" aria-label={`Statut de la ligne ${i + 1}`}>
            {STATUTS.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
          </select>
        </div>
      ))}
      {!lignes.length && <p className="muted m-0 text-sm">Aucune ligne de travaux : la mission sera considérée réalisée.</p>}
    </fieldset>
    <div className="grid grid-cols-[minmax(0,1fr)_120px] items-end gap-3">
      <div><span className="lbl">Équipe sur la mission</span><div className="in ro">{equipe.join(', ') || '—'}</div></div>
      <div><label className="lbl" htmlFor="fm-d">Déplacements</label><input className="in" id="fm-d" name="depl" type="number" min={1} defaultValue={1} /></div>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="acces" /> Accès impossible (aucun travail réalisé)</label>
    <div>
      <label className="lbl" htmlFor="fm-motif">Motif du report (si une ligne n’est pas réalisée)</label>
      <select className="in" id="fm-motif" name="motif" defaultValue=""><option value="">— Choisir —</option>{motifs.map(m => <option key={m}>{m}</option>)}</select>
    </div>
    {conso.length > 0 && (
      <fieldset className="m-0 border-0 p-0">
        <legend className="lbl">Consommables utilisés</legend>
        {conso.map((c, i) => (
          <div key={i} className="mb-1 flex items-center gap-2 text-sm">
            <input type="checkbox" name={`c${i}`} defaultChecked={c.pris} aria-label={c.nom} />
            <span className="flex-1">{c.nom}</span>
            <input className="in w-20" type="number" min={1} name={`q${i}`} defaultValue={c.qte} aria-label={`Quantité de ${c.nom}`} />
          </div>
        ))}
      </fieldset>
    )}
    <fieldset className="m-0 border-0 p-0">
      <legend className="lbl">Travaux supplémentaires constatés sur place (facultatif)</legend>
      {[0, 1, 2].map(i => (
        <div key={i} className="mb-1.5 grid grid-cols-[110px_minmax(0,1fr)_70px_130px] gap-1.5">
          <input className="in sm" name={`sp${i}`} placeholder="Pièce" aria-label={`Pièce du travail supplémentaire ${i + 1}`} />
          <input className="in sm" name={`sd${i}`} placeholder="Travaux constatés" aria-label={`Travaux supplémentaires ${i + 1}`} />
          <input className="in sm" name={`sm${i}`} type="number" min={0} placeholder="min" aria-label={`Durée en minutes du travail supplémentaire ${i + 1}`} />
          <select className="in sm" name={`ss${i}`} defaultValue="programmer" aria-label={`Suite du travail supplémentaire ${i + 1}`}>{SUITES_SUPP.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
      ))}
    </fieldset>
    <fieldset className="m-0 border-0 p-0">
      <legend className="lbl">Contrôles de fin de mission</legend>
      <div className="grid gap-1 sm:grid-cols-2">
        {CHECKS_FIN.map((c, i) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" name={`k${i}`} /> {c}</label>)}
      </div>
    </fieldset>
    <PhotoPicker name="apres" legend="Photos de ce qui a été fait" hint="Ces photos seront intégrées au rapport." required />
    <div><label className="lbl" htmlFor="fm-s">Signataire (occupant ou référent, facultatif)</label><input className="in" id="fm-s" name="signataire" /></div>
    <div><label className="lbl" htmlFor="fm-o">Observations</label><textarea className="in" id="fm-o" name="obs" rows={3} /></div>
  </>
)

export default FinishMissionForm
