import type { AppState, Consultation, DecisionDevis } from '@/types'
import { entDocs, getCs, getD, getEnt, getLog, hist, nextId, shortLot } from '@/helpers/domain'
import { TODAY, addDays, fday, feur, now } from '@/helpers/dates'
import type { CsScore, DecisionResult, EntScore, QuotesModel } from './types'

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
export const scoreCs = (S: AppState, c: Consultation): CsScore => {
  const rec = c.entreprises.filter(id => c.reponses[id] && c.reponses[id].statut === 'recu')
  const minP = Math.min(...rec.map(id => c.reponses[id].montantHT ?? 0))
  const minD = Math.min(...rec.map(id => c.reponses[id].delai ?? 0))
  const res: Record<string, EntScore> = {}
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

/** Modèle d'affichage de la comparaison des devis ; `error` renseigné si la consultation ou la demande est introuvable. */
export const buildQuotesModel = (S: AppState, id: string): { model: QuotesModel | null; error: string } => {
  const c = getCs(S, id)
  if (!c) return { model: null, error: 'Consultation introuvable' }
  const d = getD(S, c.demandeId)
  if (!d) return { model: null, error: 'Demande introuvable' }
  const log = getLog(S, d.logementId)
  const sc = scoreCs(S, c)
  const ents = c.entreprises.map(e => getEnt(S, e)).filter((e): e is NonNullable<typeof e> => !!e)
  const rec = sc.rec
  const declined = c.entreprises.filter(x => c.reponses[x] && c.reponses[x].statut === 'decline').length
  const waiting = c.entreprises.filter(x => !c.reponses[x] || c.reponses[x].statut === 'attente')
  const prices = rec.map(x => c.reponses[x].montantHT ?? 0)
  const ecart = prices.length > 1 ? Math.round((Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) * 100) : null
  const dec: DecisionDevis = c.decision || { entrepriseId: sc.best || '', motif: '', imputation: d.lignes[c.lignes[0]].imputation, statut: 'brouillon' }
  const chosen = dec.entrepriseId ? c.reponses[dec.entrepriseId] : undefined
  const needDir = !!chosen && (chosen.montantHT ?? 0) > S.ref.seuils.direction
  const locked = dec.statut === 'validee' || dec.statut === 'a_valider'
  const lotsLabel = c.lignes.map(i => shortLot(d.lignes[i].lot)).filter((v, i, a) => a.indexOf(v) === i).join(' et ')
  return {
    error: '',
    model: {
      c, d, log, sc, ents, declined, waitingCount: waiting.length, ecart, dec, decEntNom: getEnt(S, dec.entrepriseId)?.nom,
      chosenMontant: chosen?.montantHT, needDir, locked, lotsLabel,
      recOptions: rec.map(x => ({ v: x, l: `${getEnt(S, x)?.nom}${sc.res[x].retenable ? '' : ' (non retenable)'}` })),
      imputations: S.ref.imputations, seuilDirection: S.ref.seuils.direction, isDir: S.profil === 'dir',
      historique: c.historique.slice().sort((a, b) => b.at.localeCompare(a.at)),
    },
  }
}

/** Lignes du CSV comparatif (en-tête inclus). */
export const buildQuotesCsvRows = (S: AppState, c: Consultation, sc: CsScore): unknown[][] => {
  const rows: unknown[][] = [['Entreprise', 'Statut', 'Montant HT', 'TVA %', 'Délai (j)', 'Durée (j)', 'Validité (mois)', 'Postes', 'Documents', 'Note prix', 'Note délai', 'Note qualité', 'Total']]
  c.entreprises.forEach(x => {
    const r = c.reponses[x] || {}; const s = sc.res[x]
    rows.push([getEnt(S, x)?.nom, r.statut, r.montantHT, r.tva, r.delai, r.duree, r.validite, r.postes ? r.postes.length + '/' + c.lignes.length : '', s ? (s.docsOk ? 'Conformes' : s.docsLabel) : '', s ? s.prix.toFixed(1) : '', s ? s.delai.toFixed(1) : '', s ? s.qualite : '', s ? s.total.toFixed(1) : ''])
  })
  return rows
}
