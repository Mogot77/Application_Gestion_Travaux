import type { ModeOption } from './types'

/** Modes d'achat proposés à l'étape 1. */
export const MODES: ModeOption[] = [
  ['accord', 'Bon de commande accord-cadre', 'Titulaire du lot désigné selon les règles du marché'],
  ['devis', 'Mise en concurrence par devis', 'Plusieurs entreprises consultées, choix motivé'],
  ['unique', 'Entreprise unique', 'Urgence ou montant faible, motif obligatoire'],
]

/** Critères de choix annoncés : [clé, libellé]. */
export const CRITERES = [['prix', 'Prix'], ['delai', "Délai d'intervention"], ['qualite', 'Qualité et références']] as const
