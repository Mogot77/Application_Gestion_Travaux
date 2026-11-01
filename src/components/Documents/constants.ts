import type { ClassementRule, ClassementView } from './types'

export const RULES: ClassementRule[] = [
  ['Département', '<n°>-<Nom>', '77-Seine-et-Marne'], ['Ville', '<Ville>', 'Corbeil-Essonnes'],
  ['Logement', '<ID>_<n°-rue>_Apt-<bât+n°>', 'LOG-0452_12-rue-des-Lilas_Apt-B31'], ['Demande', '<DI>_<date demande>', 'DI-2026-0142_2026-10-27'],
  ['Récapitulatif', '<DI>_00_Demande.pdf'], ["Photo d'une ligne", '<DI>_L<n>_<Pièce>_<Lot>-<Nature>_<AVANT|APRES>_<nn>.jpg'],
  ['Travaux sur place', '<DI>_S<n>_<Pièce>_<Lot>-<Nature>_SUPP_<nn>.jpg'], ['Fiche ST', '<DI>_<FT>_Fiche-intervention.pdf'],
  ['Rapport', '<DI>_Rapport_<date>_<interne|etablissement>.pdf'], ['Devis', '<DI>_Devis_<Entreprise>_<date>.pdf'],
  ['Sinistre', '<DI>_Sinistre_<Constat|Declaration|Expertise|Indemnisation>_<date>.pdf'], ['Photo de constat', '_Constats/<CE>_<date>_<nn>.jpg'],
]
export const VIEWS: ClassementView[] = [['', 'Tous les fichiers'], ['week', 'Photos de la semaine'], ['avap', 'Avant / après'], ['rap', 'Rapports'], ['devis', 'Devis'], ['cons', 'Constats']]
