import type { AppState, Constat, Entreprise, Logement, Ouvrier } from '../types'
import { TODAY } from '../lib/dates'
import { REF_DEFAULT } from './refs'

const LOGEMENTS_RAW: string[][] = [
  ['LOG-0452', 'T3', '62', '12 rue des Lilas', 'B', '3e étage', '31', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Intermédiation locative', 'F-2291', '77 Sud', 'C-118', 'Bât. B, 3e étage, porte gauche · code 4512A'],
  ['LOG-0447', 'T2', '45', "3 rue de l'Industrie", '', 'RDC', '4', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Hébergement', 'F-2240', '77 Sud', 'C-104', 'Rez-de-chaussée, porte du fond'],
  ['LOG-0461', 'T2', '41', '40 av. Thiers', '', '5e étage', '18', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-03', 'A. Benali', 'Intermédiation locative', 'F-2310', '77 Sud', 'C-131', 'Ascenseur, code 2208'],
  ['LOG-0318', 'T4', '78', '5 av. Foch', '', '2e étage', '12', '77100', 'Meaux', 'Service Hébergement 77', 'HEB-77-04', 'M. Roche', 'Hébergement', 'F-2105', '77 Nord', 'C-086', '2e étage droite · interphone 12'],
  ['LOG-0322', 'T2', '39', '18 rue Cornillon', '', '1er étage', '3', '77100', 'Meaux', 'Service Hébergement 77', 'HEB-77-04', 'M. Roche', 'Hébergement', 'F-2188', '77 Nord', 'C-090', ''],
  ['LOG-0329', 'T3', '58', '2 pl. Lafayette', '', '4e étage', '7', '77100', 'Meaux', 'Service Logement 77', 'LOG-77-01', 'M. Roche', 'Intermédiation locative', 'F-2007', '77 Nord', 'C-092', ''],
  ['LOG-0430', 'T3', '60', '7 rue des Carouges', '', '2e étage', '9', '77000', 'Vaux-le-Pénil', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Hébergement', 'F-1990', '77 Sud', 'C-071', ''],
  ['LOG-0907', 'T2', '44', '9 rue de Paris', '', '2e étage', '22', '91100', 'Corbeil-Essonnes', 'Service Logement 91', 'LOG-91-01', 'C. Dupuis', 'Intermédiation locative', 'F-3102', '91 Est', 'C-207', '2e étage sans ascenseur · code 1987B'],
  ['LOG-0915', 'T3', '63', '4 allée des Tilleuls', '', '3e étage', '12', '91100', 'Corbeil-Essonnes', 'Service Logement 91', 'LOG-91-01', 'C. Dupuis', 'Intermédiation locative', 'F-3140', '91 Est', 'C-212', ''],
  ['LOG-0912', 'T3', '66', '21 bd des Coquibus', '', '6e étage', '61', '91000', 'Évry-Courcouronnes', 'Dispositif Solibail 91', 'SOL-91-01', 'C. Dupuis', 'Solibail', 'F-3155', '91 Est', 'C-219', 'Ascenseur, 6e gauche'],
  ['LOG-0921', 'T3', '59', '14 rue Pasteur', '', '1er étage', '2', '91130', 'Ris-Orangis', 'Service Logement 91', 'LOG-91-02', 'C. Dupuis', 'Intermédiation locative', 'F-3170', '91 Est', 'C-225', ''],
  ['BUR-0004', 'BUR', '120', '10 rue du Grand Cerf', '', '1er étage', '', '77100', 'Meaux', 'Bureaux', 'BUR-77', '—', 'Bureaux', '—', '77 Nord', '—', 'Accueil au 1er étage'],
]

const logements: Logement[] = LOGEMENTS_RAW.map(r => ({
  id: r[0], typo: r[1], surface: Number(r[2]), adresse: r[3], bat: r[4], etage: r[5], apt: r[6], cp: r[7], ville: r[8],
  etab: r[9], section: r[10], cgl: r[11], dispositif: r[12], menage: r[13], secteur: r[14], cles: r[15], acces: r[16],
  dept: r[7].slice(0, 2), bailleur: '[Bailleur propriétaire]', crypto: '[ID lot Crypto]', actif: true,
}))

const ouvriers: Ouvrier[] = [
  { id: 'o1', nom: 'Karim B.', metier: 'Plomberie', color: '#1D4ED8' },
  { id: 'o2', nom: 'Julien M.', metier: 'Multi-services', color: '#0F766E' },
  { id: 'o3', nom: 'Sofiane T.', metier: 'Électricité', color: '#B54708' },
  { id: 'o4', nom: 'David L.', metier: 'Peinture / sols', color: '#6D28D9' },
  { id: 'o5', nom: 'Léa P.', metier: 'Serrurerie / menuiserie', color: '#BE185D' },
]

const entreprises: Entreprise[] = [
  { id: 'e1', nom: 'Atelier Peinture Briard', ville: 'Meaux', activite: 'peinture, revêtements', lots: ['Peinture / revêtements muraux', 'Sols'], secteur: '77 Nord', chantiers: 7, note: 4.4, docs: { kbis: '2026-08-01', urssaf: '2026-07-15', rc: '2027-03-31', decennale: '2026-12-31' } },
  { id: 'e2', nom: "Rénov'Est Bâtiment", ville: 'Chelles', activite: "tous corps d'état", lots: ['Peinture / revêtements muraux', 'Sols', 'Plâtrerie', 'Carrelage / faïence', 'Menuiseries intérieures'], secteur: '77 Nord', chantiers: 3, note: 4.6, docs: { kbis: '2026-09-15', urssaf: '2026-09-01', rc: '2027-01-31', decennale: '2027-06-30' } },
  { id: 'e3', nom: 'Déco Marne Services', ville: 'Lagny-sur-Marne', activite: 'peinture', lots: ['Peinture / revêtements muraux'], secteur: '77 Nord', chantiers: 1, note: 3.5, docs: { kbis: '2026-02-01', urssaf: '2026-01-20', rc: '2027-01-31', decennale: '2027-01-31' } },
  { id: 'e4', nom: 'Multi Travaux 77', ville: 'Meaux', activite: 'multiservices', lots: ['Peinture / revêtements muraux', 'Sols', 'Plomberie / sanitaire', 'Électricité', 'Serrurerie'], secteur: '77 Nord', chantiers: 12, note: 3.9, docs: { kbis: '2026-09-01', urssaf: '2026-08-20', rc: '2027-02-28', decennale: '2027-02-28' } },
  { id: 'e5', nom: 'Nuisibles Services IDF', ville: 'Évry-Courcouronnes', activite: 'désinsectisation, dératisation', lots: ['Nuisibles'], secteur: '91 Est', chantiers: 9, note: 4.1, accordCadre: true, docs: { kbis: '2026-09-20', urssaf: '2026-09-10', rc: '2027-04-30', decennale: '2027-04-30' } },
  { id: 'e6', nom: 'Essonne Plomberie Chauffage', ville: 'Corbeil-Essonnes', activite: 'plomberie, chauffage', lots: ['Plomberie / sanitaire', 'Chauffage / ventilation'], secteur: '91 Est', chantiers: 5, note: 4.2, accordCadre: true, docs: { kbis: '2026-10-01', urssaf: '2026-08-30', rc: '2027-05-31', decennale: '2027-05-31' } },
  { id: 'e7', nom: 'Menuiseries du Gâtinais', ville: 'Fontainebleau', activite: 'menuiseries, vitrerie', lots: ['Menuiseries extérieures / vitrerie', 'Menuiseries intérieures', 'Serrurerie'], secteur: '77 Sud', chantiers: 4, note: 4.0, docs: { kbis: '2026-08-20', urssaf: '2026-06-15', rc: '2027-01-31', decennale: '2027-01-31' } },
]

const constat = (id: string, date: string, logementId: string, auteur: string, fonction: string, contexte: string, proprete: number, bati: string, signalements: string[], photos: number, commentaire: string, suite: string): Constat =>
  ({ id, date, logementId, auteur, fonction, contexte, proprete, bati, signalements, photos: Array<string>(photos).fill('seed'), commentaire, suite })

export const seed = (): AppState => {
  const constats: Constat[] = [
    constat('CE-2026-0232', '2026-10-28', 'LOG-0447', 'R. Diallo', 'Éducateur', 'Visite à domicile', 3, 'Dégradé', ['Humidité / moisissures', 'VMC bouchée volontairement', 'Plaque de cuisson HS'], 3, 'Moisissures au plafond de la salle de bain, VMC à l’arrêt', ''),
    constat('CE-2026-0231', '2026-10-27', 'LOG-0912', 'Karim B.', 'Ouvrier', 'Intervention technique', 5, 'Moyen', ["Chauffage d'appoint à risque", 'Détecteur de fumée absent ou HS'], 2, 'Poêle à pétrole dans la chambre', 'alerte'),
    constat('CE-2026-0229', '2026-10-20', 'LOG-0322', 'L. Petit', 'Travailleuse sociale', 'Visite à domicile', 1, 'Moyen', ['Nuisibles', 'Encombrement', "Présence d'animaux (interdite)"], 4, '', ''),
    constat('CE-2026-0226', '2026-10-18', 'LOG-0915', 'A. Benali', 'CGL', 'Visite de contrôle', 4, 'Moyen', ['Aérations fenêtres bouchées', 'Linge séchant sur les portes'], 2, '', ''),
    constat('CE-2026-0223', '2026-10-14', 'LOG-0452', 'S. Martin', 'Travailleuse sociale', 'Visite à domicile', 3, 'Bon', [], 1, '', 'aucune'),
    constat('CE-2026-0219', '2026-10-09', 'LOG-0430', 'Léa P.', 'Ouvrière', 'Sortie des lieux', 2, 'Dégradé', ['Dégradations', 'Réfrigérateur HS', 'Micro-ondes HS'], 6, '', 'aucune'),
    constat('CE-2026-0150', '2026-07-02', 'LOG-0318', 'M. Roche', 'CGL', 'Visite de contrôle', 4, 'Moyen', [], 1, '', 'aucune'),
    constat('CE-2026-0101', '2026-05-12', 'LOG-0907', 'N. Kader', 'Travailleuse sociale', 'Visite à domicile', 5, 'Bon', [], 1, '', 'aucune'),
    constat('CE-2026-0062', '2026-03-02', 'LOG-0329', 'M. Roche', 'CGL', 'Visite de contrôle', 4, 'Bon', [], 0, '', 'aucune'),
    constat('CE-2026-0048', '2026-02-18', 'LOG-0921', 'N. Kader', 'Travailleuse sociale', 'Entrée dans les lieux', 6, 'Bon', [], 0, '', 'aucune'),
  ]
  return {
    v: 1,
    ref: structuredClone(REF_DEFAULT),
    logements: structuredClone(logements),
    ouvriers: structuredClone(ouvriers),
    entreprises: structuredClone(entreprises),
    demandes: [],
    rdvs: [],
    constats,
    consultations: [],
    histoMois: {},
    draft: null,
    profil: 'coord',
    mobile: { ouvrierId: 'o1', day: TODAY },
    seq: { di: 0, ce: 233, cs: 0, ft: 0, bc: 0 },
  }
}
