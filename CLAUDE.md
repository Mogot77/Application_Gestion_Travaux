# Application Gestion Travaux

Application de gestion de travaux (demandes, planning, tournées, logements, ouvriers, consultation d'entreprises et devis, constats, carte), responsive (PC et téléphone). Connexion Google (Firebase Auth, liste blanche d'e-mails dans Firestore). Données partagées dans Firestore, photos sur Cloudinary (seule l'URL va dans Firestore).

> Les consignes détaillées sont dans les `CLAUDE.md` des dossiers : `src/store/`, `src/components/`, `src/helpers/`, `src/hooks/`, `src/stories/`. Lire celui du dossier où l'on travaille.

## Stack
Vite 8, React 19, TypeScript strict, Tailwind CSS 4, Redux Toolkit, Firebase (Auth + Firestore), Leaflet, Storybook 10, ESLint (flat config).

## Commandes
- `npm run dev` : serveur de dev (http://localhost:5173)
- `npm run build` : `tsc -b` puis build Vite
- `npm run lint` : ESLint
- `npm run preview` : prévisualise le build
- `npm run storybook` / `npm run build-storybook` : catalogue des composants (publié dans `/storybook` par le déploiement)
- Sous PowerShell, si `npm` est bloqué : `npm.cmd` ou `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Structure (`src/`)
- `App.tsx` : routes (routage par hash, écrans chargés à la demande)
- `components/` : un dossier par composant (écrans, composants métier, `ui/`) → voir `components/CLAUDE.md`
- `store/` : Redux Toolkit, synchro Firestore, cache local → voir `store/CLAUDE.md`
- `helpers/` : fonctions partagées par plusieurs composants → voir `helpers/CLAUDE.md`
- `hooks/` : hooks partagés (`useApp`, `useAuth`...) → voir `hooks/CLAUDE.md`
- `types/` : types du modèle de données (par domaine ; `AppState = SharedState & LocalState`)
- `stories/` : données factices pour Storybook → voir `stories/CLAUDE.md`
- `index.css` : thème (jetons CSS clair/sombre) et classes réutilisables (`card`, `btn`, `chip`...)

## Règles générales
- Noms de composants, fichiers et identifiants de code en anglais ; **commentaires de code en français**.
- TypeScript strict : pas de `any`, pas de `as unknown as`, `type` plutôt que `interface`, fonctions fléchées. Import via l'alias `@/` (= `src/`).
- Logique métier dans les `helpers` ; les composants restent de la présentation.
- Pas de couleur hexadécimale en dur : utiliser les jetons du thème (`bg-surface`, `text-ink`, `border-line`...).
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Ne jamais committer de secret (clé privée, API secret Cloudinary). La config web Firebase (`VITE_FIREBASE_*`) n'en est pas un, voir « Sécurité » du README.
- Messages de commit en anglais (Conventional Commits).

## Configuration et déploiement
- Variables `VITE_FIREBASE_*`, `VITE_CLOUDINARY_*` (et `VITE_TODAY` facultatif) : `.env.local` en dev (modèle `.env.example`), *Variables* GitHub Actions en prod. Sans elles l'app s'arrête avec un message clair.
- Déploiement : GitHub Pages par `.github/workflows/deploy.yml` (lint, build, Storybook dans `dist/storybook`).
- Firestore : projet `travaux-2975b`, règles dans `firestore.rules` (publiées à la main dans la console). Admin d'origine codé en dur dans les règles et dans `store/queries/users.ts`.

## Points d'attention
- Clé de stockage local `equalis-travaux-v2` (format `{v:1, ...}`) : ne pas la changer sans migration.
- Le bundle principal dépasse 500 kB (avertissement Vite non bloquant) : firebase, redux et react sont chargés au démarrage.
- Polices Inter et fonds de carte nécessitent internet.
- Migration ponctuelle des référentiels (villes, départements) : `store/listeners/refsMigration.ts` et `store/queries/legacyRefs.ts` sont à supprimer une fois la nouvelle version passée en production.
