import { useMemo, useState } from 'react'
import Chip from '@/components/ui/Chip'
import MapView, { type MapSpec } from '@/components/MapView'
import { useApp } from '@/hooks/useApp'
import { getLog } from '@/helpers/domain'
import { DEPOT, approx, baseHtml, pinHtml, posLog } from '@/helpers/carto'
import { geocode } from './helpers'
import type { LocationCardProps } from './types'

const LocationCard = ({ sel }: LocationCardProps) => {
  const { S, mutate, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const spec = useMemo<MapSpec>(() => ({
    maxZoom: 16,
    markers: [
      { pos: DEPOT, html: baseHtml('D'), size: [26, 26], title: 'Dépôt ST' },
      {
        pos: posLog(S, sel), html: pinHtml('', '#1D4ED8', 32), size: [32, 32], draggable: true, z: 1000, title: `${sel.id} · glisser pour repositionner`,
        onDrag: p => {
          mutate(s => { const l = getLog(s, sel.id); if (l) { l.lat = Math.round(p[0] * 1e6) / 1e6; l.lng = Math.round(p[1] * 1e6) / 1e6 } }, { now: true })
          toast('Position enregistrée', 'ok')
        },
      },
    ],
  }), [S, sel, mutate, toast])
  const focus = useMemo(() => ({ key: sel.id + (approx(sel) ? '~' : '='), c: posLog(S, sel), z: 15 }), [S, sel])

  const geo = () => {
    setBusy(true)
    geocode(sel.adresse, sel.cp, sel.ville).then(p => {
      if (!p) { toast('Adresse introuvable : placez le repère à la main', 'err'); return }
      mutate(s => { const l = getLog(s, sel.id); if (l) { l.lat = p[0]; l.lng = p[1] } }, { now: true })
      toast('Adresse géolocalisée', 'ok')
    }).catch((e: Error) => toast('Géocodage impossible : ' + e.message, 'err')).finally(() => setBusy(false))
  }
  const reset = () => mutate(s => { const l = getLog(s, sel.id); if (l) { delete l.lat; delete l.lng } }, { now: true })

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="row between px-[18px] py-3.5"><h2 className="h2">Localisation</h2>
        <div className="row !gap-2">{approx(sel) ? <Chip tone="h48">Position approximative</Chip> : <Chip tone="ok">Position précise</Chip>}
          <button className="btn btn-sm" disabled={busy} onClick={geo}>{busy ? 'Recherche…' : "Géolocaliser l'adresse"}</button>
          {!approx(sel) && <button className="btn btn-sm" onClick={reset}>Réinitialiser</button>}</div></div>
      <MapView spec={spec} mapKey={'log-' + sel.id} focus={focus} height={300} className="!rounded-none" />
      <p className="muted small m-0 px-[18px] py-2.5">{approx(sel) ? `Repère placé au centre de ${sel.ville}. ` : ''}Déplacez le repère à la main ou utilisez « Géolocaliser l'adresse » (recherche OpenStreetMap, connexion internet nécessaire).</p>
    </div>
  )
}

export default LocationCard
