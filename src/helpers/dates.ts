/* Dates et formats d'affichage (français) */

export const pad = (n: number) => String(n).padStart(2, '0')

export const parse = (iso: string): Date => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const iso = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
/** Date du jour (fuseau local). `VITE_TODAY` (AAAA-MM-JJ) force une date, pour une démonstration ou des tests. */
export const TODAY: string = (import.meta.env.VITE_TODAY as string | undefined) || iso(new Date())
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d) }
export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5)
export const weekStart = (s: string) => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d) }
export const nowTime = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) }
export const now = () => TODAY + 'T' + nowTime()
export const toMin = (t: string) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m }
export const toTime = (min: number) => pad(Math.floor(min / 60) % 24) + ':' + pad(min % 60)

const J = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
const JL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const M = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export const fd = (s?: string) => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '—'
export const fdy = (s?: string) => s ? fd(s) + '/' + s.slice(0, 4) : '—'
export const fday = (s?: string) => s ? J[parse(s).getDay()] + ' ' + fd(s) : '—'
export const dayShort = (s: string) => JL[parse(s).getDay()].slice(0, 3)
export const fdayLong = (s: string) => { const d = parse(s); return `${JL[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]}` }
export const fmonth = (ym: string) => { const [y, m] = ym.split('-').map(Number); return `${M[m - 1].replace(/^./, c => c.toUpperCase())} ${y}` }
export const ftime = (s?: string) => s && s.length > 11 ? s.slice(11, 16) : ''
export const fdt = (s?: string) => s ? `${fd(s)} · ${ftime(s)}` : '—'
export const fdur = (min?: number) => `${Math.floor((min || 0) / 60)} h ${pad((min || 0) % 60)}`
export const feur = (n: number | string | null | undefined) =>
  (n === '' || n == null || isNaN(Number(n))) ? '—' : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
export const fnum = (n: number, dec = 1) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
export const slug = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '-').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
export const initials = (n: string) => n.split(/[\s.]+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
export const esc = (s: unknown) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
