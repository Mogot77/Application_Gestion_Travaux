# Application Gestion Travaux

Application web responsive (PC et téléphone) de gestion de travaux : demandes, planning et tournées, logements, ouvriers, consultation d'entreprises et suivi des devis, constats, carte.

🔗 **Démo en ligne : https://mogot77.github.io/Application_Gestion_Travaux/**

## Technologies

| Domaine | Technologie |
|---|---|
| Framework UI | **React 19** |
| État global | **Redux Toolkit** + `react-redux` (Immer, listener middleware) |
| Langage | **TypeScript 6** (mode strict) |
| Build / dev server | **Vite 8** + `@vitejs/plugin-react` |
| Styles | **Tailwind CSS 4** (`@tailwindcss/vite`) + classes réutilisables dans `index.css` |
| Cartographie | **Leaflet** (fonds OpenStreetMap et satellite, couche cadastre IGN gratuite) |
| Authentification | **Firebase Auth** (connexion Google) |
| Base de données | **Cloud Firestore** (temps réel, projet `travaux-2975b`) |
| Photos | **Cloudinary** (envoi direct, preset *unsigned* ; l'URL est stockée dans Firestore) |
| Qualité | **ESLint 10** (flat config, `typescript-eslint`, `react-hooks`, `react-refresh`) |
| Déploiement | **GitHub Pages** via **GitHub Actions** (`.github/workflows/deploy.yml`) |
| Stockage local | `localStorage` (cache des données, photos pas encore envoyées, état d'UI) |

## Architecture logicielle

### Schéma 1 — Architecture du front

```mermaid
flowchart TB
    App["App.tsx<br/>routes par hash"]:::entry
    Screens["components/<br/>écrans et composants métier"]:::ui
    UI["components/ui/<br/>petits composants purs"]:::ui
    Hooks["hooks/<br/>useApp · useAuth · useRoute"]:::state
    Store["store/<br/>Redux Toolkit"]:::state
    Helpers["helpers/<br/>fonctions partagées"]:::logic
    LS[("localStorage<br/>cache")]:::data
    Remote[("Firestore<br/>Cloudinary")]:::ext

    App --> Screens
    Screens --> UI
    Screens --> Hooks
    Hooks --> Store
    Store --> Helpers
    Store <--> LS
    Helpers <--> Remote

    classDef entry fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef ui fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef state fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef logic fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef data fill:#fce7f3,stroke:#db2777,color:#831843
    classDef ext fill:#ffedd5,stroke:#ea580c,color:#7c2d12
```

### Schéma 2 — Écosystème

```mermaid
flowchart LR
    Dev(["Développeur"]):::dev
    User(["Utilisateur"]):::user
    GH["GitHub<br/>Actions + Pages"]:::gh
    SPA{{"Application React"}}:::app
    FB[("Firebase<br/>Auth + Firestore")]:::fb
    Cl["Cloudinary<br/>photos"]:::ext
    Map["OpenStreetMap · IGN<br/>cartes et cadastre"]:::ext

    Dev -- "git push" --> GH
    GH -- "déploie" --> SPA
    User --> SPA
    SPA <--> FB
    SPA --> Cl
    SPA --> Map

    classDef dev fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef user fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef gh fill:#e5e7eb,stroke:#374151,color:#111827
    classDef app fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:3px
    classDef fb fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef ext fill:#dcfce7,stroke:#16a34a,color:#14532d
```

### Flux de données

1. **Connexion** : Google via Firebase Auth ; l'e-mail doit figurer dans la collection `users` (liste blanche, vérifiée par `firestore.rules`).
2. **Chargement** : `AppProvider` crée le store Redux avec le cache `localStorage` comme état de départ, puis `store/listeners` démarre `store/queries/appSync`, qui s'abonne en temps réel (`onSnapshot`) aux collections Firestore.
3. **Modification** : un écran appelle `useApp().mutate(fn)` → action Redux `mutated` (Immer applique `fn`). Les listeners du store sauvegardent le cache et `helpers/cloudState` découpe l'état en documents ; seuls les documents modifiés sont écrits (par lots).
4. **Photos** : `helpers/photos` redimensionne l'image et l'envoie à Cloudinary ; seule l'URL est stockée dans Firestore, donc partagée entre appareils. Hors ligne (ou sans configuration), la photo reste une data-URL locale, jamais envoyée à Firestore, puis envoyée au chargement suivant ou au retour du réseau.

### Collections Firestore

`users` (liste blanche et rôles), `ref`, `meta` (documents uniques `main`), `logements`, `ouvriers`, `entreprises`, `demandes`, `rdvs`, `constats`, `consultations` (un document par élément).

## Structure du projet

```
src/
├── App.tsx            routes (hash)
├── types.ts           types du modèle de données
├── helpers/           fonctions partagées par plusieurs composants (domain, dates, csv, photos,
│                      carto, docs, planning, cloudState, roles, emptyState ...)
├── store/             Redux Toolkit : index (store), reducers/ (app, ui), selectors/, thunks/,
│                      listeners/ (sauvegarde, Firestore, photos, cycle de vie), queries/ (Firestore,
│                      cache local, utilisateurs), local/ (état d'UI, modale), providers/
├── hooks/             hooks partagés : useApp (façade sur le store), useAuth, useRoute,
│                      useUiState, useModal, useAppStore (hooks Redux typés)
├── components/        un dossier par composant : index.ts, <Nom>.tsx, types.ts,
│   │                  helpers.ts, constants.ts (alias d'import @/ = src/) ; les fonctions
│   │                  propres à un composant vivent dans son helpers.ts
│   ├── <Écran>/       Requests, Planning, Housing, Qualification, MapPage, Login ...
│   ├── Layout/ Modal/ Photo/ MapView/ InspectionsTable/ ...   composants métier
│   └── ui/            petits composants purs : Button, Card, Chip, Field, Empty,
│                      Note, Kv, Seg, Opts, Icon, Toasts, Ext, AddPhoto, SearchBox,
│                      FilterSelect, Kpi, Tabs, PageHead, Crumb, StepHeader
└── index.css          thème Tailwind et classes réutilisables
firestore.rules        règles de sécurité Firestore
.claude/skills/        skills Claude Code du projet
```

## Sécurité

### La configuration Firebase n'est pas un secret

Les variables `VITE_FIREBASE_*` (clé d'API, identifiant de projet, domaine d'authentification, etc.) **ne sont pas ce qui protège les données**. Elles sont publiques par conception :

- Elles servent seulement à dire au navigateur *quel* projet Firebase contacter. Sans elles, l'application ne saurait pas où se connecter.
- Elles finissent obligatoirement dans le JavaScript envoyé à chaque visiteur : toute application web Firebase les expose, c'est le fonctionnement normal du SDK. Les mettre en variables d'environnement GitHub évite de les écrire dans le dépôt, mais ne les cache pas dans le site construit.
- Connaître la clé d'API ne donne **aucun accès** aux données : elle n'identifie pas un utilisateur et n'autorise rien.

### Ce qui protège réellement les données

1. **Les règles Firestore** (`firestore.rules`, publiées dans la console Firebase) : toute lecture ou écriture exige un compte Google connecté, avec une adresse e-mail vérifiée, présente dans la liste blanche `users`. Un visiteur qui connaît la configuration est refusé par le serveur.
2. **La liste blanche** : seule la direction (rôle `admin` ou `directeur`) peut ajouter ou retirer des comptes autorisés.
3. **Les domaines autorisés** de la connexion Google (console Firebase, Authentication) : seuls ces sites peuvent lancer la connexion.
4. **Aucun vrai secret côté navigateur** : les photos partent sur Cloudinary avec un *preset unsigned* (le nom du compte et du preset sont publics, l'API secret Cloudinary n'est jamais utilisée dans l'application).

### À savoir

- Les règles distinguent « membre » et « administrateur » ; les rôles plus fins (établissement, ouvrier, coordination) restreignent l'affichage dans l'application, pas l'accès aux données côté serveur. Tout compte de la liste blanche peut en principe lire les données de l'application.
- Ne jamais committer de **secret** : clé privée de compte de service, API secret Cloudinary, mot de passe. Ceux-là ne vont ni dans le dépôt ni dans une variable `VITE_*` (qui serait exposée au navigateur).
- Option complémentaire : restreindre la clé d'API aux domaines du site dans la console Google Cloud (API et services, Identifiants) limite son usage par des tiers.

## Skills Claude Code

Skills utilisés pour travailler sur ce projet avec Claude Code. Un skill est un jeu d'instructions que Claude charge quand la demande correspond (ou via `/nom`).

| Skill | Emplacement | Ce qu'il fait |
|---|---|---|
| `react-structure` | `.claude/skills/` (dans le repo) | Structure ou refactore les composants React : un dossier par composant (`index.ts`, `<Nom>.tsx`, `helpers.ts`, `constants.ts`, `types.ts`), petites primitives partagées dans `components/ui/`, fonctions fléchées, `type` plutôt que `interface`, alias `@/`, état au sommet. |
| `commit-push` | personnel (`~/.claude/skills/`) | Commit puis push du travail en cours : message en anglais, Conventional Commits, sans trailer de co-auteur ni de session. |
| `storybook-story` | personnel | Écrit une story Storybook (CSF3 + React + TypeScript) qui montre un vrai code d'usage plutôt que du JSX reconstruit depuis les args. |

## Démarrage

```bash
npm install
npm run dev       # http://localhost:5173
```

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | `tsc -b` puis build Vite |
| `npm run lint` | ESLint |
| `npm run preview` | prévisualise le build |

> Sous PowerShell, si `npm` est bloqué : utiliser `npm.cmd` ou `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Points d'attention

- Clé de stockage local `equalis-travaux-v2` (format `{v:1, ...}`) : ne pas la changer sans migration.
- Configuration : variables `VITE_FIREBASE_*` et `VITE_CLOUDINARY_*` (voir `.env.example`) dans `.env.local` en local, et dans les variables GitHub Actions pour le site en ligne.
- `TODAY = '2026-10-29'` est une date de référence de démo, indépendante de la date réelle.
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Le bundle dépasse 500 kB (avertissement Vite non bloquant).
- Les polices et fonds de carte nécessitent internet.
