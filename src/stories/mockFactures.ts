import type { Facture } from '@/types'
import { TODAY, addDays } from '@/helpers/dates'
import { NOTES_DEFAUT } from '@/helpers/billing'

/** Facture factice (brouillon complet) réutilisée par les stories de la refacturation. */
export const mockFacture = (p: Partial<Facture> = {}): Facture => ({
  id: 'FA-2026-0001', demandeId: 'DI-2026-0281', statut: 'brouillon', date: TODAY, echeance: addDays(TODAY, 30), prestation: addDays(TODAY, -6),
  emetteur: { nom: 'Association Exemple', adresse: '12 rue des Lilas', cp: '77000', ville: 'Melun', email: 'compta@exemple.test', tel: '01 23 45 67 89', siret: '123 456 789 00012', tvaIntra: 'FR12 123456789', iban: 'FR76 3000 6000 0112 3456 7890 189' },
  destinataire: { nom: 'M. Dupont', adresse: '8 avenue de la Gare, bât. B, apt 12', cp: '77000', ville: 'Melun', email: '', tel: '' },
  objet: 'Refacturation de travaux — demande DI-2026-0281',
  lignes: [
    { libelle: 'Plomberie — remplacement du siphon (cuisine)', qte: 1, unite: 'forfait', puHT: 185, tva: 10 },
    { libelle: 'Main d’œuvre', qte: 2, unite: 'h', puHT: 42.5, tva: 10 },
    { libelle: 'Joint silicone', qte: 3, unite: 'u', puHT: 4.9, tva: 20 },
  ],
  notes: NOTES_DEFAUT, historique: [], ...p,
})
