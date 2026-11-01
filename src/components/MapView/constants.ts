import type L from 'leaflet'
import type { LatLng } from '@/helpers/carto'

export const CENTRE: LatLng = [48.72, 2.6]

export const TILES: Record<string, [string, L.TileLayerOptions]> = {
  'Plan': ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
  'Satellite': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri' }],
}
