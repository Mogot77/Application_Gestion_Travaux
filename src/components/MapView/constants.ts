import type L from 'leaflet'
import type { LatLng } from '@/helpers/carto'

export const CENTRE: LatLng = [48.72, 2.6]

export const TILES: Record<string, [string, L.TileLayerOptions]> = {
  'Plan': ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
  'Satellite': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri' }],
}

/** Couches superposables (cases à cocher). Le cadastre vient de la Géoplateforme de l'IGN : gratuit, sans clé. */
export const OVERLAYS: Record<string, [string, L.TileLayerOptions]> = {
  'Cadastre': ['https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI%20vecteur&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', { maxZoom: 19, attribution: 'Cadastre © <a href="https://geoservices.ign.fr/">IGN</a> · Etalab' }],
}
