# Application Gestion Travaux

Application de gestion de travaux (demandes, planning, logements, ouvriers, consultation d'entreprises), responsive (PC et téléphone). Authentification Google (Firebase Auth, liste blanche d'e-mails dans Firestore) ; données partagées dans Firestore (photos hébergées sur Cloudinary, URL stockée dans Firestore).

## Stack
- Vite 8, React 19, TypeScript strict, Tailwind CSS 4 (`@tailwindcss/vite`), ESLint (flat config), Leaflet pour les cartes.

## Commandes
- `npm run dev` : serveur de dev (http://localhost:5173)
- `npm run build` : `tsc -b` puis build Vite
- `npm run lint` : ESLint
- `npm run preview` : prévisualise le build
- Sous PowerShell, si `npm` est bloqué : utiliser `npm.cmd` ou `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Structure (`src/`)
- `App.tsx` : routes (routage par hash via `hooks/useRoute.ts`)
- `types.ts` : toutes les interfaces du modèle de données
- `data/` : référentiels (`refs.ts`) et jeu de démo (`seed.ts`)
- `lib/` : logique métier pure (domain, dates, csv, photos, carto, docs, planning, firebase, sync, cloudState, users)
- `store/` : état global et persistance (`AppProvider.tsx`, `context.ts`), état d'UI partagé (`ui.ts`)
- `hooks/` : `useApp`, `useRoute`
- `components/` : `ui/` (modale, champs, carte, etc.), `layout/`, `pages/` (écrans)
- `index.css` : thème Tailwind et classes réutilisables (`card`, `btn`, `chip`, ...)

## Conventions et points d'attention
- Clé de stockage local `equalis-travaux-v2` (cache + profil + photos pas encore envoyées), format `{v:1, ...}` : ne pas la changer sans migration. Source de vérité : Firestore (projet `travaux-2975b`, règles dans `firestore.rules`, admin d'origine codé en dur dans les règles et dans `lib/users.ts`).
- Photos : `lib/photos.ts` redimensionne puis envoie sur Cloudinary (preset unsigned `travaux`, cloud `dullbsehq`) ; seule l'URL est stockée dans Firestore. Variables `VITE_CLOUDINARY_CLOUD` / `VITE_CLOUDINARY_PRESET` : `.env.local` en dev (voir `.env.example`), *Variables* GitHub Actions en prod. Sans elles, ou hors ligne, la photo reste une data-URL locale, jamais envoyée à Firestore (`cloudState.ts`), puis envoyée par `AppProvider` au chargement et au retour du réseau. Pas de suppression côté Cloudinary (preset unsigned) : les photos orphelines se nettoient à la main.
- `TODAY = '2026-10-29'` est une date de référence de démo, indépendante de la date réelle.
- Garder la logique métier dans `lib/`, les composants restent de la présentation.
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Le bundle dépasse 500 kB (avertissement Vite non bloquant) ; un découpage par chunks est possible.
- Polices Inter et fonds de carte nécessitent internet.
