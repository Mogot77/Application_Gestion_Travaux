/* Création de logements (logique pure). */
import type { AppState, Logement } from '@/types'

/** Prochain identifiant libre : LOG-0000 pour les logements, BUR-0000 pour les bureaux. */
export const nextLogId = (S: AppState, typo: string): string => {
  const p = typo === 'BUR' ? 'BUR' : 'LOG'
  const max = S.logements.reduce((m, l) => {
    const n = l.id.startsWith(p + '-') ? Number(l.id.slice(p.length + 1)) : NaN
    return Number.isInteger(n) ? Math.max(m, n) : m
  }, 0)
  return `${p}-${String(max + 1).padStart(4, '0')}`
}

export type NewLogement = Omit<Logement, 'id' | 'dept' | 'actif' | 'bailleur' | 'crypto'> & { bailleur?: string; crypto?: string }

/** Erreur de saisie éventuelle (message en français) pour un nouveau logement. */
export const checkLogement = (l: NewLogement): string => {
  if (!l.adresse.trim()) return "L'adresse est obligatoire"
  if (!/^\d{5}$/.test(l.cp)) return 'Code postal invalide (5 chiffres)'
  if (!l.ville.trim()) return 'La ville est obligatoire'
  if (!l.etab.trim()) return "L'établissement est obligatoire"
  if (!(l.surface > 0)) return 'La surface doit être supérieure à 0'
  return ''
}

export const buildLogement = (S: AppState, l: NewLogement): Logement => ({
  ...l, id: nextLogId(S, l.typo), dept: l.cp.slice(0, 2), actif: true,
  bailleur: l.bailleur || '[Bailleur propriétaire]', crypto: l.crypto || '[ID lot Crypto]',
})
