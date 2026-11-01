import type { Referentiels } from '../types'

export const REF_DEFAULT: Referentiels = {
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
    'Déménagement / transfert': ['Déménagement entre deux logements', "Installation à l'entrée dans les lieux", 'Retrait du mobilier à la sortie', "Transfert de mobilier ou d'électroménager", 'Montage / démontage de meubles', 'Mise en stockage / garde-meubles'],
    'Sinistre / assurance': ['Dégât des eaux · origine dans le logement', 'Dégât des eaux · origine voisin ou copropriété', 'Dégât des eaux · origine inconnue', 'Incendie / fumées', 'Effraction / vandalisme', 'Bris de glace', 'Événement climatique'],
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
  motifsRejet: ["Doublon d'une demande en cours", 'Demande injustifiée', 'Hors périmètre Equalis', 'Besoin déjà traité', 'Non réactualisée (plus de 2 mois)'],
  contextes: ['Visite à domicile', 'Entrée dans les lieux', 'Sortie des lieux', 'Intervention technique', 'Visite de contrôle', 'Autre'],
  proprete: ['Insalubre, danger pour la santé', 'Très sale', 'Sale', 'Passable', 'Correct', 'Propre', 'Impeccable'],
  signalements: {
    'Sécurité': ["Chauffage d'appoint à risque", 'Installation électrique dangereuse', 'Détecteur de fumée absent ou HS'],
    'Aération et humidité': ['Humidité / moisissures', 'VMC bouchée volontairement', 'Aérations fenêtres bouchées', 'Linge séchant sur les portes'],
    'Équipements': ['Réfrigérateur HS', 'Micro-ondes HS', 'Plaque de cuisson HS', 'Autre équipement HS'],
    'Usage du logement': ["Présence d'animaux (interdite)", 'Encombrement', 'Odeurs', 'Nuisibles', 'Dégradations'],
  },
  natSinistre: ['Dégât des eaux · origine dans le logement', 'Dégât des eaux · origine voisin ou copropriété', 'Dégât des eaux · origine inconnue (recherche de fuite)', 'Incendie / fumées', 'Effraction / vandalisme', 'Bris de glace', 'Événement climatique'],
  assureurs: ["Assurance habitation de l'occupant", "Assurance d'Equalis (locataire ou gestionnaire)", 'Assurance du propriétaire bailleur', "Assurance de l'immeuble (via le syndic)", 'Assurance du tiers responsable'],
  motifsAcces: ['Occupant absent', 'Clés absentes', "Refus d'accès", 'Adresse ou code erroné'],
  suitesSupp: [
    { k: 'realise', l: 'Réalisé pendant ce passage', d: 'Sous le seuil de temps' },
    { k: 'programmer', l: 'À programmer', d: 'La coordination planifie un nouveau passage' },
    { k: 'validation', l: 'Demander la validation', d: 'Au-delà du seuil, ou charge bailleur / usager' },
  ],
}

// Coordonnées des villes (latitude, longitude) servant de repli quand un logement n'est pas géolocalisé
export const VILLES: Record<string, [number, number]> = {
  'Paris': [48.8566, 2.3522], 'Chelles': [48.8806, 2.5903], 'Lagny-sur-Marne': [48.8736, 2.7075], 'Torcy': [48.8498, 2.6552], 'Meaux': [48.9606, 2.878],
  'Ris-Orangis': [48.6522, 2.4098], 'Évry-Courcouronnes': [48.6324, 2.44], 'Corbeil-Essonnes': [48.6103, 2.4818], 'Savigny-le-Temple': [48.5936, 2.5845],
  'Melun': [48.54, 2.66], 'Vaux-le-Pénil': [48.5212, 2.68], 'Fontainebleau': [48.4047, 2.7016],
}
export const DEPTS: Record<string, string> = { '77': '77-Seine-et-Marne', '91': '91-Essonne' }
