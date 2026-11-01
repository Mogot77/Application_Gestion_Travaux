/* Valeurs d'origine des villes et départements (voir listeners/refsMigration.ts). À supprimer après la migration. */
export const LEGACY_VILLES: Record<string, [number, number]> = {
  'Paris': [48.8566, 2.3522], 'Chelles': [48.8806, 2.5903], 'Lagny-sur-Marne': [48.8736, 2.7075], 'Torcy': [48.8498, 2.6552], 'Meaux': [48.9606, 2.878],
  'Ris-Orangis': [48.6522, 2.4098], 'Évry-Courcouronnes': [48.6324, 2.44], 'Corbeil-Essonnes': [48.6103, 2.4818], 'Savigny-le-Temple': [48.5936, 2.5845],
  'Melun': [48.54, 2.66], 'Vaux-le-Pénil': [48.5212, 2.68], 'Fontainebleau': [48.4047, 2.7016],
}
export const LEGACY_DEPTS: Record<string, string> = { '77': '77-Seine-et-Marne', '91': '91-Essonne' }
