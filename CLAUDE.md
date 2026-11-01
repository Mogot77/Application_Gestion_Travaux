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
- `helpers/` : fonctions partagées par plusieurs composants (domain, dates, csv, photos, carto, docs, planning, cloudState, roles, emptyState...). Une fonction utilisée par un seul composant va dans le `helpers.ts` de ce composant.
- `store/` : Redux Toolkit : `index` (store), `reducers/` (app, ui), `selectors/`, `thunks/`, `listeners/` (sauvegarde, Firestore, photos, cycle de vie), `queries/` (Firestore, cache local, utilisateurs), `local/` (état d'UI, modale), `providers/` (AppProvider, AuthProvider)
- `hooks/` : hooks partagés : `useApp` (façade sur le store : `S`, `mutate`, `toast`, `openModal`...), `useAuth`, `useRoute`, `useUiState`, `useModal`, `useAppStore`. Un hook propre à un composant irait dans son dossier.
- `components/` : un dossier-module par composant (`index.ts`, `<Nom>.tsx`, `types.ts`, `helpers.ts`, `constants.ts`, voir `.claude/skills/react-structure`), noms de composants en anglais, commentaires de code en français ; écrans et composants métier à la racine, petits composants purs dans `ui/`. Import via l'alias `@/` (= `src/`) et le default du dossier.
- `index.css` : thème Tailwind et classes réutilisables (`card`, `btn`, `chip`, ...)

## Conventions et points d'attention
- Clé de stockage local `equalis-travaux-v2` (cache + profil + photos pas encore envoyées), format `{v:1, ...}` : ne pas la changer sans migration. Plus aucun jeu de démo ni référentiel dans le code : tout vient de Firestore (référentiels dans `ref/main`, éditables depuis l'écran Référentiels). Source de vérité : Firestore (projet `travaux-2975b`, règles dans `firestore.rules`, admin d'origine codé en dur dans les règles et dans `store/queries/users.ts`).
- Photos : `helpers/photos.ts` redimensionne puis envoie sur Cloudinary (preset unsigned `travaux`, cloud `dullbsehq`) ; seule l'URL est stockée dans Firestore. Variables `VITE_CLOUDINARY_*` et `VITE_FIREBASE_*` (config web Firebase, plus dans le code) : `.env.local` en dev (voir `.env.example`), *Variables* GitHub Actions en prod. Sans elles, ou hors ligne, la photo reste une data-URL locale, jamais envoyée à Firestore (`cloudState.ts`), puis envoyée par `AppProvider` au chargement et au retour du réseau. Pas de suppression côté Cloudinary (preset unsigned) : les photos orphelines se nettoient à la main.
- `TODAY` (`helpers/dates.ts`) est la date du jour ; la variable facultative `VITE_TODAY` (AAAA-MM-JJ) force une date pour une démo ou des tests.
- Synchro Firestore (`store/queries/appSync.ts`) : chaque document écrit porte `updatedAt` (serveur) et une clé d'ordre `_i` stable (`helpers/cloudState.ts` `fillOrder`) ; une suppression écrit une pierre tombale `deleted: true` au lieu de supprimer. Lecture incrémentale depuis un curseur local, lecture complète si le cache manque ou a plus de 24 h. Ne pas réintroduire d'index positionnel (un `unshift` réécrirait toute la collection).
- `mutate(fn)` : `fn` mute directement l'état (Immer, auto-freeze désactivé) et ne doit pas dépendre de sa valeur de retour.
- Garder la logique métier dans les `helpers` (du composant ou partagés), les composants restent de la présentation.
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Le bundle dépasse 500 kB (avertissement Vite non bloquant) ; un découpage par chunks est possible.
- Polices Inter et fonds de carte nécessitent internet.
