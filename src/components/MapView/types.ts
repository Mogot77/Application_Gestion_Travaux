import type { LatLng } from '@/helpers/carto'

export type MapMarker = {
  pos: LatLng; html: string; size?: [number, number]; anchor?: [number, number]; title?: string; popup?: string; z?: number
  draggable?: boolean; onClick?: () => void; onDrag?: (p: LatLng) => void
}
export type MapLine = { pts: LatLng[]; color?: string; dashed?: boolean; label?: string }
export type MapSpec = { markers: MapMarker[]; lines?: MapLine[]; maxZoom?: number }

export type MapFocus = { key: string; c: LatLng; z: number }

export type MapViewProps = {
  spec: MapSpec; mapKey: string; refitKey?: string; focus?: MapFocus; height?: number; className?: string
}

export type SavedView = { c: LatLng; z: number }
