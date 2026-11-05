# 6. Consultation d'entreprises, devis et décision

Sources : `components/Consultation/`, `components/Quotes/`, `components/Portal/`.

## 6.1 Lancement de la consultation

```mermaid
flowchart TD
    A([Consulter des entreprises]) --> B[Brouillon créé :<br/>entreprises du même lot, proches du logement, 4 au maximum,<br/>échéance J+14, critères prix 60 / délai 25 / qualité 15]
    B --> C{Mode d'achat}
    C -- "Accord-cadre" --> C1{Titulaire du lot existe ?}
    C1 -- Non --> C2[/Erreur : aucun titulaire/]
    C1 -- Oui --> C3[Entreprise = titulaire]
    C -- "Mise en concurrence" --> C4[Plusieurs entreprises]
    C -- "Entreprise unique" --> C5[Une entreprise<br/>motif obligatoire]
    C4 --> W{Estimation > seuil 3 devis<br/>et moins de 3 entreprises ?}
    W -- Oui --> W1[Avertissement : 3 devis recommandés]
    W -- Non --> V
    W1 --> V
    C3 --> V
    C5 --> V{Envoi : contrôles}
    V --> V1{Au moins un poste ?}
    V1 -- Non --> X[/Erreur/]
    V1 -- Oui --> V2{Au moins une entreprise ?}
    V2 -- Non --> X
    V2 -- Oui --> V3{Unique : motif renseigné ?}
    V3 -- Non --> X
    V3 -- Oui --> V4{Critères = 100 % ?}
    V4 -- Non --> X
    V4 -- Oui --> Z{Mode accord-cadre ?}
    Z -- Oui --> Z1[Bon de commande émis immédiatement<br/>consultation Commande<br/>demande Prestataire]
    Z -- Non --> Z2[Consultation Envoyée<br/>réponses en attente<br/>demande Consultation en cours]
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class C,C1,W,V,V1,V2,V3,V4,Z dec
    class A term
    class C2,X err
```

## 6.2 Réponse de l'entreprise (portail)

```mermaid
flowchart TD
    A([Entreprise ouvre le portail]) --> B{Consultation close ?}
    B -- Oui --> B1[Résultat : retenue ou non retenue]
    B -- Non --> C{Réponse}
    C -- "Déposer un devis" --> D[Statut Reçu<br/>montant, délai, durée, postes]
    C -- "Décliner" --> E[Statut Décliné<br/>motif]
    C -- "Question" --> F[Réponse publiée par la coordination]
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B,C dec
    class A term
```

## 6.3 Notation des devis

```mermaid
flowchart TD
    A([Devis reçus]) --> B[Note par entreprise<br/>prix = prix mini / prix × poids<br/>délai = délai mini / délai × poids<br/>qualité saisie, plafonnée au poids]
    B --> C{Documents à jour ?<br/>Kbis ≤ 92 j, URSSAF ≤ 182 j,<br/>RC et décennale non expirées}
    C -- Non --> D[Non retenable]
    C -- Oui --> E{Tous les postes<br/>chiffrés ?}
    E -- Non --> D
    E -- Oui --> F[Retenable]
    F --> G([Meilleure note retenable<br/>proposée par défaut])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class C,E dec
    class A,G term
```

## 6.4 Décision

Seule la direction valide un choix soumis (`S.profil === 'dir'`). Les seuils (3 devis, direction) se règlent dans les référentiels.

```mermaid
flowchart TD
    H([Choix d'une entreprise]) --> I{Choix valide ?<br/>entreprise choisie,<br/>retenable, motif renseigné}
    I -- Non --> X[/Erreur : compléter le choix/]
    I -- Oui --> L{Montant HT ><br/>seuil direction ?}
    L -- Non --> O
    L -- Oui --> M[Décision À valider]
    M --> N{Avis du directeur}
    N -- Valide --> O[Bon de commande émis<br/>consultation Commande<br/>autres entreprises informées]
    N -- Refuse --> P[Décision Brouillon<br/>choix à revoir]
    P --> H
    O --> Q([Demande Prestataire<br/>intervention prévue à J + délai du devis])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class I,L,N dec
    class H,Q term
    class X err
```

## 6.5 Option cible : mission et montant proposés par l'équipe

Option **non implémentée** dans le site (schéma cible). Au lancement de la consultation, l'équipe peut choisir de fixer elle-même le montant de la mission, au lieu de laisser les entreprises chiffrer.

```mermaid
flowchart TD
    A([Lancement de la consultation]) --> B{Qui fixe le montant ?}
    B -- "Les entreprises (cas actuel)" --> C[Les entreprises chiffrent<br/>voir 6.1 à 6.3]
    B -- "L'équipe (option)" --> D[Mission décrite et montant déterminé par l'équipe]
    D --> E[Mission proposée aux entreprises<br/>au montant fixé]
    E --> F{Réponse de l'entreprise}
    F -- Accepte --> G[Entreprise retenue<br/>voir règles de choix ci-dessous]
    F -- Décline --> H[Entreprise suivante<br/>ou montant à revoir]
    G --> I{Montant supérieur à 3 000 € ?}
    I -- Oui --> J[Validation hiérarchique<br/>voir organigramme 8]
    I -- Non --> K[Validation par le directeur d'établissement]
    J --> L[Bon de commande émis]
    K --> L
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B,F,I dec
    class A term
```

Points à préciser : si plusieurs entreprises acceptent, comment est choisie celle qui réalise la mission (première réponse, critères délai et qualité) ? Le montant fixé par l'équipe est-il visible de toutes les entreprises ?
