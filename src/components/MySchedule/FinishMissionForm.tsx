import { STATUTS } from './constants'
import type { FinishMissionFormProps } from './types'

/** Formulaire de fin de mission (affiché dans la modale) : les champs sont lus par `onOk` via leur `name`. */
const FinishMissionForm = ({ debut, lignes, motifs, conso, tempsDefault }: FinishMissionFormProps) => (
  <>
    <p className="muted m-0 text-sm">Début réel : {debut}. Le rapport d’intervention est généré à partir de ce formulaire.</p>
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
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="lbl" htmlFor="fm-t">Temps passé (minutes)</label><input className="in" id="fm-t" type="number" min={1} name="temps" defaultValue={tempsDefault} /></div>
      <div><label className="lbl" htmlFor="fm-s">Signataire (occupant ou référent, facultatif)</label><input className="in" id="fm-s" name="signataire" /></div>
    </div>
    <div><label className="lbl" htmlFor="fm-o">Observations</label><textarea className="in" id="fm-o" name="obs" rows={3} /></div>
  </>
)

export default FinishMissionForm
