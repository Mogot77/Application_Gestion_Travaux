import type { AppState, Consultation } from '@/types'
import { entDocs, getCs, getD, getEnt, hist, nextId } from '@/helpers/domain'
import { TODAY, addDays, fday, feur, now } from '@/helpers/dates'
import type { DecisionResult } from './types'

/** Valide la décision : bon de commande, historique et passage de la demande en « prestataire ». */
export const validerDecision = (s: AppState, csId: string, force: boolean): DecisionResult | null => {
  const c = getCs(s, csId)
  const d = getD(s, c?.demandeId)
  const dec = c?.decision
  if (!c || !d || !dec) return null
  const r = c.reponses[dec.entrepriseId]
  const ent = getEnt(s, dec.entrepriseId)
  if (!ent) return null
  dec.statut = 'validee'; dec.bc = nextId(s, 'bc'); dec.at = now(); c.statut = 'commande'
  hist(c, `${force ? 'Validée' : 'Validée par la direction'} · bon de commande ${dec.bc} émis · ${ent.nom}`)
  const others = c.entreprises.filter(x => x !== ent.id && c.reponses[x] && c.reponses[x].statut === 'recu').length
  if (others) hist(c, `Mail envoyé aux entreprises non retenues (${others})`)
  d.statut = 'prestataire'; d.dateIntervention = addDays(TODAY, r.delai ?? 0)
  c.lignes.forEach(i => { d.lignes[i].imputation = dec.imputation })
  hist(d, `Commande ${dec.bc} passée à ${ent.nom} · ${feur(r.montantHT)} HT · intervention prévue ${fday(d.dateIntervention)}`)
  return { bc: dec.bc, ent: ent.nom }
}

/* ---------- Consultations : notation des devis ---------- */
export const scoreCs = (S: AppState, c: Consultation) => {
  const rec = c.entreprises.filter(id => c.reponses[id] && c.reponses[id].statut === 'recu')
  const minP = Math.min(...rec.map(id => c.reponses[id].montantHT ?? 0))
  const minD = Math.min(...rec.map(id => c.reponses[id].delai ?? 0))
  const res: Record<string, { prix: number; delai: number; qualite: number; total: number; docsOk: boolean; docsLabel: string; complet: boolean; retenable: boolean }> = {}
  rec.forEach(id => {
    const r = c.reponses[id]
    const prix = minP / (r.montantHT ?? 1) * c.criteres.prix
    const delai = minD / (r.delai ?? 1) * c.criteres.delai
    const qualite = Math.min(c.criteres.qualite, Number(r.qualite) || 0)
    const ent = getEnt(S, id)
    const docs = ent ? entDocs(ent) : { ok: false, label: 'Inconnue' }
    const complet = (r.postes || []).length === c.lignes.length
    res[id] = { prix, delai, qualite, total: prix + delai + qualite, docsOk: docs.ok, docsLabel: docs.label, complet, retenable: docs.ok && complet }
  })
  const best = Object.entries(res).filter(([, s]) => s.retenable).sort((a, b) => b[1].total - a[1].total)[0]
  return { res, best: best ? best[0] : null, rec }
}
