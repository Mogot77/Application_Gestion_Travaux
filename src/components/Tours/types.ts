import type { LatLng } from '@/helpers/carto'
import type { Ouvrier, Rdv } from '@/types'
import type { MapSpec } from '@/components/MapView'

export type TourUi = { hide: string[]; ouv: string }

export type TeamState = { pos: LatLng; txt: string; busy: boolean }

/** Ouvrier affiché (ou ouvrier factice quand aucun n'est actif). */
export type TourOuv = Pick<Ouvrier, 'id' | 'nom' | 'metier' | 'color'>

export type TourTeam = { o: Ouvrier; txt: string; charge: number }

export type TourUrgent = {
  id: string
  ville?: string
  nature: string
  /** Équipe disponible la plus proche, avec le temps de trajet estimé. */
  nearest?: { id: string; nom: string; min: number }
}

export type TourLeg = { r: Rdv; demandeId: string; nature: string; ville?: string; trip: string }

export type ToursModel = {
  ouvs: Ouvrier[]
  ouvId: string
  o: TourOuv
  teams: TourTeam[]
  urgent?: TourUrgent
  legs: TourLeg[]
}

export type ToursViewProps = {
  model: ToursModel
  /** Identifiants des ouvriers masqués sur la carte. */
  hide: string[]
  spec: MapSpec
  onToggle: (ouvrierId: string) => void
  onSelectTeam: (ouvrierId: string) => void
  onAssign: (demandeId: string, ouvrierId: string) => void
  onCalendar: () => void
}
