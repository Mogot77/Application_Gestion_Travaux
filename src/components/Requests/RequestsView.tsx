import Chip from '@/components/ui/Chip'
import FilterSelect from '@/components/ui/FilterSelect'
import PageHead from '@/components/ui/PageHead'
import SearchBox from '@/components/ui/SearchBox'
import Tabs from '@/components/ui/Tabs'
import { shortLot } from '@/helpers/domain'
import { addDays, fd } from '@/helpers/dates'
import { ORIGINE_LABEL } from './constants'
import { logShort } from './helpers'
import type { RequestsViewProps } from './types'

/** Écran Demandes (présentation seule) : files, filtres, tableau paginé et compteurs. */
const RequestsView = ({ model, ui, onUi, onExport, onPrint, onToggleSel }: RequestsViewProps) => {
  const { shown, page, pages, filtered, reactualiser: reac, horsProcedure: horsProc } = model
  return (
    <>
      <PageHead className="mb-2" title="Demandes d'intervention" subtitle={model.subtitle}>
        <div className="row">
          <button className="btn" onClick={onExport}>Exporter Excel</button>
          <button className="btn" disabled={!ui.sel.length} onClick={onPrint}>
            Imprimer les fiches sélectionnées{ui.sel.length ? ` (${ui.sel.length})` : ''}
          </button>
        </div>
      </PageHead>
      <Tabs label="Files" active={ui.tab} onChange={tab => onUi({ tab, page: 0 })} tabs={model.tabs} />
      <div className="row mb-4 !gap-2">
        <SearchBox id="dq" className="w-full sm:w-[280px]" value={ui.q} placeholder="N°, logement, adresse…" onChange={q => onUi({ q, page: 0 })} />
        {model.filters.map(f => (
          <FilterSelect key={f.key} value={ui[f.key]} onChange={v => onUi({ [f.key]: v, page: 0 })} label={f.label} options={f.options} />
        ))}
        {model.hasFilter && <button className="linkbtn s13" onClick={() => onUi({ q: '', etab: '', dept: '', lot: '', urgence: '', circuit: '', statut: '', page: 0 })}>Effacer les filtres</button>}
      </div>
      <div className="card tbl-wrap">
        <table className="t nowrap min-w-[1180px]">
          <thead><tr><th></th><th>N° demande</th><th>Reçue le</th><th>Établissement</th><th>Logement · ville</th><th>Problèmes</th><th>Urgence</th><th>Circuit</th><th>Statut</th><th>Ancienneté</th><th>Photos</th><th></th></tr></thead>
          <tbody>
            {shown.length ? shown.map(({ d, log, action: [al, ah], age, closed, reactualiser, circuit, status, urgence, photos }) => {
              const l0 = d.lignes[0]
              return (
                <tr key={d.id} className={reactualiser ? 'bg-violet-bg' : d.urgence === 'urgent' && !closed ? 'bg-danger-wash' : ''}>
                  <td><input type="checkbox" checked={ui.sel.includes(d.id)} aria-label={`Sélectionner ${d.id}`} onChange={e => onToggleSel(d.id, e.target.checked)} /></td>
                  <td><a href={`#/demande/${d.id}`}><strong>{d.id}</strong></a></td>
                  <td>{fd(d.recueLe)}</td>
                  <td>{log?.etab}{ORIGINE_LABEL[d.origine] && <small>{ORIGINE_LABEL[d.origine]}</small>}</td>
                  <td>{logShort(log)}<small>{log?.ville} ({log?.dept})</small></td>
                  <td>{shortLot(l0?.lot)} · {l0?.nature}{d.lignes.length > 1 && <small>+{d.lignes.length - 1} ligne{d.lignes.length > 2 ? 's' : ''}</small>}</td>
                  <td>{urgence && <Chip tone={urgence[1]}>{urgence[0]}</Chip>}</td>
                  <td className={circuit ? '' : 'muted'}>{circuit || 'à définir'}</td>
                  <td>
                    <Chip tone={status[1]}>{status[0]}</Chip>
                    {d.statut === 'a_completer' && d.motifRenvoi && <small>{d.motifRenvoi.toLowerCase()}</small>}
                    {reactualiser && <small>rejet auto le {fd(addDays(d.recueLe, 80))}</small>}
                  </td>
                  <td className={age > 60 && !closed ? '!font-bold !text-violet' : ''}>{closed ? <span className="muted">—</span> : age + ' j'}</td>
                  <td>{photos}</td>
                  <td><a href={ah}>{al}</a></td>
                </tr>
              )
            }) : <tr><td colSpan={12} className="empty">Aucune demande ne correspond à ces critères.</td></tr>}
          </tbody>
        </table>
        <div className="row between px-4 py-3 text-[13px]">
          <span className="muted">{shown.length} demande{shown.length > 1 ? 's' : ''} affichée{shown.length > 1 ? 's' : ''} sur {filtered.length}</span>
          <div className="row !gap-1.5">
            <button className="btn btn-sm" disabled={!page} onClick={() => onUi({ page: page - 1 })}>Précédent</button>
            <span className="muted">{page + 1} / {pages}</span>
            <button className="btn btn-sm" disabled={page >= pages - 1} onClick={() => onUi({ page: page + 1 })}>Suivant</button>
          </div>
        </div>
      </div>
      <div className="row mt-4 items-stretch !gap-4 text-[13px]">
        <div className="card pad-s row flex-1 basis-[300px] !flex-nowrap"><Chip tone="rx">{reac}</Chip><span>demande{reac > 1 ? 's' : ''} de plus de 2 mois : le demandeur a 15 jours pour les réactualiser, sinon rejet automatique.</span></div>
        <div className="card pad-s row flex-1 basis-[300px] !flex-nowrap"><Chip tone="h48">{horsProc}</Chip><span>demande{horsProc > 1 ? 's' : ''} reçue{horsProc > 1 ? 's' : ''} hors procédure ce mois-ci (mail, téléphone), saisie{horsProc > 1 ? 's' : ''} par la coordination.</span></div>
      </div>
    </>
  )
}

export default RequestsView
