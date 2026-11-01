# Application Gestion Travaux

Application de gestion de travaux (demandes, planning, logements, ouvriers, consultation d'entreprises, mobile terrain). Front-only : pas de backend, données persistées dans le `localStorage`.

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
- `lib/` : logique métier pure (domain, dates, csv, photos, carto, docs, planning, mobile)
- `store/` : état global et persistance (`AppProvider.tsx`, `context.ts`), état d'UI partagé (`ui.ts`)
- `hooks/` : `useApp`, `useRoute`
- `components/` : `ui/` (modale, champs, carte, etc.), `layout/`, `pages/` (écrans bureau), `mobile/`
- `index.css` : thème Tailwind et classes réutilisables (`card`, `btn`, `chip`, ...)

## Conventions et points d'attention
- Clé de stockage `equalis-travaux-v2`, format `{v:1, ...}` : ne pas la changer sans migration.
- `TODAY = '2026-10-29'` est une date de référence de démo, indépendante de la date réelle.
- Garder la logique métier dans `lib/`, les composants restent de la présentation.
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Le bundle dépasse 500 kB (avertissement Vite non bloquant) ; un découpage par chunks est possible.
- Polices Inter et fonds de carte nécessitent internet.
