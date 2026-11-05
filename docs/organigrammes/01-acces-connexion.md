# 1. Connexion, liste blanche et droits

Sources : `store/providers/AuthProvider.tsx`, `store/queries/users.ts`, `helpers/roles.ts`.

```mermaid
flowchart TD
    A([Clic sur Connexion Google]) --> B{Fenêtre Google aboutie ?}
    B -- "Fermée, bloquée ou réseau" --> B1[Message d'erreur<br/>aucun message si fermée]
    B -- Oui --> C{E-mail présent et vérifié ?}
    C -- Non --> X[Accès refusé]
    C -- Oui --> D{E-mail = admin d'origine ?}
    D -- Oui --> R1[Rôle Directeur]
    D -- Non --> E{Document dans la liste blanche Firestore ?}
    E -- Non --> X
    E -- "Erreur de lecture" --> ERR[Écran d'erreur]
    E -- Oui --> F[Lecture du rôle et de l'établissement]
    F --> G{Rôle stocké}
    G -- "admin" --> R1
    G -- "Rôle connu" --> R2[Rôle lu]
    G -- "Inconnu ou ancien user" --> R3[Rôle Coordinateur]
    R1 --> H{Directeur en mode jouer un rôle ?}
    H -- Oui --> R4[Rôle et établissement simulés]
    H -- Non --> OK
    R2 --> OK
    R3 --> OK
    R4 --> OK
    OK([Accès accordé]) --> S{Route autorisée pour le rôle ?}
    S -- Oui --> P[Écran affiché]
    S -- Non --> Q[Redirection]
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B,C,D,E,G,H,S dec
    class A,OK term
```

## Droits par rôle

```mermaid
flowchart LR
    subgraph Direction
      D[Directeur<br/>tout, utilisateurs, référentiels]
    end
    subgraph Finance
      DAF[Directeur administratif et financier<br/>refacturation, tableau de bord]
      CPT[Comptable<br/>refacturation]
      CG[Contrôleur de gestion<br/>refacturation, tableau de bord]
    end
    subgraph Service technique
      C[Coordinateur<br/>demandes, planning, ouvriers, logements,<br/>carte, constats, refacturation, classement]
      O[Ouvrier<br/>son planning uniquement]
    end
    subgraph Établissement
      T[Travailleur social<br/>ses demandes]
      CS[Chef de service<br/>ses demandes]
      DE[Directeur d'établissement<br/>demandes de son établissement]
    end
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
```

Les droits précis des rôles Finance (qui crée, émet ou valide une facture) restent à déterminer : aujourd'hui les trois ont le même accès à la refacturation.
