import type { Logement } from '@/types'
import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import Ext from '@/components/ui/Ext'
import Button from '@/components/ui/Button'
import HousingTree from '@/components/HousingTree'
import { profilOf } from '@/helpers/domain'
import { docsFor } from '@/helpers/docs'
import { TODAY, diffDays, fdy, slug } from '@/helpers/dates'
import { RULES, VIEWS } from './constants'

const Documents = () => {
  const { S } = useApp()
  const [ui, setUi] = useUiState<{ v: string }>('cl', { v: '' })
  const logs = S.logements.filter(l => S.profil !== 'etab' || l.etab === profilOf(S).etab)
  const byDept: Record<string, Record<string, Logement[]>> = {}
  logs.forEach(l => {
    const dk = S.ref.depts[l.dept] || l.dept
    byDept[dk] = byDept[dk] || {}
    ;(byDept[dk][slug(l.ville)] = byDept[dk][slug(l.ville)] || []).push(l)
  })
  const all = logs.flatMap(l => { const d = docsFor(S, l); return [...d.demandes.flatMap(x => x.files), ...d.constats] })
  const flt = all.filter(f => !ui.v
    || (ui.v === 'week' && f.name.endsWith('.jpg') && f.date && diffDays(f.date, TODAY) <= 7 && diffDays(f.date, TODAY) >= 0)
    || (ui.v === 'avap' && ['Avant', 'Après'].includes(f.type))
    || (ui.v === 'rap' && f.type === 'Rapport')
    || (ui.v === 'devis' && f.type === 'Devis')
    || (ui.v === 'cons' && f.type === 'Constat'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <Layout active="classement">
      <h1 className="mb-1.5">Plan de classement des documents travaux</h1>
      <p className="muted mb-[18px] mt-0 max-w-[900px]">Une bibliothèque SharePoint « Travaux – Logements » dans l'équipe Teams du service technique. Dossiers et noms créés par l'outil, jamais à la main. L'arborescence ci-dessous est générée à partir des données de l'application.</p>
      <div className="cols !gap-4">
        <section className="card pad min-w-0" style={{ flex: '999 1 640px' }}>
          <h2 className="h2 mb-1">Arborescence : Département › Ville › Logement › Demande</h2>
          <p className="muted s13 mb-3 mt-0">Cliquez sur un dossier pour l'ouvrir.</p>
          <div className="tree"><div>Travaux – Logements/</div>
            {Object.entries(byDept).sort().map(([dk, villes]) => (
              <details key={dk} open><summary>{dk}/</summary>
                {Object.entries(villes).sort().map(([v, ls]) => (
                  <details key={v}><summary>{v}/ <span className="cm">{ls.length} logement(s)</span></summary>
                    {ls.map(l => <HousingTree key={l.id} l={l} open={false} />)}
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
          <div className="row !gap-1.5">{VIEWS.map(([k, l]) => <Button key={k} size="sm" variant={ui.v === k ? 'primary' : 'default'} onClick={() => setUi({ v: k })}>{l}</Button>)}</div></div>
        <div className="tbl-wrap"><table className="t nowrap"><thead><tr><th>Nom</th><th>N° demande</th><th>Logement</th><th>Ville</th><th>Établissement</th><th>Lot</th><th>Pièce</th><th>Type</th><th>Date</th><th>Ouvrier</th></tr></thead><tbody>
          {flt.slice(0, 60).map(f => (
            <tr key={f.name}><td><span className="font-mono text-xs"><Ext name={f.name} /></span>{f.name}</td><td>{f.demande}</td><td>{f.logement}</td><td>{f.ville}</td><td>{f.etab}</td><td>{f.lot}</td><td>{f.piece}</td><td>{f.type}</td><td>{f.date ? fdy(f.date) : '—'}</td><td>{f.ouvrier || '—'}</td></tr>
          ))}
          {!flt.length && <tr><td colSpan={10} className="empty">Aucun fichier</td></tr>}
        </tbody></table></div>
        <p className="muted small mb-0 mt-3">{flt.length} fichier(s){flt.length > 60 ? ' · 60 premiers affichés' : ''}. Droits : chaque établissement ne voit que les dossiers de ses logements ; coordination, service technique et direction voient tout.</p>
      </section>
    </Layout>
  )
}

export default Documents
