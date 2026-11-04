/* Refacturation : calculs de facture (HT, TVA par taux, TTC) et proposition de facture à partir d'une demande. Fonctions pures. */
import type { AppState, Demande, Emetteur, Facture, FactureLigne, FactureStatut, Partie } from '@/types'
import { TODAY, addDays } from './dates'
import { getCs, getEnt, getLog } from './domain'

/** Taux de TVA proposés (en %). 10 % est le taux principal (travaux d'amélioration, d'entretien). */
export const TVA_RATES = [0, 5.5, 10, 20] as const
export const TVA_DEFAUT = 10

/** Imputation d'une ligne de demande facturée à l'usager. */
export const IMPUTATION_REFAC = 'Usager (refacturation)'

export const FACTURE_STATUT: Record<FactureStatut, [string, 'gr' | 'bl' | 'ok' | 'ko']> = {
  brouillon: ['Brouillon', 'gr'], emise: ['Émise', 'bl'], payee: ['Payée', 'ok'], annulee: ['Annulée', 'ko'],
}

/** Mention de paiement proposée par défaut (modifiable sur chaque facture). */
export const NOTES_DEFAUT = "Paiement à réception de la facture, au plus tard à la date d'échéance. En cas de retard de paiement, des pénalités calculées à trois fois le taux d'intérêt légal seront exigibles. Pas d'escompte pour paiement anticipé."

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

/** Montant 12,50 € (avec centimes, contrairement à `feur` qui arrondit à l'euro). */
export const fmoney = (n: number): string => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export const lineHT = (l: FactureLigne): number => round2(l.qte * l.puHT)

export type TvaGroup = { taux: number; baseHT: number; tva: number }
export type FactureTotals = { totalHT: number; totalTVA: number; totalTTC: number; parTaux: TvaGroup[] }

/** Totaux d'une facture : la TVA est calculée par taux sur la somme des bases (et non ligne par ligne), comme sur une facture réglementaire. */
export const factureTotals = (lignes: FactureLigne[]): FactureTotals => {
  const bases = new Map<number, number>()
  for (const l of lignes) bases.set(l.tva, round2((bases.get(l.tva) ?? 0) + lineHT(l)))
  const parTaux = [...bases.entries()].sort((a, b) => a[0] - b[0]).map(([taux, baseHT]) => ({ taux, baseHT, tva: round2(baseHT * taux / 100) }))
  const totalHT = round2(parTaux.reduce((s, g) => s + g.baseHT, 0))
  const totalTVA = round2(parTaux.reduce((s, g) => s + g.tva, 0))
  return { totalHT, totalTVA, totalTTC: round2(totalHT + totalTVA), parTaux }
}

const partieVide = (): Partie => ({ nom: '', adresse: '', cp: '', ville: '', email: '', tel: '' })
export const emetteurVide = (): Emetteur => ({ ...partieVide(), siret: '', tvaIntra: '', iban: '' })

const isRefac = (imputation: string): boolean => imputation === IMPUTATION_REFAC

/** Demandes ayant au moins une ligne refacturable à l'usager et pas encore de facture active (hors annulée). */
export const refacturables = (S: AppState): Demande[] => {
  const faites = new Set(S.factures.filter(f => f.statut !== 'annulee').map(f => f.demandeId))
  return S.demandes.filter(d => d.lignes.some(l => isRefac(l.imputation)) && !faites.has(d.id))
}

/** Émetteur à reprendre : celui de la dernière facture saisie (les informations légales ne changent pas d'une facture à l'autre). */
export const lastEmetteur = (S: AppState): Emetteur => {
  const last = S.factures.find(f => f.emetteur.nom)
  return last ? { ...last.emetteur } : emetteurVide()
}

/** Facture proposée pour une demande : montant du devis retenu s'il existe, sinon une ligne par travail refacturé (prix à saisir) ; consommables en plus. */
export const proposeFacture = (S: AppState, d: Demande): Omit<Facture, 'id'> => {
  const log = getLog(S, d.logementId)
  const cs = getCs(S, d.consultationId)
  const dec = cs?.decision
  const rep = dec ? cs?.reponses[dec.entrepriseId] : undefined
  const lignes: FactureLigne[] = []
  if (dec && rep?.montantHT) {
    const lots = [...new Set(d.lignes.filter(l => isRefac(l.imputation)).map(l => l.lot))].join(', ')
    lignes.push({ libelle: `Travaux ${lots} — ${getEnt(S, dec.entrepriseId)?.nom ?? 'entreprise'}`, qte: 1, unite: 'forfait', puHT: rep.montantHT, tva: rep.tva ?? TVA_DEFAUT })
  } else {
    for (const l of d.lignes.filter(x => isRefac(x.imputation))) {
      lignes.push({ libelle: [l.lot, l.nature, l.piece].filter(Boolean).join(' — '), qte: 1, unite: 'forfait', puHT: 0, tva: TVA_DEFAUT })
    }
  }
  for (const c of d.consommables.filter(x => x.pris && x.qte > 0)) lignes.push({ libelle: c.nom, qte: c.qte, unite: 'u', puHT: 0, tva: TVA_DEFAUT })
  return {
    demandeId: d.id, statut: 'brouillon', date: TODAY, echeance: addDays(TODAY, 30),
    prestation: d.dateIntervention ?? TODAY,
    emetteur: lastEmetteur(S),
    destinataire: {
      ...partieVide(), nom: log?.menage ?? '', cp: log?.cp ?? '', ville: log?.ville ?? '',
      adresse: log ? [log.adresse, log.bat && `bât. ${log.bat}`, log.apt && `apt ${log.apt}`].filter(Boolean).join(', ') : '',
    },
    objet: `Refacturation de travaux — demande ${d.id}`,
    lignes, notes: NOTES_DEFAUT, historique: [],
  }
}

/** Points bloquant l'émission (mentions obligatoires manquantes) ; liste vide = facture émissible. */
export const factureErrors = (f: Facture): string[] => {
  const e: string[] = []
  if (!f.emetteur.nom.trim()) e.push("Nom de l'émetteur")
  if (!f.emetteur.adresse.trim() || !f.emetteur.cp.trim() || !f.emetteur.ville.trim()) e.push("Adresse complète de l'émetteur")
  if (!f.emetteur.siret.trim()) e.push("SIRET de l'émetteur")
  if (!f.destinataire.nom.trim()) e.push('Nom du destinataire')
  if (!f.destinataire.adresse.trim()) e.push('Adresse du destinataire')
  if (!f.date) e.push("Date d'émission")
  if (!f.echeance) e.push("Date d'échéance")
  if (f.lignes.length === 0) e.push('Au moins une ligne')
  if (f.lignes.some(l => !l.libelle.trim() || l.qte <= 0)) e.push('Désignation et quantité de chaque ligne')
  if (f.lignes.length > 0 && factureTotals(f.lignes).totalHT <= 0) e.push('Un montant supérieur à 0')
  return e
}
