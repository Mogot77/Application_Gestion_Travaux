import type { Demande } from '../../types'
import { useApp } from '../../hooks/useApp'
import { useUiState } from '../../store/ui'
import { Layout } from '../layout/Layout'
import { Chip, StatChip, UrgChip } from '../ui/Chip'
import { IcSearch } from '../ui/Icons'
import { Opts } from '../ui/Fields'
import { CLOSED, QUALIF, STAT, URG, ageOf, circuitLabel, circuitOf, getLog, logShort, nbPhotos, shortLot, uniqueEtabs, visibleDemandes } from '../../lib/domain'
import { TODAY, addDays, fd, fdy } from '../../lib/dates'
import { csv, download } from '../../lib/csv'
import { go } from '../../hooks/useRoute'

type TabKey = 'toutes' | 'a_traiter' | 'a_qualifier' | 'a_planifier' | 'occupants' | 'a_reactualiser' | 'cloturees'
const TABS: [TabKey, string, (d: Demande) => boolean][] = [
  ['toutes', 'Toutes', () => true],
  ['a_traiter', 'À traiter', d => !CLOSED.includes(d.statut)],
  ['a_qualifier', 'À qualifier', d => QUALIF.includes(d.statut)],
  ['a_planifier', 'À planifier', d => ['a_planifier', 'acces_impossible'].includes(d.statut)],
  ['occupants', "Demandes d'occupants", d => d.origine === 'occupant' && !CLOSED.includes(d.statut)],
  ['a_reactualiser', 'À réactualiser', d => d.statut === 'a_reactualiser'],
  ['cloturees', 'Clôturées', d => CLOSED.includes(d.statut)],
]
const PER_PAGE = 12

type FilterKey = 'etab' | 'dept' | 'lot' | 'urgence' | 'circuit' | 'statut'
interface DemUi { tab: TabKey; q: string; etab: string; dept: string; lot: string; urgence: string; circuit: string; statut: string; page: number; sel: string[] }
const INIT: DemUi = { tab: 'a_traiter', q: '', etab: '', dept: '', lot: '', urgence: '', circuit: '', statut: '', page: 0, sel: [] }

const actionFor = (d: Demande): [string, string] => {
  switch (d.statut) {
    case 'a_qualifier': case 'en_qualification': return ['Qualifier', `#/demande/${d.id}`]
    case 'a_valider_occupant': return ['Valider', `#/demande/${d.id}`]
    case 'a_planifier': return ['Planifier', `#/planning?sel=${d.id}`]
    case 'acces_impossible': return ['Reprogrammer', `#/planning?sel=${d.id}`]
    case 'a_reactualiser': return ['Relancer', `#/demande/${d.id}`]
    case 'consultation': return ['Devis', `#/devis/${d.consultationId}`]
    case 'realisee': case 'cloturee': return ['Rapport', `#/fiche/${d.id}`]
    default: return ['Ouvrir', `#/demande/${d.id}`]
  }
}

const ORIGINE_LABEL: Record<string, string> = { occupant: "déposée par l'occupant", mail: 'reçue par mail', tel: 'reçue par téléphone' }

export function Demandes() {
  const { S, toast } = useApp()
  const [ui, setUi] = useUiState<DemUi>('dem', INIT)
  const all = visibleDemandes(S)

  const filtered = () => {
    const tabFn = (TABS.find(t => t[0] === ui.tab) || TABS[1])[2]
    const q = ui.q.trim().toLowerCase()
    return all.filter(tabFn).filter(d => {
      const log = getLog(S, d.logementId)
      if (q && !`${d.id} ${log?.id} ${log?.adresse} ${log?.ville} ${d.lignes.map(l => l.nature + ' ' + l.lot + ' ' + l.piece).join(' ')}`.toLowerCase().includes(q)) return false
      if (ui.etab && log?.etab !== ui.etab) return false
      if (ui.dept && log?.dept !== ui.dept) return false
      if (ui.lot && !d.lignes.some(l => l.lot === ui.lot)) return false
      if (ui.urgence && d.urgence !== ui.urgence) return false
      if (ui.circuit && !d.lignes.some(l => l.circuit === ui.circuit)) return false
      if (ui.statut && d.statut !== ui.statut) return false
      return true
    }).sort((a, b) => b.recueLe.localeCompare(a.recueLe))
  }

  const rows = filtered()
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const page = Math.min(ui.page, pages - 1)
  const shown = rows.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
  const month = TODAY.slice(0, 7)
  const horsProc = all.filter(d => ['mail', 'tel'].includes(d.origine) && d.recueLe.startsWith(month)).length
  const reac = all.filter(d => d.statut === 'a_reactualiser').length
  const sub = S.profil === 'etab' ? 'Les demandes de votre établissement.' : 'Toutes les demandes, tous circuits. Les établissements ne voient que les leurs.'

  const fsel = (k: FilterKey, label: string, list: { v: string; l: string }[] | string[]) => (
    <select key={k} className={`flt${ui[k] ? ' on' : ''}`} aria-label={label} value={ui[k]} onChange={e => setUi({ [k]: e.target.value, page: 0 })}>
      <Opts list={list} placeholder={label} />
    </select>
  )

  const exportCsv = () => {
    const data: unknown[][] = [['N° demande', 'Reçue le', 'Établissement', 'Logement', 'Ville', 'Ligne', 'Pièce', 'Lot', 'Nature', 'Description', 'Urgence', 'Circuit', 'Imputation', 'Statut', 'Ancienneté (j)']]
    rows.forEach(d => {
      const log = getLog(S, d.logementId)
      d.lignes.forEach((l, i) => data.push([d.id, fdy(d.recueLe), log?.etab, log?.id, log?.ville, i + 1, l.piece, l.lot, l.nature, l.description, (URG[d.urgence] || [''])[0], circuitLabel(S, l.circuit), l.imputation, STAT[d.statut][0], ageOf(d)]))
    })
    download(`demandes_${TODAY}.csv`, csv(data))
    toast(`${rows.length} demandes exportées (CSV lisible par Excel)`, 'ok')
  }
  const toggleSel = (id: string, on: boolean) => setUi({ sel: on ? [...new Set([...ui.sel, id])] : ui.sel.filter(x => x !== id) })
  const hasFilter = (['etab', 'dept', 'lot', 'urgence', 'circuit', 'statut', 'q'] as const).some(k => ui[k])

  return (
    <Layout active="demandes">
      <div className="pagehead mb-2">
        <div><h1 className="mb-1">Demandes d'intervention</h1><p className="muted m-0">{sub}</p></div>
        <div className="row">
          <button className="btn" onClick={exportCsv}>Exporter Excel</button>
          <button className="btn" disabled={!ui.sel.length} onClick={() => ui.sel.length && go('#/fiche/' + ui.sel.join(','))}>
            Imprimer les fiches sélectionnées{ui.sel.length ? ` (${ui.sel.length})` : ''}
          </button>
        </div>
      </div>
      <nav className="tabs" aria-label="Files">
        {TABS.map(t => {
          const n = all.filter(t[2]).length
          return (
            <button key={t[0]} className={`tab${ui.tab === t[0] ? ' on' : ''}`} onClick={() => setUi({ tab: t[0], page: 0 })}>
              {t[1]} {t[0] !== 'cloturees' && <b className={t[0] === 'a_reactualiser' && n ? '!bg-violet-soft !text-violet' : ''}>{n}</b>}
            </button>
          )
        })}
      </nav>
      <div className="row mb-4 !gap-2">
        <label className="flt w-full cursor-text sm:w-[280px]"><IcSearch />
          <input id="dq" className="min-w-0 flex-1 border-0 outline-0" style={{ font: 'inherit' }} value={ui.q} placeholder="N°, logement, adresse…" onChange={e => setUi({ q: e.target.value, page: 0 })} />
        </label>
        {S.profil !== 'etab' && fsel('etab', 'Établissement', uniqueEtabs(S))}
        {fsel('dept', 'Département', [{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }])}
        {fsel('lot', 'Lot', Object.keys(S.ref.lots))}
        {fsel('urgence', 'Urgence', S.ref.urgences.map(u => ({ v: u.k, l: u.l })))}
        {fsel('circuit', 'Circuit', S.ref.circuits.map(c => ({ v: c.k, l: c.l })))}
        {fsel('statut', 'Statut', Object.entries(STAT).map(([k, v]) => ({ v: k, l: v[0] })))}
        {hasFilter && <button className="linkbtn s13" onClick={() => setUi({ q: '', etab: '', dept: '', lot: '', urgence: '', circuit: '', statut: '', page: 0 })}>Effacer les filtres</button>}
      </div>
      <div className="card tbl-wrap">
        <table className="t nowrap min-w-[1180px]">
          <thead><tr><th></th><th>N° demande</th><th>Reçue le</th><th>Établissement</th><th>Logement · ville</th><th>Problèmes</th><th>Urgence</th><th>Circuit</th><th>Statut</th><th>Ancienneté</th><th>Photos</th><th></th></tr></thead>
          <tbody>
            {shown.length ? shown.map(d => {
              const log = getLog(S, d.logementId)
              const [al, ah] = actionFor(d)
              const age = ageOf(d)
              const reacSt = d.statut === 'a_reactualiser'
              const closed = CLOSED.includes(d.statut)
              const l0 = d.lignes[0]
              return (
                <tr key={d.id} className={reacSt ? 'bg-[#FAF7FF]' : d.urgence === 'urgent' && !closed ? 'bg-[#FFFBFA]' : ''}>
                  <td><input type="checkbox" checked={ui.sel.includes(d.id)} aria-label={`Sélectionner ${d.id}`} onChange={e => toggleSel(d.id, e.target.checked)} /></td>
                  <td><a href={`#/demande/${d.id}`}><strong>{d.id}</strong></a></td>
                  <td>{fd(d.recueLe)}</td>
                  <td>{log?.etab}{ORIGINE_LABEL[d.origine] && <small>{ORIGINE_LABEL[d.origine]}</small>}</td>
                  <td>{logShort(log)}<small>{log?.ville} ({log?.dept})</small></td>
                  <td>{shortLot(l0?.lot)} · {l0?.nature}{d.lignes.length > 1 && <small>+{d.lignes.length - 1} ligne{d.lignes.length > 2 ? 's' : ''}</small>}</td>
                  <td><UrgChip k={d.urgence} /></td>
                  <td className={circuitOf(S, d) ? '' : 'muted'}>{circuitOf(S, d) || 'à définir'}</td>
                  <td>
                    <StatChip d={d} />
                    {d.statut === 'a_completer' && d.motifRenvoi && <small>{d.motifRenvoi.toLowerCase()}</small>}
                    {reacSt && <small>rejet auto le {fd(addDays(d.recueLe, 80))}</small>}
                  </td>
                  <td className={age > 60 && !closed ? '!font-bold !text-violet' : ''}>{closed ? <span className="muted">—</span> : age + ' j'}</td>
                  <td>{nbPhotos(d)}</td>
                  <td><a href={ah}>{al}</a></td>
                </tr>
              )
            }) : <tr><td colSpan={12} className="empty">Aucune demande ne correspond à ces critères.</td></tr>}
          </tbody>
        </table>
        <div className="row between px-4 py-3 text-[13px]">
          <span className="muted">{shown.length} demande{shown.length > 1 ? 's' : ''} affichée{shown.length > 1 ? 's' : ''} sur {rows.length}</span>
          <div className="row !gap-1.5">
            <button className="btn btn-sm" disabled={!page} onClick={() => setUi({ page: page - 1 })}>Précédent</button>
            <span className="muted">{page + 1} / {pages}</span>
            <button className="btn btn-sm" disabled={page >= pages - 1} onClick={() => setUi({ page: page + 1 })}>Suivant</button>
          </div>
        </div>
      </div>
      <div className="row mt-4 items-stretch !gap-4 text-[13px]">
        <div className="card pad-s row flex-1 basis-[300px] !flex-nowrap"><Chip tone="rx">{reac}</Chip><span>demande{reac > 1 ? 's' : ''} de plus de 2 mois : le demandeur a 15 jours pour les réactualiser, sinon rejet automatique.</span></div>
        <div className="card pad-s row flex-1 basis-[300px] !flex-nowrap"><Chip tone="h48">{horsProc}</Chip><span>demande{horsProc > 1 ? 's' : ''} reçue{horsProc > 1 ? 's' : ''} hors procédure ce mois-ci (mail, téléphone), saisie{horsProc > 1 ? 's' : ''} par la coordination.</span></div>
      </div>
    </Layout>
  )
}
