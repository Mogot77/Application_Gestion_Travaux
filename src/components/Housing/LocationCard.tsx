import { useMemo, useState } from 'react'
import { useApp } from '@/hooks/useApp'
import { getLog } from '@/helpers/domain'
import { approx } from '@/helpers/carto'
import { buildLocationFocus, buildLocationSpec, geocode } from './helpers'
import LocationCardView from './LocationCardView'
import type { LocationCardProps } from './types'

/** Conteneur de la carte de localisation : déplacement du repère, géocodage et réinitialisation de la position. */
const LocationCard = ({ sel }: LocationCardProps) => {
  const { S, mutate, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const spec = useMemo(() => buildLocationSpec(S, sel, p => {
    mutate(s => { const l = getLog(s, sel.id); if (l) { l.lat = Math.round(p[0] * 1e6) / 1e6; l.lng = Math.round(p[1] * 1e6) / 1e6 } }, { now: true })
    toast('Position enregistrée', 'ok')
  }), [S, sel, mutate, toast])
  const focus = useMemo(() => buildLocationFocus(S, sel), [S, sel])

  const geo = () => {
    setBusy(true)
    geocode(sel.adresse, sel.cp, sel.ville).then(p => {
      if (!p) { toast('Adresse introuvable : placez le repère à la main', 'err'); return }
      mutate(s => { const l = getLog(s, sel.id); if (l) { l.lat = p[0]; l.lng = p[1] } }, { now: true })
      toast('Adresse géolocalisée', 'ok')
    }).catch((e: Error) => toast('Géocodage impossible : ' + e.message, 'err')).finally(() => setBusy(false))
  }
  const reset = () => mutate(s => { const l = getLog(s, sel.id); if (l) { delete l.lat; delete l.lng } }, { now: true })

  return <LocationCardView id={sel.id} ville={sel.ville} approx={approx(sel)} busy={busy} spec={spec} focus={focus} onGeolocate={geo} onReset={reset} />
}

export default LocationCard
