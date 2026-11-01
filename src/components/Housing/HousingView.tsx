import type { CSSProperties } from 'react'
import Chip from '@/components/ui/Chip'
import Empty from '@/components/ui/Empty'
import Kv from '@/components/ui/Kv'
import Opts from '@/components/ui/Opts'
import SearchBox from '@/components/ui/SearchBox'
import Tabs from '@/components/ui/Tabs'
import { PhotoView } from '@/components/Photo'
import { HousingTreeView } from '@/components/HousingTree'
import { InspectionsTableView } from '@/components/InspectionsTable'
import InterventionsTableView from './InterventionsTableView'
import type { HousingViewProps } from './types'

/** Écran logements : liste filtrée à gauche, fiche du logement sélectionné à droite (présentation seule). */
const HousingView = ({ model, location, onSearch, onDept, onTypo, onEtab, onNew, onTab, onOpenPhoto, onNoFollowUp }: HousingViewProps) => {
  const { list, detail } = model
  const { values } = list

  const left = (
    <aside className="card min-w-[260px] self-stretch" style={{ flex: '0 1 330px' }}>
      <div className="flex flex-col gap-2.5 border-b border-line2 p-3.5">
        <div className="row between"><span><strong>Logements</strong> <span className="muted">· {list.actifs} actifs</span></span>{!list.restricted && <button type="button" className="btn btnp btn-sm" onClick={onNew}>+ Nouveau</button>}</div>
        <SearchBox value={values.q} placeholder="N°, adresse, ville, ID Crypto" onChange={onSearch} />
        <div className="row !gap-1.5">
          <select className={`flt${values.dept ? ' on' : ''}`} value={values.dept} onChange={e => onDept(e.target.value)}><Opts list={['77', '91']} placeholder="Dépt" /></select>
          <select className={`flt${values.typo ? ' on' : ''}`} value={values.typo} onChange={e => onTypo(e.target.value)}><Opts list={['T2', 'T3', 'T4', 'BUR']} placeholder="Typologie" /></select>
          {!list.restricted && <select className={`flt max-w-[150px]${values.etab ? ' on' : ''}`} value={values.etab} onChange={e => onEtab(e.target.value)}><Opts list={list.etabs} placeholder="Établissement" /></select>}
        </div>
      </div>
      <div className="max-h-[760px] overflow-auto">
        {list.groups.map(g => (
          <div key={g.key}>
            <div className="small px-3.5 pb-1 pt-2.5 font-bold tracking-[.04em] text-muted">{g.key}</div>
            {g.items.map(l => (
              <a key={l.id} href={`#/logement/${l.id}`} className={`block border-l-[3px] px-3.5 py-2.5 text-[13px] text-ink no-underline hover:text-ink ${l.selected ? 'border-l-brand bg-brand-bg' : 'border-l-transparent'}`}>
                <strong>{l.id}</strong> · {l.typo}{l.apt ? ' · apt ' + l.apt : ''}<small className="mt-0.5 block text-muted">{l.adresse} · {l.resume}</small>
              </a>
            ))}
          </div>
        ))}
        {!list.groups.length && <Empty>Aucun logement</Empty>}
      </div>
    </aside>
  )

  if (!detail) return <div className="cols">{left}</div>

  const { tab, lastInspection: lastC } = detail
  return (
    <div className="cols !gap-4">
      {left}
      <section className="flex min-w-0 flex-col gap-4" style={{ flex: '999 1 640px' }}>
        <div className="card pad">
          <div className="row between items-start">
            <div>
              <div className="row !gap-2.5"><h1>{detail.id}</h1><Chip>{detail.typoLabel}</Chip><Chip tone={detail.actif ? 'ok' : 'gr'}>{detail.actif ? 'Actif' : 'Sorti du parc'}</Chip></div>
              <p className="muted mb-0 mt-1.5">{detail.adresse}</p>
            </div>
            <div className="row !gap-2">
              <button className="btn" onClick={() => onTab('docs')}>Ouvrir le dossier documents</button>
              <a className="btn" href={`#/constat/new?log=${detail.id}`}>Nouveau constat</a>
              <a className="btn btnp" href={`#/demande/new?log=${detail.id}`}>Nouvelle demande</a>
            </div>
          </div>
          <div className="grid-auto mt-4 !gap-4" style={{ '--min': '300px' } as CSSProperties}>
            <Kv pairs={detail.infoLeft} />
            <Kv pairs={detail.infoRight} />
          </div>
        </div>
        <Tabs className="!m-0" active={tab} onChange={onTab} tabs={detail.tabs} />
        {tab === 'synthese' && (
          <div>
            <div className="cols !gap-4">
              <div className="card pad" style={{ flex: '1 1 380px' }}>
                <h2 className="h2 mb-3">Pièces et historique</h2>
                <div className="grid grid-cols-3 gap-2">
                  {detail.pieces.map(({ name, count: c }) => (
                    <div key={name} className={`flex min-h-[62px] flex-col gap-1 rounded-lg border p-2.5 text-xs ${c && c.open ? 'border-danger-line bg-danger-wash' : 'border-line bg-surface'}`}>
                      <span className="font-semibold">{name}</span>
                      <b className={`font-medium ${c ? 'text-ink' : 'text-faint'}`}>{c ? `${c.n} intervention${c.n > 1 ? 's' : ''}${c.open ? ' · en cours' : ''}` : '—'}</b>
                    </div>
                  ))}
                </div>
                <p className="muted small mb-0 mt-2.5">Nombre d'interventions par pièce sur 24 mois.</p>
              </div>
              <div className="card pad" style={{ flex: '1 1 300px' }}>
                <h2 className="h2 mb-3">Dernier constat d'état</h2>
                {lastC ? (
                  <>
                    <div className="row flex-nowrap items-start !gap-3.5"><PhotoView src={lastC.photo} w={110} h={82} onOpen={onOpenPhoto} />
                      <div className="s13 flex flex-col gap-1.5">
                        <div><strong>{lastC.date}</strong> · {lastC.contexte}</div>
                        <div>Propreté : <Chip tone={lastC.propreteTone}>{lastC.proprete} / 6</Chip></div>
                        <div>Bâti : <Chip tone={lastC.batiTone}>{lastC.bati}</Chip></div>
                        <div className="muted">par {lastC.auteur}, {lastC.fonction}</div>
                      </div></div>
                    <button className="linkbtn s13 mt-3" onClick={() => onTab('constats')}>Historique des constats</button>
                  </>
                ) : <p className="muted s13">Aucun constat enregistré.</p>}
              </div>
            </div>
            {location}
            <div className="card mt-4">
              <div className="row between px-[18px] pb-1.5 pt-4"><h2 className="h2">Interventions récentes</h2><span className="muted s13">{detail.yearCount} demande(s) sur 12 mois</span></div>
              <InterventionsTableView rows={detail.recent} />
            </div>
          </div>
        )}
        {tab === 'inter' && <div className="card"><InterventionsTableView rows={detail.interventions} /></div>}
        {tab === 'constats' && <div className="card tbl-wrap"><InspectionsTableView rows={detail.constats} withLog={false} onOpenPhoto={onOpenPhoto} onNoFollowUp={onNoFollowUp} /></div>}
        {tab === 'docs' && (
          <>
            <div className="tree"><div className="text-[#94A3B8]">{detail.treePath}</div><HousingTreeView {...detail.tree} /></div>
            <p className="muted small">Dossiers et noms créés par l'outil, jamais à la main. <a href="#/classement">Voir le plan de classement complet</a></p>
          </>
        )}
      </section>
    </div>
  )
}

export default HousingView
