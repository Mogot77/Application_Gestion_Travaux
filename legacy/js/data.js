/* Référentiels (listes administrables) et jeu de données de démonstration */
(function (A) {
  A.REF_DEFAULT = {
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
  };

  // Coordonnées schématiques des villes (repère SVG 800 × 640 de la carte des tournées)
  A.VILLES = {
    'Paris': [48.8566, 2.3522], 'Chelles': [48.8806, 2.5903], 'Lagny-sur-Marne': [48.8736, 2.7075], 'Torcy': [48.8498, 2.6552], 'Meaux': [48.9606, 2.878],
    'Ris-Orangis': [48.6522, 2.4098], 'Évry-Courcouronnes': [48.6324, 2.44], 'Corbeil-Essonnes': [48.6103, 2.4818], 'Savigny-le-Temple': [48.5936, 2.5845],
    'Melun': [48.54, 2.66], 'Vaux-le-Pénil': [48.5212, 2.68], 'Fontainebleau': [48.4047, 2.7016],
  };
  A.DEPTS = { '77': '77-Seine-et-Marne', '91': '91-Essonne' };

  A.seed = function () {
    const ref = JSON.parse(JSON.stringify(A.REF_DEFAULT));

    const logements = [
      ['LOG-0452', 'T3', 62, '12 rue des Lilas', 'B', '3e étage', '31', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Intermédiation locative', 'F-2291', '77 Sud', 'C-118', 'Bât. B, 3e étage, porte gauche · code 4512A'],
      ['LOG-0447', 'T2', 45, "3 rue de l'Industrie", '', 'RDC', '4', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Hébergement', 'F-2240', '77 Sud', 'C-104', 'Rez-de-chaussée, porte du fond'],
      ['LOG-0461', 'T2', 41, '40 av. Thiers', '', '5e étage', '18', '77000', 'Melun', 'Service Hébergement 77', 'HEB-77-03', 'A. Benali', 'Intermédiation locative', 'F-2310', '77 Sud', 'C-131', 'Ascenseur, code 2208'],
      ['LOG-0318', 'T4', 78, '5 av. Foch', '', '2e étage', '12', '77100', 'Meaux', 'Service Hébergement 77', 'HEB-77-04', 'M. Roche', 'Hébergement', 'F-2105', '77 Nord', 'C-086', '2e étage droite · interphone 12'],
      ['LOG-0322', 'T2', 39, '18 rue Cornillon', '', '1er étage', '3', '77100', 'Meaux', 'Service Hébergement 77', 'HEB-77-04', 'M. Roche', 'Hébergement', 'F-2188', '77 Nord', 'C-090', ''],
      ['LOG-0329', 'T3', 58, '2 pl. Lafayette', '', '4e étage', '7', '77100', 'Meaux', 'Service Logement 77', 'LOG-77-01', 'M. Roche', 'Intermédiation locative', 'F-2007', '77 Nord', 'C-092', ''],
      ['LOG-0430', 'T3', 60, '7 rue des Carouges', '', '2e étage', '9', '77000', 'Vaux-le-Pénil', 'Service Hébergement 77', 'HEB-77-02', 'A. Benali', 'Hébergement', 'F-1990', '77 Sud', 'C-071', ''],
      ['LOG-0907', 'T2', 44, '9 rue de Paris', '', '2e étage', '22', '91100', 'Corbeil-Essonnes', 'Service Logement 91', 'LOG-91-01', 'C. Dupuis', 'Intermédiation locative', 'F-3102', '91 Est', 'C-207', '2e étage sans ascenseur · code 1987B'],
      ['LOG-0915', 'T3', 63, '4 allée des Tilleuls', '', '3e étage', '12', '91100', 'Corbeil-Essonnes', 'Service Logement 91', 'LOG-91-01', 'C. Dupuis', 'Intermédiation locative', 'F-3140', '91 Est', 'C-212', ''],
      ['LOG-0912', 'T3', 66, '21 bd des Coquibus', '', '6e étage', '61', '91000', 'Évry-Courcouronnes', 'Dispositif Solibail 91', 'SOL-91-01', 'C. Dupuis', 'Solibail', 'F-3155', '91 Est', 'C-219', 'Ascenseur, 6e gauche'],
      ['LOG-0921', 'T3', 59, '14 rue Pasteur', '', '1er étage', '2', '91130', 'Ris-Orangis', 'Service Logement 91', 'LOG-91-02', 'C. Dupuis', 'Intermédiation locative', 'F-3170', '91 Est', 'C-225', ''],
      ['BUR-0004', 'BUR', 120, '10 rue du Grand Cerf', '', '1er étage', '', '77100', 'Meaux', 'Bureaux', 'BUR-77', '—', 'Bureaux', '—', '77 Nord', '—', 'Accueil au 1er étage'],
    ].map(r => ({ id: r[0], typo: r[1], surface: r[2], adresse: r[3], bat: r[4], etage: r[5], apt: r[6], cp: r[7], ville: r[8], etab: r[9], section: r[10], cgl: r[11], dispositif: r[12], menage: r[13], secteur: r[14], cles: r[15], acces: r[16], dept: r[7].slice(0, 2), bailleur: '[Bailleur propriétaire]', crypto: '[ID lot Crypto]', actif: true }));

    const ouvriers = [
      { id: 'o1', nom: 'Karim B.', metier: 'Plomberie', color: '#1D4ED8' },
      { id: 'o2', nom: 'Julien M.', metier: 'Multi-services', color: '#0F766E' },
      { id: 'o3', nom: 'Sofiane T.', metier: 'Électricité', color: '#B54708' },
      { id: 'o4', nom: 'David L.', metier: 'Peinture / sols', color: '#6D28D9' },
      { id: 'o5', nom: 'Léa P.', metier: 'Serrurerie / menuiserie', color: '#BE185D' },
    ];

    const entreprises = [
      { id: 'e1', nom: 'Atelier Peinture Briard', ville: 'Meaux', activite: 'peinture, revêtements', lots: ['Peinture / revêtements muraux', 'Sols'], secteur: '77 Nord', chantiers: 7, note: 4.4, docs: { kbis: '2026-08-01', urssaf: '2026-07-15', rc: '2027-03-31', decennale: '2026-12-31' } },
      { id: 'e2', nom: "Rénov'Est Bâtiment", ville: 'Chelles', activite: "tous corps d'état", lots: ['Peinture / revêtements muraux', 'Sols', 'Plâtrerie', 'Carrelage / faïence', 'Menuiseries intérieures'], secteur: '77 Nord', chantiers: 3, note: 4.6, docs: { kbis: '2026-09-15', urssaf: '2026-09-01', rc: '2027-01-31', decennale: '2027-06-30' } },
      { id: 'e3', nom: 'Déco Marne Services', ville: 'Lagny-sur-Marne', activite: 'peinture', lots: ['Peinture / revêtements muraux'], secteur: '77 Nord', chantiers: 1, note: 3.5, docs: { kbis: '2026-02-01', urssaf: '2026-01-20', rc: '2027-01-31', decennale: '2027-01-31' } },
      { id: 'e4', nom: 'Multi Travaux 77', ville: 'Meaux', activite: 'multiservices', lots: ['Peinture / revêtements muraux', 'Sols', 'Plomberie / sanitaire', 'Électricité', 'Serrurerie'], secteur: '77 Nord', chantiers: 12, note: 3.9, docs: { kbis: '2026-09-01', urssaf: '2026-08-20', rc: '2027-02-28', decennale: '2027-02-28' } },
      { id: 'e5', nom: 'Nuisibles Services IDF', ville: 'Évry-Courcouronnes', activite: 'désinsectisation, dératisation', lots: ['Nuisibles'], secteur: '91 Est', chantiers: 9, note: 4.1, accordCadre: true, docs: { kbis: '2026-09-20', urssaf: '2026-09-10', rc: '2027-04-30', decennale: '2027-04-30' } },
      { id: 'e6', nom: 'Essonne Plomberie Chauffage', ville: 'Corbeil-Essonnes', activite: 'plomberie, chauffage', lots: ['Plomberie / sanitaire', 'Chauffage / ventilation'], secteur: '91 Est', chantiers: 5, note: 4.2, accordCadre: true, docs: { kbis: '2026-10-01', urssaf: '2026-08-30', rc: '2027-05-31', decennale: '2027-05-31' } },
      { id: 'e7', nom: 'Menuiseries du Gâtinais', ville: 'Fontainebleau', activite: 'menuiseries, vitrerie', lots: ['Menuiseries extérieures / vitrerie', 'Menuiseries intérieures', 'Serrurerie'], secteur: '77 Sud', chantiers: 4, note: 4.0, docs: { kbis: '2026-08-20', urssaf: '2026-06-15', rc: '2027-01-31', decennale: '2027-01-31' } },
    ];

    // Aucune demande, aucun rendez-vous : l'application démarre vide.
    const demandes = [];
    const rdvs = [];

    const constats = [
      { id: 'CE-2026-0232', date: '2026-10-28', logementId: 'LOG-0447', auteur: 'R. Diallo', fonction: 'Éducateur', contexte: 'Visite à domicile', proprete: 3, bati: 'Dégradé', signalements: ['Humidité / moisissures', 'VMC bouchée volontairement', 'Plaque de cuisson HS'], photos: ['seed', 'seed', 'seed'], commentaire: 'Moisissures au plafond de la salle de bain, VMC à l’arrêt', suite: '' },
      { id: 'CE-2026-0231', date: '2026-10-27', logementId: 'LOG-0912', auteur: 'Karim B.', fonction: 'Ouvrier', contexte: 'Intervention technique', proprete: 5, bati: 'Moyen', signalements: ["Chauffage d'appoint à risque", 'Détecteur de fumée absent ou HS'], photos: ['seed', 'seed'], commentaire: 'Poêle à pétrole dans la chambre', suite: 'alerte' },
      { id: 'CE-2026-0229', date: '2026-10-20', logementId: 'LOG-0322', auteur: 'L. Petit', fonction: 'Travailleuse sociale', contexte: 'Visite à domicile', proprete: 1, bati: 'Moyen', signalements: ['Nuisibles', 'Encombrement', "Présence d'animaux (interdite)"], photos: ['seed', 'seed', 'seed', 'seed'], commentaire: '', suite: '' },
      { id: 'CE-2026-0226', date: '2026-10-18', logementId: 'LOG-0915', auteur: 'A. Benali', fonction: 'CGL', contexte: 'Visite de contrôle', proprete: 4, bati: 'Moyen', signalements: ['Aérations fenêtres bouchées', 'Linge séchant sur les portes'], photos: ['seed', 'seed'], commentaire: '', suite: '' },
      { id: 'CE-2026-0223', date: '2026-10-14', logementId: 'LOG-0452', auteur: 'S. Martin', fonction: 'Travailleuse sociale', contexte: 'Visite à domicile', proprete: 3, bati: 'Bon', signalements: [], photos: ['seed'], commentaire: '', suite: 'aucune' },
      { id: 'CE-2026-0219', date: '2026-10-09', logementId: 'LOG-0430', auteur: 'Léa P.', fonction: 'Ouvrière', contexte: 'Sortie des lieux', proprete: 2, bati: 'Dégradé', signalements: ['Dégradations', 'Réfrigérateur HS', 'Micro-ondes HS'], photos: Array(6).fill('seed'), commentaire: '', suite: 'aucune' },
      { id: 'CE-2026-0150', date: '2026-07-02', logementId: 'LOG-0318', auteur: 'M. Roche', fonction: 'CGL', contexte: 'Visite de contrôle', proprete: 4, bati: 'Moyen', signalements: [], photos: ['seed'], commentaire: '', suite: 'aucune' },
      { id: 'CE-2026-0101', date: '2026-05-12', logementId: 'LOG-0907', auteur: 'N. Kader', fonction: 'Travailleuse sociale', contexte: 'Visite à domicile', proprete: 5, bati: 'Bon', signalements: [], photos: ['seed'], commentaire: '', suite: 'aucune' },
      { id: 'CE-2026-0062', date: '2026-03-02', logementId: 'LOG-0329', auteur: 'M. Roche', fonction: 'CGL', contexte: 'Visite de contrôle', proprete: 4, bati: 'Bon', signalements: [], photos: [], commentaire: '', suite: 'aucune' },
      { id: 'CE-2026-0048', date: '2026-02-18', logementId: 'LOG-0921', auteur: 'N. Kader', fonction: 'Travailleuse sociale', contexte: 'Entrée dans les lieux', proprete: 6, bati: 'Bon', signalements: [], photos: [], commentaire: '', suite: 'aucune' },
    ];

    const consultations = [];
    const histoMois = {};

    return {
      v: 1, ref, logements, ouvriers, entreprises, demandes, rdvs, constats, consultations, histoMois,
      draft: null, profil: 'coord', mobile: { ouvrierId: 'o1', day: A.TODAY },
      seq: { di: 0, ce: 233, cs: 0, ft: 0, bc: 0 },
    };
  };
})(window.App);
