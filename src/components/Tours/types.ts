import type { LatLng } from '@/helpers/carto'

export type TourUi = { hide: string[]; ouv: string }

export type TeamState = { pos: LatLng; txt: string; busy: boolean }
