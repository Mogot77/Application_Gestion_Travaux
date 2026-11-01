import type { CSSProperties } from 'react'
import MapView from '@/components/MapView'
import Opts from '@/components/ui/Opts'
import Card from '@/components/ui/Card'
import { baseHtml, pinHtml } from '@/helpers/carto'
import type { CrtUi, MapPageViewProps } from './types'

/** Carte des logements (présentation seule : repères, compteurs et listes sont préparés par le conteneur). */
const MapPageView = ({ model, onDept, onEtab, onMode }: MapPageViewProps) => {
  const { total, withRequests, urgent, approx, spec, refitKey, rows, etabs, values } = model
  return (
    <>
      <div className="pagehead">
        <div><h1 className="mb-1">Carte des logements</h1><p className="muted m-0">{total} logement{total > 1 ? 's' : ''} affiché{total > 1 ? 's' : ''} · {withRequests} avec une demande en cours{urgent ? ` dont ${urgent} urgente${urgent > 1 ? 's' : ''}` : ''}.</p></div>
        <div className="row !gap-2">
          <select className={`flt${values.dept ? ' on' : ''}`} value={values.dept} onChange={e => onDept(e.target.value)}><Opts list={[{ v: '77', l: '77 · Seine-et-Marne' }, { v: '91', l: '91 · Essonne' }]} placeholder="Tous départements" /></select>
          {etabs && <select className={`flt${values.etab ? ' on' : ''}`} value={values.etab} onChange={e => onEtab(e.target.value)}><Opts list={etabs} placeholder="Tous établissements" /></select>}
          <select className={`flt${values.mode !== 'tous' ? ' on' : ''}`} value={values.mode} onChange={e => onMode(e.target.value as CrtUi['mode'])}><Opts list={[{ v: 'tous', l: 'Tous les logements' }, { v: 'demandes', l: 'Avec demande en cours' }, { v: 'urgent', l: 'Avec urgence' }]} /></select>
        </div>
      </div>
      <div className="cols !gap-4">
        <section className="card min-w-0 overflow-hidden" style={{ flex: '999 1 640px' }}><MapView spec={spec} mapKey="carte" refitKey={refitKey} height={680} className="!rounded-[10px]" /></section>
        <aside className="col-side" style={{ flex: '1 1 300px' }}>
          <Card pad="md"><h2 className="h2 mb-2.5">Légende</h2>
            <div className="stack s13" style={{ '--gap': '8px' } as CSSProperties}>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: pinHtml('2', '#B42318', 22) }} />Demande urgente en cours</div>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: pinHtml('1', '#B54708', 22) }} />Demande en cours</div>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: pinHtml('', '#6B7280', 22) }} />Aucune demande en cours</div>
              <div className="row flex-nowrap !gap-2"><span dangerouslySetInnerHTML={{ __html: baseHtml('D') }} />Dépôt ST · Vaux-le-Pénil</div>
            </div>
            <p className="muted small mb-0 mt-3">Le chiffre indique le nombre de demandes en cours.{approx ? ` ${approx} logement${approx > 1 ? 's sont placés' : ' est placé'} au centre de leur commune : ouvrez la fiche logement pour les géolocaliser.` : ''}</p></Card>
          <Card pad="md"><h2 className="h2 mb-2.5">Demandes en cours</h2>
            {rows.length ? (
              <div className="stack" style={{ '--gap': '8px' } as CSSProperties}>
                {rows.map(r => (
                  <a key={r.id} href={`#/logement/${r.id}`} className="block rounded-lg border border-line border-l-4 px-2.5 py-2 text-[13px] text-inherit no-underline" style={{ borderLeftColor: r.color }}>
                    <strong>{r.id}</strong> · {r.ville}
                    <div className="muted small">{r.ids} · {r.count} demande{r.count > 1 ? 's' : ''}{r.urgent ? ' · urgent' : ''}</div>
                  </a>
                ))}
              </div>
            ) : <div className="muted s13">Aucune demande en cours sur ce périmètre.</div>}
          </Card>
        </aside>
      </div>
    </>
  )
}

export default MapPageView
