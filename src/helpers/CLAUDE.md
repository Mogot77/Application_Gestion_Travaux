# `helpers/` : fonctions partagées

Fonctions utilisées par **plusieurs** composants (ou par le store). Une fonction propre à un seul composant va dans le `helpers.ts` de ce composant.

- `domain.ts` : règles métier (statuts, urgences, accès aux entités, `nextId`...). Fonctions pures sur `AppState`.
- `dates.ts` : dates et formats français. `TODAY` = date du jour (fuseau local) ; `VITE_TODAY` force une date (démo, tests).
- `ids.ts` : numéros lisibles (réservations, plancher, numéro de secours). Les réservations Firestore sont dans `store/queries/counters.ts`.
- `cloudState.ts` : découpage de l'état en documents Firestore (`toDocs`, `upsertDoc`, `fillOrder`, `mergeRemote`, `diffFields`...). Pur, sans réseau.
- `emptyState.ts` : état et référentiels vides (le vrai contenu vient de Firestore).
- `photos.ts` : redimensionnement et envoi Cloudinary.
- `theme.ts` : choix clair/sombre (le hook est dans `hooks/useTheme.ts`).
- `billing.ts` (refacturation : totaux HT/TVA/TTC, proposition de facture, mentions obligatoires), `roles.ts` (rôles et droits), `planning.ts`, `mission.ts` (démarrage/fin de mission, rapport), `docs.ts` (plan de classement), `carto.ts` (coordonnées, repères Leaflet), `csv.ts`, `logements.ts`.

Règles : fonctions pures autant que possible, type de retour explicite, aucun import de composant, de hook ou du store (sauf types). Les accès réseau (Firestore) sont dans `store/queries/`.
