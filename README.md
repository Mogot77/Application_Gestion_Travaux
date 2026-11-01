# Application Gestion Travaux

Application web responsive (PC et téléphone) de gestion de travaux : demandes, planning et tournées, logements, ouvriers, consultation d'entreprises et suivi des devis, constats, carte.

🔗 **Démo en ligne : https://mogot77.github.io/Application_Gestion_Travaux/**

## Technologies

| Domaine | Technologie |
|---|---|
| Framework UI | **React 19** |
| Langage | **TypeScript 6** (mode strict) |
| Build / dev server | **Vite 8** + `@vitejs/plugin-react` |
| Styles | **Tailwind CSS 4** (`@tailwindcss/vite`) + classes réutilisables dans `index.css` |
| Cartographie | **Leaflet** (fonds de carte en ligne) |
| Authentification | **Firebase Auth** (connexion Google) |
| Base de données | **Cloud Firestore** (temps réel, projet `travaux-2975b`) |
| Qualité | **ESLint 10** (flat config, `typescript-eslint`, `react-hooks`, `react-refresh`) |
| Déploiement | **GitHub Pages** via **GitHub Actions** (`.github/workflows/deploy.yml`) |
| Stockage local | `localStorage` (cache, photos, profil) |

## Architecture logicielle

### Schéma 1 — Architecture du front (React)

```mermaid
flowchart TB
    Browser(["🌐 Navigateur<br/>PC / téléphone"]):::ext

    subgraph Front["Application React 19 + TypeScript + Vite"]
        direction TB
        Main["main.tsx"]:::entry
        Router["App.tsx<br/>routage par hash<br/>hooks/useRoute"]:::entry

        subgraph UI["Présentation — components/"]
            direction LR
            Layout["layout/<br/>Layout"]:::ui
            Pages["pages/<br/>Tableau · Demandes · Planning · Tournées<br/>Logements · Ouvriers · Entreprises · Devis<br/>Constats · Carte · Utilisateurs · Login"]:::ui
            Widgets["ui/<br/>Modal · Fields · MapView · Photo · Toasts"]:::ui
        end

        subgraph Store["État — store/ + hooks/"]
            direction LR
            AuthP["AuthProvider<br/>useAuth"]:::state
            AppP["AppProvider<br/>useApp"]:::state
            UIs["ui.ts<br/>état d'UI partagé"]:::state
        end

        subgraph Lib["Logique métier pure — lib/"]
            direction LR
            Dom["domain · planning · dates<br/>entreprises · carto · docs · csv · photos"]:::logic
            Cs["cloudState<br/>état ⇄ documents"]:::logic
            Sy["sync<br/>temps réel + écritures différentielles"]:::logic
            Us["users"]:::logic
            Fbl["firebase<br/>init du SDK"]:::logic
        end

        Data["data/ refs · seed<br/>types.ts"]:::data
        LS[("localStorage<br/>equalis-travaux-v2<br/>cache · photos · profil")]:::data
    end

    Browser --> Main --> Router --> Layout --> Pages
    Pages --> Widgets
    Pages --> AuthP
    Pages --> AppP
    Pages --> UIs
    AppP --> Dom
    AppP --> Cs
    AppP --> Sy
    AppP --> Data
    AppP <--> LS
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
        Google["Google Sign-In<br/>(OAuth)"]:::ext
        OSM["OpenStreetMap<br/>tuiles de carte (Leaflet)"]:::ext
        Fonts["Google Fonts<br/>police Inter"]:::ext
    end

    LS[("localStorage<br/>photos · cache · profil")]:::local

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
2. **Chargement** : `AppProvider` affiche d'abord le cache `localStorage`, puis `lib/sync` s'abonne en temps réel (`onSnapshot`) aux collections Firestore.
3. **Modification** : l'état est mis à jour localement ; `lib/cloudState` le découpe en documents et seuls les documents modifiés sont écrits (par lots).
4. **Photos** : jamais envoyées à Firestore, elles restent dans le `localStorage` de l'appareil.

### Collections Firestore

`users` (liste blanche et rôles), `ref`, `meta` (documents uniques `main`), `logements`, `ouvriers`, `entreprises`, `demandes`, `rdvs`, `constats`, `consultations` (un document par élément).

## Structure du projet

```
src/
├── App.tsx            routes (hash)
├── types.ts           interfaces du modèle de données
├── data/              référentiels (refs.ts) et jeu de démo (seed.ts)
├── lib/               logique métier pure (domain, dates, csv, photos, carto, docs,
│                      planning, entreprises, firebase, sync, cloudState, users)
├── store/             AppProvider, AuthProvider, contextes, état d'UI
├── hooks/             useApp, useAuth, useRoute
├── components/
│   ├── ui/            modale, champs, carte, photos, toasts...
│   ├── layout/        gabarit général
│   └── pages/         écrans
└── index.css          thème Tailwind et classes réutilisables
firestore.rules        règles de sécurité Firestore
```

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
- `TODAY = '2026-10-29'` est une date de référence de démo, indépendante de la date réelle.
- Avant de pousser : `npm run lint` et `npm run build` doivent passer.
- Le bundle dépasse 500 kB (avertissement Vite non bloquant).
- Les polices et fonds de carte nécessitent internet.
