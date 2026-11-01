import Chip from '@/components/ui/Chip'
import Layout from '@/components/Layout'
import StatusChip from '@/components/StatusChip'
import UrgencyChip from '@/components/UrgencyChip'
import { useApp } from '@/hooks/useApp'
import { go } from '@/hooks/useRoute'
import { useUiState } from '@/hooks/useUiState'
import { CLOSED, STAT, URG, ageOf, circuitLabel, circuitOf, getLog, nbPhotos, shortLot, uniqueEtabs } from '@/helpers/domain'
import { TODAY, addDays, fd, fdy } from '@/helpers/dates'
import { csv, download } from '@/helpers/csv'
import { INIT, ORIGINE_LABEL, PER_PAGE, TABS } from './constants'
import { actionFor, logShort, visibleDemandes } from './helpers'
import type { DemUi, FilterKey } from './types'
import SearchBox from '@/components/ui/SearchBox'
import FilterSelect from '@/components/ui/FilterSelect'
import Tabs from '@/components/ui/Tabs'
import PageHead from '@/components/ui/PageHead'

const Requests = () => {
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
    <FilterSelect key={k} value={ui[k]} onChange={v => setUi({ [k]: v, page: 0 })} label={label} options={list} />
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
      <PageHead className="mb-2" title="Demandes d'intervention" subtitle={sub}>
        <div className="row">
          <button className="btn" onClick={exportCsv}>Exporter Excel</button>
          <button className="btn" disabled={!ui.sel.length} onClick={() => ui.sel.length && go('#/fiche/' + ui.sel.join(','))}>
            Imprimer les fiches sélectionnées{ui.sel.length ? ` (${ui.sel.length})` : ''}
          </button>
        </div>
      </PageHead>
      <Tabs
        label="Files" active={ui.tab} onChange={tab => setUi({ tab, page: 0 })}
        tabs={TABS.map(([key, label, test]) => {
          const n = all.filter(test).length
          return { key, label, badge: key !== 'cloturees' ? n : undefined, badgeClassName: key === 'a_reactualiser' && n ? '!bg-violet-soft !text-violet' : '' }
        })}
      />
      <div className="row mb-4 !gap-2">
        <SearchBox id="dq" className="w-full sm:w-[280px]" value={ui.q} placeholder="N°, logement, adresse…" onChange={q => setUi({ q, page: 0 })} />
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
                <tr key={d.id} className={reacSt ? 'bg-violet-bg' : d.urgence === 'urgent' && !closed ? 'bg-danger-wash' : ''}>
                  <td><input type="checkbox" checked={ui.sel.includes(d.id)} aria-label={`Sélectionner ${d.id}`} onChange={e => toggleSel(d.id, e.target.checked)} /></td>
                  <td><a href={`#/demande/${d.id}`}><strong>{d.id}</strong></a></td>
                  <td>{fd(d.recueLe)}</td>
                  <td>{log?.etab}{ORIGINE_LABEL[d.origine] && <small>{ORIGINE_LABEL[d.origine]}</small>}</td>
                  <td>{logShort(log)}<small>{log?.ville} ({log?.dept})</small></td>
                  <td>{shortLot(l0?.lot)} · {l0?.nature}{d.lignes.length > 1 && <small>+{d.lignes.length - 1} ligne{d.lignes.length > 2 ? 's' : ''}</small>}</td>
                  <td><UrgencyChip k={d.urgence} /></td>
                  <td className={circuitOf(S, d) ? '' : 'muted'}>{circuitOf(S, d) || 'à définir'}</td>
                  <td>
                    <StatusChip d={d} />
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

export default Requests
