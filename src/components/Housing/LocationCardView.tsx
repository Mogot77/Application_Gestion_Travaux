import Chip from '@/components/ui/Chip'
import MapView from '@/components/MapView'
import type { LocationCardViewProps } from './types'

/** Carte de localisation d'un logement (présentation seule : repères et actions viennent du conteneur). */
const LocationCardView = ({ id, ville, approx, busy, spec, focus, onGeolocate, onReset }: LocationCardViewProps) => (
  <div className="card mt-4 overflow-hidden">
    <div className="row between px-[18px] py-3.5"><h2 className="h2">Localisation</h2>
      <div className="row !gap-2">{approx ? <Chip tone="h48">Position approximative</Chip> : <Chip tone="ok">Position précise</Chip>}
        <button className="btn btn-sm" disabled={busy} onClick={onGeolocate}>{busy ? 'Recherche…' : "Géolocaliser l'adresse"}</button>
        {!approx && <button className="btn btn-sm" onClick={onReset}>Réinitialiser</button>}</div></div>
    <MapView spec={spec} mapKey={'log-' + id} focus={focus} height={300} className="!rounded-none" />
    <p className="muted small m-0 px-[18px] py-2.5">{approx ? `Repère placé au centre de ${ville}. ` : ''}Déplacez le repère à la main ou utilisez « Géolocaliser l'adresse » (recherche OpenStreetMap, connexion internet nécessaire).</p>
  </div>
)

export default LocationCardView
