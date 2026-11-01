import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '@/helpers/carto'
import { esc } from '@/helpers/dates'
import { CENTRE, TILES } from './constants'
import type { MapViewProps, SavedView } from './types'

// Mémoire de la vue (centre / zoom) par carte et du fond choisi, conservées entre deux affichages
const views: Record<string, SavedView> = {}
let baseLayer = 'Plan'

/**
 * Carte Leaflet (OpenStreetMap / Esri satellite).
 * `spec` doit être mémoïsé par l'appelant ; `refitKey` force un recadrage ; `focus` recentre sur un point lorsque sa clé change.
 */
const MapView = ({ spec, mapKey, refitKey = '', focus, height, className = '' }: MapViewProps) => {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const groupRef = useRef<L.LayerGroup | null>(null)
  const ptsRef = useRef<LatLng[]>([])
  const maxZoomRef = useRef(13)
  const placed = useRef(false)

  const fit = () => {
    const map = mapRef.current
    if (!map) return
    const pts = ptsRef.current
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: maxZoomRef.current })
    else map.setView(CENTRE, 9)
  }

  // Création de la carte
  useEffect(() => {
    if (!el.current) return
    // animations de zoom coupées : leurs temporisations se déclencheraient après une reconstruction des repères
    const map = L.map(el.current, { zoomControl: true, attributionControl: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false })
    const base: Record<string, L.TileLayer> = {}
    Object.entries(TILES).forEach(([n, [u, o]]) => { base[n] = L.tileLayer(u, o) })
    base[base[baseLayer] ? baseLayer : 'Plan'].addTo(map)
    L.control.layers(base, undefined, { position: 'topright', collapsed: true }).addTo(map)
    L.control.scale({ imperial: false }).addTo(map)
    map.on('baselayerchange', e => { baseLayer = e.name })
    map.on('moveend', () => { const c = map.getCenter(); views[mapKey] = { c: [c.lat, c.lng], z: map.getZoom() } })
    const Recenter = L.Control.extend({
      options: { position: 'topleft' },
      onAdd() {
        const b = L.DomUtil.create('button', 'cm-recenter')
        b.type = 'button'; b.textContent = 'Recentrer'; b.title = 'Ajuster la vue à tous les repères'
        L.DomEvent.disableClickPropagation(b)
        b.addEventListener('click', fit)
        return b
      },
    })
    new Recenter().addTo(map)
    groupRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    placed.current = false
    const t = window.setTimeout(() => map.invalidateSize(), 0)
    return () => { window.clearTimeout(t); map.remove(); mapRef.current = null; groupRef.current = null }
  }, [mapKey])

  // Repères et tracés
  useEffect(() => {
    const map = mapRef.current, group = groupRef.current
    if (!map || !group) return
    group.clearLayers()
    const pts: LatLng[] = []
    ;(spec.lines || []).forEach(l => {
      L.polyline(l.pts, { color: l.color || '#1D4ED8', weight: 4, opacity: 0.8, dashArray: l.dashed ? '8 8' : undefined }).addTo(group)
      pts.push(...l.pts)
      if (l.label) {
        const a = l.pts[0], b = l.pts[l.pts.length - 1]
        L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
          interactive: false,
          icon: L.divIcon({ className: 'cm-lbl', html: `<span style="border-color:${l.color || '#1D4ED8'}">${esc(l.label)}</span>`, iconSize: [0, 0] }),
        }).addTo(group)
      }
    })
    spec.markers.forEach(m => {
      const size = m.size || [30, 30]
      const icon = L.divIcon({ className: '', html: m.html, iconSize: size, iconAnchor: m.anchor || [size[0] / 2, size[1] / 2], popupAnchor: [0, -size[1] / 2] })
      const mk = L.marker(m.pos, { icon, title: m.title || '', draggable: !!m.draggable, zIndexOffset: m.z || 0 }).addTo(group)
      if (m.popup) mk.bindPopup(m.popup, { maxWidth: 280 })
      const { onClick, onDrag } = m
      if (onClick) mk.on('click', () => onClick())
      if (onDrag) mk.on('dragend', e => { const p = (e.target as L.Marker).getLatLng(); onDrag([p.lat, p.lng]) })
      pts.push(m.pos)
    })
    ptsRef.current = pts
    maxZoomRef.current = spec.maxZoom || 13
    if (!placed.current) {
      placed.current = true
      const v = views[mapKey]
      if (v) map.setView(v.c, v.z); else fit()
    }
  }, [spec, mapKey])

  // Recadrage demandé (changement de filtre)
  const lastRefit = useRef(refitKey)
  useEffect(() => {
    if (lastRefit.current === refitKey) return
    lastRefit.current = refitKey
    delete views[mapKey]
    fit()
  }, [refitKey, mapKey])

  // Recentrage sur un point précis
  const lastFocus = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!focus || lastFocus.current === focus.key) return
    lastFocus.current = focus.key
    mapRef.current?.setView(focus.c, focus.z)
  }, [focus])

  return <div ref={el} className={`carto ${className}`} style={height ? { height } : undefined} role="application" aria-label="Carte" />
}

export default MapView
