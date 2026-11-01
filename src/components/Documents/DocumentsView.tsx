import Ext from '@/components/ui/Ext'
import Button from '@/components/ui/Button'
import { HousingTreeView } from '@/components/HousingTree'
import { fdy } from '@/helpers/dates'
import { RULES, VIEWS } from './constants'
import type { DocumentsViewProps } from './types'

/** Plan de classement des documents (présentation seule : l'arborescence et les fichiers sont préparés par le conteneur). */
const DocumentsView = ({ model, onView }: DocumentsViewProps) => {
  const { depts, files, view } = model
  return (
    <>
      <h1 className="mb-1.5">Plan de classement des documents travaux</h1>
      <p className="muted mb-[18px] mt-0 max-w-[900px]">Une bibliothèque SharePoint « Travaux – Logements » dans l'équipe Teams du service technique. Dossiers et noms créés par l'outil, jamais à la main. L'arborescence ci-dessous est générée à partir des données de l'application.</p>
      <div className="cols !gap-4">
        <section className="card pad min-w-0" style={{ flex: '999 1 640px' }}>
          <h2 className="h2 mb-1">Arborescence : Département › Ville › Logement › Demande</h2>
          <p className="muted s13 mb-3 mt-0">Cliquez sur un dossier pour l'ouvrir.</p>
          <div className="tree"><div>Travaux – Logements/</div>
            {depts.map(({ dept, villes }) => (
              <details key={dept} open><summary>{dept}/</summary>
                {villes.map(({ ville, count, trees }) => (
                  <details key={ville}><summary>{ville}/ <span className="cm">{count} logement(s)</span></summary>
                    {trees.map(t => <HousingTreeView key={t.folder} {...t} />)}
                  </details>
                ))}
              </details>
            ))}
            <details><summary>_A-classer/ <span className="cm">pièces jointes reçues par mail (transition)</span></summary><div className="f cm">vide</div></details>
            <details><summary>_Archives/ <span className="cm">logements sortis du parc, même structure</span></summary><div className="f cm">vide</div></details>
          </div>
        </section>
        <section className="card pad min-w-0" style={{ flex: '1 1 420px' }}>
          <h2 className="h2 mb-1">Règles de nommage</h2>
          <p className="muted s13 mb-3 mt-0">Sans accents, espaces ni caractères spéciaux · chemin complet sous 400 caractères.</p>
          <div className="tbl-wrap"><table className="t"><thead><tr><th>Élément</th><th>Modèle</th></tr></thead><tbody>
            {RULES.map(([k, m, ex]) => (
              <tr key={k}><td>{k}</td><td><code>{m}</code>{ex && <><br /><code className="!bg-brand-soft !text-brand">{ex}</code></>}</td></tr>
            ))}
          </tbody></table></div>
        </section>
      </div>
      <section className="card pad mt-4">
        <div className="row between mb-3"><div><h2 className="h2">Vue SharePoint avec métadonnées</h2><p className="muted s13 mb-0 mt-1">Colonnes remplies automatiquement : on filtre sans toucher aux dossiers.</p></div>
          <div className="row !gap-1.5">{VIEWS.map(([k, l]) => <Button key={k} size="sm" variant={view === k ? 'primary' : 'default'} onClick={() => onView(k)}>{l}</Button>)}</div></div>
        <div className="tbl-wrap"><table className="t nowrap"><thead><tr><th>Nom</th><th>N° demande</th><th>Logement</th><th>Ville</th><th>Établissement</th><th>Lot</th><th>Pièce</th><th>Type</th><th>Date</th><th>Ouvrier</th></tr></thead><tbody>
          {files.slice(0, 60).map(f => (
            <tr key={f.name}><td><span className="font-mono text-xs"><Ext name={f.name} /></span>{f.name}</td><td>{f.demande}</td><td>{f.logement}</td><td>{f.ville}</td><td>{f.etab}</td><td>{f.lot}</td><td>{f.piece}</td><td>{f.type}</td><td>{f.date ? fdy(f.date) : '—'}</td><td>{f.ouvrier || '—'}</td></tr>
          ))}
          {!files.length && <tr><td colSpan={10} className="empty">Aucun fichier</td></tr>}
        </tbody></table></div>
        <p className="muted small mb-0 mt-3">{files.length} fichier(s){files.length > 60 ? ' · 60 premiers affichés' : ''}. Droits : chaque établissement ne voit que les dossiers de ses logements ; coordination, service technique et direction voient tout.</p>
      </section>
    </>
  )
}

export default DocumentsView
