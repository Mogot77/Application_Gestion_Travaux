/* Données factices réservées à Storybook (jamais importées par l'application). */
import type {
  AppState, Constat, Consultation, Demande, Entreprise, Ligne, Logement, Moi, Ouvrier, Rapport, Rdv, Referentiels,
} from '@/types'
import { TODAY, addDays } from '@/helpers/dates'
import { ROLES, type Role } from '@/helpers/roles'
import { withMe } from '@/store/selectors/withMe'

/* ───────── Référentiels ───────── */
export const mockRef: Referentiels = {
  seuils: { troisDevis: 1500, direction: 2000, supplementMin: 60 },
  urgences: [
    { k: 'urgent', l: 'Urgent', d: 'Sécurité, fuite active, porte bloquée, panne générale, pas de chauffage' },
    { k: 'h48', l: 'Sous 48 h', d: 'Gêne importante sans danger immédiat' },
    { k: 'prog', l: 'Programmable', d: 'Entretien, embellissement, petites réparations' },
  ],
  piecesLogement: ['Entrée', 'Séjour', 'Cuisine', 'Salle de bain', 'WC', 'Dégagement', 'Chambre 1', 'Chambre 2', 'Chambre 3', 'Rangement / cellier', 'Balcon / extérieur'],
  piecesAutres: ['Logement entier', 'Parties communes', 'Cave / parking'],
  piecesBureau: ['Bureau', 'Salle de réunion', 'Accueil', 'Sanitaires', 'Cuisine'],
  lots: {
    'Plomberie / sanitaire': ['Fuite', 'WC bouché', "Chasse d'eau", 'Évacuation bouchée', 'Robinetterie', "Ballon d'eau chaude", 'Joints silicone'],
    'Électricité': ['Prise ou interrupteur', 'Éclairage', 'Tableau ou disjoncteur', 'Panne générale'],
    'Chauffage / ventilation': ['Radiateur', 'Chaudière', 'VMC', 'Thermostat'],
    'Serrurerie': ['Cylindre', 'Porte bloquée', 'Serrure', 'Clés perdues'],
    'Menuiseries intérieures': ['Porte', 'Placard', 'Poignée'],
    'Menuiseries extérieures / vitrerie': ['Fenêtre', 'Volet', 'Vitre cassée'],
    'Peinture / revêtements muraux': ['Reprise murs', 'Reprise murs et plafond', 'Papier peint'],
    'Sols': ['Lino', 'Parquet', 'Plinthes'],
    'Carrelage / faïence': ['Faïence décollée', 'Carreau cassé'],
    'Plâtrerie': ['Trou dans cloison', 'Fissure', 'Faux plafond'],
    'Humidité / moisissures': ['Moisissures', 'Infiltration', 'Condensation'],
    'Nuisibles': ['Punaises de lit', 'Cafards', 'Rongeurs'],
    'Équipements / électroménager / mobilier': ['Réfrigérateur', 'Plaque de cuisson', 'Micro-ondes', 'Mobilier cassé'],
    'Nettoyage / débarras': ['Nettoyage', 'Débarras', 'Encombrants'],
    'Sinistre / assurance': ['Dégât des eaux · origine dans le logement', 'Dégât des eaux · origine voisin ou copropriété', 'Incendie / fumées', 'Effraction / vandalisme', 'Bris de glace'],
    'Autre (description obligatoire)': ['Autre'],
  },
  cles: ["Bureau de l'établissement", "Remise par l'occupant (présent)", 'Boîte à clés (code transmis)', 'Gardien / loge', 'Bureau du service technique'],
  fonctions: ['Travailleur·se social·e', 'Chef·fe de service', "Directeur·rice d'établissement", 'Référent·e logement', 'Chargé·e de gestion locative', 'Coordination ST', "Chef d'équipe / ouvrier", 'Occupant (Solibail)', 'Autre (préciser)'],
  imputations: ['Equalis', 'Bailleur propriétaire', 'Locataire', 'Usager (refacturation)'],
  circuits: [
    { k: 'ST', l: 'Service technique', d: 'Génère le N° FT, à planifier' },
    { k: 'bailleur', l: 'Bailleur', d: 'Demande transmise au propriétaire' },
    { k: 'prestataire', l: 'Prestataire', d: 'Entreprise mandatée, devis possible' },
    { k: 'sinistre', l: 'Sinistre / assurance', d: 'Déclaration, expertise, indemnisation, puis travaux' },
  ],
  motifsRenvoi: ['Photo manquante ou illisible', 'Description insuffisante', 'Logement erroné', 'Accès ou clés non précisés'],
  motifsRejet: ["Doublon d'une demande en cours", 'Demande injustifiée', 'Hors périmètre Equalis', 'Besoin déjà traité'],
  contextes: ['Visite à domicile', 'Entrée dans les lieux', 'Sortie des lieux', 'Intervention technique', 'Visite de contrôle', 'Autre'],
  proprete: ['Insalubre, danger pour la santé', 'Très sale', 'Sale', 'Passable', 'Correct', 'Propre', 'Impeccable'],
  signalements: {
    'Sécurité': ["Chauffage d'appoint à risque", 'Installation électrique dangereuse', 'Détecteur de fumée absent ou HS'],
    'Aération et humidité': ['Humidité / moisissures', 'VMC bouchée volontairement', 'Aérations fenêtres bouchées', 'Linge séchant sur les portes'],
    'Équipements': ['Réfrigérateur HS', 'Micro-ondes HS', 'Plaque de cuisson HS', 'Autre équipement HS'],
    'Usage du logement': ["Présence d'animaux (interdite)", 'Encombrement', 'Odeurs', 'Nuisibles', 'Dégradations'],
  },
  natSinistre: ['Dégât des eaux · origine dans le logement', 'Dégât des eaux · origine voisin ou copropriété', 'Incendie / fumées', 'Effraction / vandalisme', 'Bris de glace'],
  assureurs: ["Assurance habitation de l'occupant", "Assurance d'Equalis", 'Assurance du propriétaire bailleur', "Assurance de l'immeuble (via le syndic)"],
  motifsAcces: ['Occupant absent', 'Clés absentes', "Refus d'accès", 'Adresse ou code erroné'],
  suitesSupp: [
    { k: 'realise', l: 'Réalisé pendant ce passage', d: 'Sous le seuil de temps' },
    { k: 'programmer', l: 'À programmer', d: 'La coordination planifie un nouveau passage' },
    { k: 'validation', l: 'Demander la validation', d: 'Au-delà du seuil, ou charge bailleur / usager' },
  ],
  villes: {
    'Paris': [48.8566, 2.3522], 'Chelles': [48.8806, 2.5903], 'Meaux': [48.9606, 2.878], 'Melun': [48.54, 2.66],
    'Vaux-le-Pénil': [48.5212, 2.68], 'Ris-Orangis': [48.6522, 2.4098], 'Évry-Courcouronnes': [48.6324, 2.44],
    'Corbeil-Essonnes': [48.6103, 2.4818], 'Fontainebleau': [48.4047, 2.7016],
  },
  depts: { '77': '77-Seine-et-Marne', '91': '91-Essonne' },
  refsMigrated: true,
}

/* ───────── Logements, ouvriers, entreprises ───────── */
type LogRaw = [id: string, typo: string, surface: number, adresse: string, etage: string, apt: string, cp: string, ville: string, etab: string, section: string, cgl: string, dispositif: string, secteur: string, acces: string, lat: number, lng: number]

const LOG_RAW: LogRaw[] = [
  ['LOG-0452', 'T3', 62, '12 rue des Lilas', '3e étage', '31', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Intermédiation locative', '77 Sud', 'Bât. B, 3e étage, porte gauche · code 4512A', 48.5392, 2.6598],
  ['LOG-0447', 'T2', 45, "3 rue de l'Industrie", 'RDC', '4', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Hébergement', '77 Sud', 'Rez-de-chaussée, porte du fond', 48.5421, 2.6544],
  ['LOG-0318', 'T4', 78, '5 av. Foch', '2e étage', '12', '77100', 'Meaux', 'Service Hébergement 77', 'HEB-77-04', 'M. Roche', 'Hébergement', '77 Nord', '2e étage droite · interphone 12', 48.9588, 2.8793],
  ['LOG-0322', 'T2', 39, '18 rue Cornillon', '1er étage', '3', '77100', 'Meaux', 'Service Hébergement 77', 'HEB-77-04', 'M. Roche', 'Hébergement', '77 Nord', '', 48.9611, 2.8764],
  ['LOG-0907', 'T2', 44, '9 rue de Paris', '2e étage', '22', '91100', 'Corbeil-Essonnes', 'Service Logement 91', 'LOG-91-01', 'C. Dupuis', 'Intermédiation locative', '91 Est', '2e étage sans ascenseur · code 1987B', 48.6089, 2.4813],
  ['LOG-0912', 'T3', 66, '21 bd des Coquibus', '6e étage', '61', '91000', 'Évry-Courcouronnes', 'Dispositif Solibail 91', 'SOL-91-01', 'C. Dupuis', 'Solibail', '91 Est', 'Ascenseur, 6e gauche', 48.6291, 2.4358],
  ['LOG-0921', 'T3', 59, '14 rue Pasteur', '1er étage', '2', '91130', 'Ris-Orangis', 'Service Logement 91', 'LOG-91-02', 'C. Dupuis', 'Intermédiation locative', '91 Est', '', 48.6504, 2.4081],
]

export const mockLogements: Logement[] = LOG_RAW.map(([id, typo, surface, adresse, etage, apt, cp, ville, etab, section, cgl, dispositif, secteur, acces, lat, lng]) => ({
  id, typo, surface, adresse, bat: '', etage, apt, cp, ville, etab, section, cgl, dispositif, menage: 'F-' + id.slice(4),
  secteur, cles: 'C-' + id.slice(4), acces, dept: cp.slice(0, 2), bailleur: 'Bailleur propriétaire', crypto: 'ID-' + id.slice(4), actif: true, lat, lng,
}))

export const mockOuvriers: Ouvrier[] = [
  { id: 'o1', nom: 'Karim B.', metier: 'Plomberie', color: '#1D4ED8', tel: '06 11 22 33 44', email: 'karim.b@equalis.test' },
  { id: 'o2', nom: 'Julien M.', metier: 'Multi-services', color: '#0F766E', tel: '06 22 33 44 55', email: 'julien.m@equalis.test' },
  { id: 'o3', nom: 'Sofiane T.', metier: 'Électricité', color: '#B54708', email: 'sofiane.t@equalis.test' },
  { id: 'o4', nom: 'David L.', metier: 'Peinture / sols', color: '#6D28D9', email: 'david.l@equalis.test' },
  { id: 'o5', nom: 'Léa P.', metier: 'Serrurerie / menuiserie', color: '#BE185D', actif: false },
]

const docsOk = { kbis: '2027-08-01', urssaf: '2027-07-15', rc: '2027-12-31', decennale: '2027-12-31' }

export const mockEntreprises: Entreprise[] = [
  { id: 'e1', nom: 'Atelier Peinture Briard', ville: 'Meaux', activite: 'peinture, revêtements', lots: ['Peinture / revêtements muraux', 'Sols'], secteur: '77 Nord', chantiers: 7, note: 4.4, docs: docsOk },
  { id: 'e2', nom: "Rénov'Est Bâtiment", ville: 'Chelles', activite: "tous corps d'état", lots: ['Peinture / revêtements muraux', 'Sols', 'Plâtrerie', 'Carrelage / faïence'], secteur: '77 Nord', chantiers: 3, note: 4.6, docs: docsOk },
  { id: 'e3', nom: 'Déco Marne Services', ville: 'Lagny-sur-Marne', activite: 'peinture', lots: ['Peinture / revêtements muraux'], secteur: '77 Nord', chantiers: 1, note: 3.5, docs: { ...docsOk, urssaf: '2026-01-20' } },
  { id: 'e5', nom: 'Nuisibles Services IDF', ville: 'Évry-Courcouronnes', activite: 'désinsectisation, dératisation', lots: ['Nuisibles'], secteur: '91 Est', chantiers: 9, note: 4.1, accordCadre: true, docs: docsOk },
  { id: 'e6', nom: 'Essonne Plomberie Chauffage', ville: 'Corbeil-Essonnes', activite: 'plomberie, chauffage', lots: ['Plomberie / sanitaire', 'Chauffage / ventilation'], secteur: '91 Est', chantiers: 5, note: 4.2, accordCadre: true, docs: docsOk },
]

/* ───────── Demandes ───────── */
const ligne = (p: Partial<Ligne> & Pick<Ligne, 'piece' | 'lot' | 'nature' | 'description'>): Ligne => ({
  photos: [], imputation: 'Equalis', circuit: 'ST', duree: 60, urgence: 'prog', statut: '', ...p,
})

type DemandeIn = Pick<Demande, 'id' | 'logementId' | 'statut' | 'urgence' | 'lignes'> & Partial<Demande>

const demande = (d: DemandeIn): Demande => ({
  recueLe: addDays(TODAY, -3), origine: 'etab', auteur: 'S. Martin', fonction: 'Travailleur·se social·e', tel: '06 12 34 56 78',
  dateSouhaitee: '', acces: 'Occupant présent en journée', numCles: '', lieuCles: '', facturation: 'Equalis', sinistre: 'non', sinistreInfo: null,
  observations: '', message: '', consommables: [], historique: [], ft: '', auteurEmail: 'sophie.martin@equalis.test', ...d,
})

const h = (n: number, t: string) => ({ at: addDays(TODAY, -n) + 'T09:30', t })

export const mockDemandes: Demande[] = [
  demande({
    id: 'DI-2026-0301', logementId: 'LOG-0447', statut: 'a_qualifier', urgence: 'urgent', recueLe: TODAY,
    message: "Fuite sous l'évier, l'eau coule sur le sol.", historique: [h(0, 'Demande créée')],
    lignes: [ligne({ piece: 'Cuisine', lot: 'Plomberie / sanitaire', nature: 'Fuite', description: "Fuite active sous l'évier", photos: ['seed', 'seed'], urgence: 'urgent', circuit: '' })],
  }),
  demande({
    id: 'DI-2026-0298', logementId: 'LOG-0452', statut: 'a_planifier', urgence: 'h48', ft: 'FT-2026-0120', recueLe: addDays(TODAY, -2),
    historique: [h(2, 'Demande créée'), h(1, 'Qualifiée par la coordination')],
    lignes: [
      ligne({ piece: 'Séjour', lot: 'Électricité', nature: 'Prise ou interrupteur', description: 'Prise murale qui ne fonctionne plus', urgence: 'h48', duree: 45, photos: ['seed'] }),
      ligne({ piece: 'Chambre 1', lot: 'Menuiseries extérieures / vitrerie', nature: 'Volet', description: 'Volet roulant bloqué', urgence: 'h48', duree: 60 }),
    ],
  }),
  demande({
    id: 'DI-2026-0290', logementId: 'LOG-0318', statut: 'planifiee', urgence: 'prog', ft: 'FT-2026-0112', origine: 'mail', dateIntervention: addDays(TODAY, 1),
    historique: [h(6, 'Demande créée'), h(4, 'Qualifiée'), h(3, 'Planifiée')],
    lignes: [ligne({ piece: 'Salle de bain', lot: 'Plomberie / sanitaire', nature: 'Joints silicone', description: 'Refaire les joints de la baignoire', duree: 90, statut: 'planifiee' })],
  }),
  demande({
    id: 'DI-2026-0285', logementId: 'LOG-0907', statut: 'en_cours', urgence: 'h48', ft: 'FT-2026-0108', dateIntervention: TODAY,
    historique: [h(8, 'Demande créée'), h(5, 'Planifiée'), h(0, 'Intervention démarrée')],
    lignes: [
      ligne({ piece: 'Cuisine', lot: 'Plomberie / sanitaire', nature: 'Évacuation bouchée', description: 'Évier bouché', urgence: 'h48', duree: 60, statut: 'planifiee' }),
      ligne({ piece: 'Entrée', lot: 'Serrurerie', nature: 'Cylindre', description: 'Cylindre à remplacer', urgence: 'h48', duree: 30, statut: 'planifiee' }),
    ],
  }),
  demande({
    id: 'DI-2026-0270', logementId: 'LOG-0921', statut: 'realisee', urgence: 'prog', ft: 'FT-2026-0095', dateIntervention: addDays(TODAY, -2),
    historique: [h(14, 'Demande créée'), h(10, 'Planifiée'), h(2, 'Intervention réalisée')],
    lignes: [ligne({ piece: 'Chambre 2', lot: 'Peinture / revêtements muraux', nature: 'Reprise murs', description: 'Reprise de peinture après dégradation', duree: 180, statut: 'realisee', photos: ['seed'], photosApres: ['seed'] })],
  }),
  demande({
    id: 'DI-2026-0255', logementId: 'LOG-0912', statut: 'cloturee', urgence: 'prog', origine: 'tel', ft: 'FT-2026-0080', dateIntervention: addDays(TODAY, -15),
    historique: [h(25, 'Demande créée'), h(16, 'Planifiée'), h(15, 'Réalisée'), h(12, 'Clôturée')],
    lignes: [ligne({ piece: 'Séjour', lot: 'Sols', nature: 'Plinthes', description: 'Plinthes décollées', duree: 60, statut: 'realisee' })],
  }),
  demande({
    id: 'DI-2026-0292', logementId: 'LOG-0322', statut: 'acces_impossible', urgence: 'h48', ft: 'FT-2026-0114', dateIntervention: addDays(TODAY, -1),
    historique: [h(5, 'Demande créée'), h(2, 'Planifiée'), h(1, 'Accès impossible : occupant absent')],
    lignes: [ligne({ piece: 'Salle de bain', lot: 'Chauffage / ventilation', nature: 'VMC', description: 'VMC bruyante', urgence: 'h48', duree: 45, statut: 'non_realisee' })],
  }),
  demande({
    id: 'DI-2026-0288', logementId: 'LOG-0452', statut: 'consultation', urgence: 'prog', consultationId: 'CS-2026-0011',
    historique: [h(9, 'Demande créée'), h(6, 'Qualifiée'), h(4, 'Consultation envoyée')],
    lignes: [ligne({ piece: 'Logement entier', lot: 'Peinture / revêtements muraux', nature: 'Reprise murs et plafond', description: 'Remise en peinture complète du T3', circuit: 'prestataire', duree: 1200, photos: ['seed', 'seed'] })],
  }),
  demande({
    id: 'DI-2026-0281', logementId: 'LOG-0907', statut: 'prestataire', urgence: 'h48', consultationId: 'CS-2026-0009', ft: 'FT-2026-0101',
    historique: [h(20, 'Demande créée'), h(12, 'Consultation envoyée'), h(5, 'Commande passée')],
    lignes: [ligne({ piece: 'Logement entier', lot: 'Nuisibles', nature: 'Punaises de lit', description: 'Traitement punaises de lit', circuit: 'prestataire', urgence: 'h48', duree: 240 })],
  }),
  demande({
    id: 'DI-2026-0277', logementId: 'LOG-0912', statut: 'sinistre', urgence: 'urgent', facturation: 'Assurance', sinistre: 'oui',
    sinistreInfo: { nature: 'Dégât des eaux · origine voisin ou copropriété', date: addDays(TODAY, -7), fuite: 'Fuite du voisin du dessus', tiers: 'Syndic Foncia', constat: 'Constat amiable envoyé' },
    historique: [h(7, 'Demande créée'), h(6, 'Déclaration sinistre')],
    lignes: [ligne({ piece: 'Salle de bain', lot: 'Sinistre / assurance', nature: 'Dégât des eaux · origine voisin ou copropriété', description: 'Plafond taché et gonflé', circuit: 'sinistre', urgence: 'urgent', imputation: 'Bailleur propriétaire', photos: ['seed'] })],
  }),
]

/* ───────── Rendez-vous ───────── */
const rapport: Rapport = {
  tempsMin: 85, lignes: ['realisee'], motifs: [''], conso: [{ nom: 'Peinture blanche 10 L', qte: 1 }], supps: [],
  obs: 'Travaux terminés, locaux laissés propres.', signature: 'seed', signataire: 'Occupante', corr: null,
}

export const mockRdvs: Rdv[] = [
  { id: 'R-01', ouvrierId: 'o4', date: addDays(TODAY, -2), debut: '09:00', duree: 180, label: 'Reprise de peinture', etat: 'done', demandeId: 'DI-2026-0270', debutReel: '09:05', finReel: '10:30', rapport },
  { id: 'R-02', ouvrierId: 'o1', date: TODAY, debut: '08:30', duree: 60, label: 'Évier bouché', etat: 'running', demandeId: 'DI-2026-0285', debutReel: '08:35' },
  { id: 'R-03', ouvrierId: 'o2', date: TODAY, debut: '10:00', duree: 30, label: 'Remplacement cylindre', etat: 'planned', demandeId: 'DI-2026-0285' },
  { id: 'R-04', ouvrierId: 'o1', date: TODAY, debut: '14:00', duree: 90, label: 'Joints baignoire', etat: 'planned', demandeId: 'DI-2026-0290' },
  { id: 'R-05', ouvrierId: 'o3', date: addDays(TODAY, -1), debut: '11:00', duree: 45, label: 'VMC bruyante', etat: 'imp', demandeId: 'DI-2026-0292', motifImp: 'Occupant absent' },
  { id: 'R-06', ouvrierId: 'o2', date: addDays(TODAY, 1), debut: '09:00', duree: 90, label: 'Joints baignoire', etat: 'planned', demandeId: 'DI-2026-0290' },
  { id: 'R-07', ouvrierId: 'o3', date: addDays(TODAY, 2), debut: '09:30', duree: 120, label: 'Contrôle tableau électrique', etat: 'planned' },
]

/* ───────── Constats ───────── */
const constat = (c: Omit<Constat, 'photos' | 'commentaire'> & { nbPhotos?: number; commentaire?: string }): Constat => {
  const { nbPhotos = 0, commentaire = '', ...rest } = c
  return { ...rest, photos: Array<string>(nbPhotos).fill('seed'), commentaire }
}

export const mockConstats: Constat[] = [
  constat({ id: 'CE-2026-0232', date: addDays(TODAY, -1), logementId: 'LOG-0447', auteur: 'R. Diallo', fonction: 'Éducateur', contexte: 'Visite à domicile', proprete: 3, bati: 'Dégradé', signalements: ['Humidité / moisissures', 'VMC bouchée volontairement'], nbPhotos: 3, commentaire: 'Moisissures au plafond de la salle de bain', suite: '' }),
  constat({ id: 'CE-2026-0231', date: addDays(TODAY, -2), logementId: 'LOG-0912', auteur: 'Karim B.', fonction: 'Ouvrier', contexte: 'Intervention technique', proprete: 5, bati: 'Moyen', signalements: ["Chauffage d'appoint à risque"], nbPhotos: 2, commentaire: 'Poêle à pétrole dans la chambre', suite: 'alerte' }),
  constat({ id: 'CE-2026-0229', date: addDays(TODAY, -9), logementId: 'LOG-0322', auteur: 'L. Petit', fonction: 'Travailleuse sociale', contexte: 'Visite à domicile', proprete: 1, bati: 'Moyen', signalements: ['Nuisibles', 'Encombrement'], nbPhotos: 4, suite: '' }),
  constat({ id: 'CE-2026-0226', date: addDays(TODAY, -11), logementId: 'LOG-0921', auteur: 'A. Benali', fonction: 'CGL', contexte: 'Visite de contrôle', proprete: 4, bati: 'Moyen', signalements: ['Linge séchant sur les portes'], nbPhotos: 1, suite: 'aucune' }),
  constat({ id: 'CE-2026-0223', date: addDays(TODAY, -15), logementId: 'LOG-0452', auteur: 'S. Martin', fonction: 'Travailleuse sociale', contexte: 'Visite à domicile', proprete: 5, bati: 'Bon', signalements: [], suite: 'aucune' }),
  constat({ id: 'CE-2026-0150', date: addDays(TODAY, -120), logementId: 'LOG-0318', auteur: 'M. Roche', fonction: 'CGL', contexte: 'Entrée dans les lieux', proprete: 6, bati: 'Bon', signalements: [], suite: 'aucune' }),
]

/* ───────── Consultations ───────── */
const consultationBase = {
  mode: 'devis', lignes: [0], visite: false, creneaux: [], delai: '3 semaines', criteres: { prix: 50, delai: 20, qualite: 30 },
  estimation: '', message: '', motifUnique: '', questions: [], heureLimite: '17:00',
} satisfies Partial<Consultation>

export const mockConsultations: Consultation[] = [
  {
    ...consultationBase, id: 'CS-2026-0011', demandeId: 'DI-2026-0288', statut: 'envoyee', envoyeeLe: addDays(TODAY, -4),
    descriptif: 'Remise en peinture complète du T3 (murs et plafonds), 62 m².', entreprises: ['e1', 'e2', 'e3'], dateLimite: addDays(TODAY, 5),
    estimation: '2 800 €', visite: true, creneaux: [addDays(TODAY, 2) + ' 10:00'], decision: null,
    reponses: {
      e1: { statut: 'recu', date: addDays(TODAY, -2), montantHT: 2650, tva: 10, delai: 15, duree: 6, validite: 60, qualite: 4 },
      e2: { statut: 'decline', date: addDays(TODAY, -3), motif: 'Planning complet' },
      e3: { statut: 'attente' },
    },
    questions: [{ q: 'Les meubles sont-ils à déplacer ?', a: 'Non, le logement est vide.', at: addDays(TODAY, -3) + 'T11:00' }],
    historique: [{ at: addDays(TODAY, -4) + 'T10:00', t: 'Consultation envoyée à 3 entreprises' }],
  },
  {
    ...consultationBase, id: 'CS-2026-0009', demandeId: 'DI-2026-0281', statut: 'commande', mode: 'accord', envoyeeLe: addDays(TODAY, -12),
    descriptif: 'Traitement punaises de lit, 2 passages.', entreprises: ['e5'], dateLimite: addDays(TODAY, -6),
    reponses: { e5: { statut: 'recu', date: addDays(TODAY, -9), montantHT: 480, tva: 20, delai: 3, duree: 1, validite: 30, qualite: 5 } },
    historique: [{ at: addDays(TODAY, -12) + 'T09:00', t: 'Consultation envoyée' }, { at: addDays(TODAY, -5) + 'T14:00', t: 'Commande passée à Nuisibles Services IDF' }],
    decision: { entrepriseId: 'e5', motif: 'Accord-cadre, seule offre conforme', imputation: 'Equalis', statut: 'validee', bc: 'BC-2026-0004', at: addDays(TODAY, -5) },
  },
]

/* ───────── État complet ───────── */
export const mockState: AppState = {
  v: 1,
  ref: mockRef,
  logements: mockLogements,
  ouvriers: mockOuvriers,
  entreprises: mockEntreprises,
  demandes: mockDemandes,
  rdvs: mockRdvs,
  constats: mockConstats,
  consultations: mockConsultations,
  factures: [],
  histoMois: { '2026-05': 14, '2026-06': 18, '2026-07': 11, '2026-08': 9, '2026-09': 16, '2026-10': 21 },
  seq: { di: 301, ce: 232, cs: 11, ft: 120, bc: 4, fa: 0 },
  draft: null,
  profil: 'coord',
}

/* ───────── Profils ───────── */
export type MockRole = 'directeur' | 'coordination' | 'etablissement' | 'ouvrier'

const ROLE_OF: Record<MockRole, Role> = { directeur: 'directeur', coordination: 'coordinateur', etablissement: 'directeur_etab', ouvrier: 'ouvrier' }

const meInput = (role: MockRole) => ({
  role: ROLE_OF[role],
  etab: role === 'etablissement' ? 'Service Hébergement 77' : '',
  email: role === 'ouvrier' ? 'karim.b@equalis.test' : `${role}@equalis.test`,
  displayName: ROLES[ROLE_OF[role]].label,
  play: null,
})

/** État complet avec profil et compte connecté, comme le fait `withMe` dans l'application. */
export const withProfile = (role: MockRole): AppState => withMe(mockState, meInput(role))

/** Utilisateur connecté correspondant au rôle demandé. */
export const mockMe = (role: MockRole): Moi => {
  const { moi } = withProfile(role)
  if (!moi) throw new Error(`Profil factice introuvable : ${role}`)
  return moi
}
