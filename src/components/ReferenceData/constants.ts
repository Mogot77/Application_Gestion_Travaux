import type { ListDef } from './types'

// [clé, titre, qui renseigne, type] — list : tableau de chaînes, obj : tableau {k,l,d}, group : objet de listes
export const LISTS: ListDef[] = [
  ['fonctions', "Fonction de l'auteur", 'Pré-remplie depuis le compte · modifiable', 'list'],
  ['urgences', "Niveau d'urgence", 'Établissement · requalifiable par la coordination', 'obj'],
  ['piecesLogement', 'Pièces du logement', 'Établissement · filtrées selon la typologie (T2 : sans chambre 2 · T4 : ajoute chambre 3)', 'list'],
  ['piecesAutres', 'Pièces : autres', 'Établissement', 'list'],
  ['lots', 'Lots de travaux et natures', "Établissement · liste en cascade, alignée si possible sur les lots de l'accord-cadre", 'group'],
  ['cles', 'Mise à disposition des clés', 'Établissement', 'list'],
  ['imputations', 'Imputation de la charge', 'Coordination · par ligne', 'list'],
  ['circuits', "Circuit d'exécution", 'Coordination · par ligne', 'obj'],
  ['natSinistre', 'Nature du sinistre', 'Établissement · suivi par la coordination et la gestion locative', 'list'],
  ['assureurs', 'Assureur concerné', 'Coordination', 'list'],
  ['motifsRenvoi', 'Motifs de renvoi (à compléter)', 'Coordination · obligatoire pour renvoyer', 'list'],
  ['motifsRejet', 'Motifs de rejet', 'Coordination · obligatoire pour rejeter', 'list'],
  ['contextes', "Constat d'état : contexte", 'Tout salarié', 'list'],
  ['signalements', 'Signalements du constat', 'Tout salarié · cases à cocher, plusieurs choix', 'group'],
  ['motifsAcces', 'Motifs « accès impossible »', 'Ouvrier sur place · photo obligatoire', 'list'],
]
