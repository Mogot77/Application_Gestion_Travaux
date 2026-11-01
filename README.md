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
| Cartographie | **Leaflet** (fonds de carte en ligne) |
| Authentification | **Firebase Auth** (connexion Google) |
| Base de données | **Cloud Firestore** (temps réel, projet `travaux-2975b`) |
| Photos | **Cloudinary** (envoi direct, preset *unsigned* ; l'URL est stockée dans Firestore) |
| Qualité | **ESLint 10** (flat config, `typescript-eslint`, `react-hooks`, `react-refresh`) |
| Déploiement | **GitHub Pages** via **GitHub Actions** (`.github/workflows/deploy.yml`) |
| Stockage local | `localStorage` (cache des données, photos pas encore envoyées, état d'UI) |

## Architecture logicielle

### Schéma 1 — Architecture du front (React)

```mermaid
flowchart TB
    Browser(["🌐 Navigateur<br/>PC / téléphone"]):::ext

    subgraph Front["Application React 19 + TypeScript + Vite"]
        direction TB
        Main["main.tsx"]:::entry
        Router["App.tsx<br/>routage par hash<br/>hooks/useRoute"]:::entry

        subgraph UI["Présentation — components/ (un dossier-module par composant)"]
            direction LR
            Layout["Layout<br/>ErrorBoundary"]:::ui
            Pages["Écrans<br/>Dashboard · Requests · Planning · Tours<br/>Housing · Workers · Companies · Quotes<br/>Inspections · MapPage · Users · Login …"]:::ui
            Feat["Composants métier<br/>Photo · Modal · MapView<br/>InspectionsTable · StatusChip · UrgencyChip · HousingTree"]:::ui
            Prims["ui/ — petits composants purs<br/>Button · Card · Chip · Field · Empty · Note<br/>Kv · Seg · Opts · Icon · Toasts · Ext · AddPhoto"]:::ui
        end

        subgraph Store["État — store/ (Redux Toolkit) + hooks/"]
            direction LR
            AuthP["AuthProvider<br/>useAuth"]:::state
            RTK["Store Redux<br/>appSlice · uiSlice<br/>hooks/useApp = façade"]:::state
            Eff["effects<br/>listener middleware :<br/>sauvegarde · sync · photos"]:::state
            UIs["helpers/uiState · helpers/modal<br/>état d'UI local"]:::state
        end

        subgraph Lib["Fonctions partagées — helpers/"]
            direction LR
            Dom["domain · planning · dates<br/>carto · docs · csv · roles"]:::logic
            Ph["photos<br/>redimensionne + envoie"]:::logic
            Cs["cloudState<br/>état ⇄ documents"]:::logic
            Sy["sync<br/>temps réel + écritures différentielles"]:::logic
            Us["users"]:::logic
            Fbl["firebase<br/>init du SDK"]:::logic
        end

        Data["data/ refs · seed<br/>types.ts"]:::data
        LS[("localStorage<br/>equalis-travaux-v2<br/>cache · photos locales")]:::data
    end

    Browser --> Main --> Router --> Layout --> Pages
    Pages --> Feat
    Pages --> Prims
    Feat --> Prims
    Pages --> AuthP
    Pages --> RTK
    Pages --> UIs
    RTK --> Dom
    RTK --> Data
    Eff --> RTK
    Eff --> Sy
    Eff --> Ph
    Eff <--> LS
    AuthP --> Us
    AuthP --> Fbl
    Sy --> Cs
    Sy --> Fbl

    classDef ext fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef entry fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef ui fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef state fill:#ede9fe,stroke:#7c3aed,color:#4c1d95
    classDef logic fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef data fill:#fce7f3,stroke:#db2777,color:#831843
```

### Schéma 2 — Écosystème : services autour de l'application

```mermaid
flowchart LR
    Dev(["👨‍💻 Développeur<br/>VS Code · Node · npm"]):::dev
    User(["👤 Utilisateur<br/>navigateur PC / mobile"]):::user

    subgraph GitHub["GitHub"]
        Repo["Dépôt Git<br/>Mogot77/Application_Gestion_Travaux"]:::gh
        Actions["GitHub Actions<br/>lint · build Vite"]:::gh
        Pages["GitHub Pages<br/>hébergement de la SPA"]:::gh
    end

    SPA{{"Application React<br/>(SPA statique)"}}:::app

    subgraph Firebase["Firebase — projet travaux-2975b"]
        Auth["Authentication<br/>connexion Google"]:::fb
        FS[("Cloud Firestore<br/>données partagées<br/>temps réel")]:::fb
        Rules["firestore.rules<br/>liste blanche + rôles"]:::fb
    end

    subgraph Ext["Services externes"]
        Cloud["Cloudinary<br/>hébergement des photos"]:::ext
        Google["Google Sign-In<br/>(OAuth)"]:::ext
        OSM["OpenStreetMap<br/>tuiles de carte (Leaflet)"]:::ext
        Fonts["Google Fonts<br/>police Inter"]:::ext
    end

    LS[("localStorage<br/>cache · photos pas encore envoyées")]:::local

    Dev -- "git push" --> Repo
    Repo -- "déclenche" --> Actions
    Actions -- "déploie" --> Pages
    Pages -- "sert" --> SPA
    User -- "HTTPS" --> SPA
    SPA -- "signInWithPopup" --> Auth
    Auth <--> Google
    SPA <-- "onSnapshot / writeBatch" --> FS
    FS --- Rules
    Auth -. "jeton + e-mail vérifié" .-> Rules
    SPA -- "upload (preset unsigned)" --> Cloud
    SPA -- "tuiles" --> OSM
    SPA -- "CSS" --> Fonts
    SPA <-- "lecture / écriture" --> LS

    classDef dev fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef user fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e
    classDef gh fill:#e5e7eb,stroke:#374151,color:#111827
    classDef app fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,stroke-width:3px
    classDef fb fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef ext fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef local fill:#fce7f3,stroke:#db2777,color:#831843
```

### Flux de données

1. **Connexion** : Google via Firebase Auth ; l'e-mail doit figurer dans la collection `users` (liste blanche, vérifiée par `firestore.rules`).
2. **Chargement** : `AppProvider` crée le store Redux avec le cache `localStorage` comme état de départ, puis `store/effects` démarre `helpers/sync`, qui s'abonne en temps réel (`onSnapshot`) aux collections Firestore.
3. **Modification** : un écran appelle `useApp().mutate(fn)` → action Redux `mutated` (Immer applique `fn`). Le listener middleware sauvegarde le cache et `helpers/cloudState` découpe l'état en documents ; seuls les documents modifiés sont écrits (par lots).
4. **Photos** : `helpers/photos` redimensionne l'image et l'envoie à Cloudinary ; seule l'URL est stockée dans Firestore, donc partagée entre appareils. Hors ligne (ou sans configuration), la photo reste une data-URL locale, jamais envoyée à Firestore, puis envoyée au chargement suivant ou au retour du réseau.

### Collections Firestore

`users` (liste blanche et rôles), `ref`, `meta` (documents uniques `main`), `logements`, `ouvriers`, `entreprises`, `demandes`, `rdvs`, `constats`, `consultations` (un document par élément).

## Structure du projet

```
src/
├── App.tsx            routes (hash)
├── types.ts           types du modèle de données
├── data/              référentiels (refs.ts) et jeu de démo (seed.ts)
├── helpers/           fonctions partagées par plusieurs composants (domain, dates, csv, photos,
│                      carto, docs, planning, firebase, sync, cloudState, users, roles ...)
├── store/             Redux Toolkit : appSlice (données), uiSlice (toasts, chargement),
│                      effects (sauvegarde, Firestore, photos), AppProvider ;
│                      AuthProvider
├── hooks/             hooks partagés : useApp (façade sur le store), useAuth, useRoute,
│                      useUiState, useModal, useAppStore (hooks Redux typés)
├── components/        un dossier par composant : index.ts, <Nom>.tsx, types.ts,
│   │                  helpers.ts, constants.ts (alias d'import @/ = src/) ; les fonctions
│   │                  propres à un composant vivent dans son helpers.ts
│   ├── <Écran>/       Requests, Planning, Housing, Qualification, MapPage, Login ...
│   ├── Layout/ Modal/ Photo/ MapView/ InspectionsTable/ ...   composants métier
│   └── ui/            petits composants purs : Button, Card, Chip, Field, Empty,
│                      Note, Kv, Seg, Opts, Icon, Toasts, Ext, AddPhoto
└── index.css          thème Tailwind et classes réutilisables
firestore.rules        règles de sécurité Firestore
.claude/skills/        skills Claude Code du projet
```

## Skills Claude Code

Skills utilisés pour travailler sur ce projet avec Claude Code. Un skill est un jeu d'instructions que Claude charge quand la demande correspond (ou via `/nom`).

| Skill | Emplacement | Ce qu'il fait |
|---|---|---|
| `react-structure` | `.claude/skills/` (dans le repo) | Structure ou refactore les composants React : un dossier par composant (`index.ts`, `<Nom>.tsx`, `helpers.ts`, `constants.ts`, `types.ts`), petites primitives partagées dans `components/ui/`, fonctions fléchées, `type` plutôt que `interface`, alias `@/`, état au sommet. |
| `commit-push` | personnel (`~/.claude/skills/`) | Commit puis push du travail en cours : message en anglais, Conventional Commits, sans trailer de co-auteur ni de session. |
| `storybook-story` | personnel | Écrit une story Storybook (CSF3 + React + TypeScript) qui montre un vrai code d'usage plutôt que du JSX reconstruit depuis les args. |
| `project-edit` | personnel | Modifie le code d'un projet du dashboard `all` depuis n'importe quel dossier : retrouve le repo local et GitHub, édite, vérifie avec les scripts du projet, commit/push seulement sur demande. |

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
- Photos : `VITE_CLOUDINARY_CLOUD` et `VITE_CLOUDINARY_PRESET` (voir `.env.example`) en local ; variables GitHub Actions pour le site en ligne.
- `TODAY = '2026-10-29'` est une date de référence de démo, indépendante de la date réelle.
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Le bundle dépasse 500 kB (avertissement Vite non bloquant).
- Les polices et fonds de carte nécessitent internet.
