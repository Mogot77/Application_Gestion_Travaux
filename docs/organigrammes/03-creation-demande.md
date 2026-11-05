# 3. Création d'une demande d'intervention

Sources : `components/NewRequest/NewRequest.tsx`, `components/NewRequest/helpers.ts`.

Les demandes émanent des établissements (sauf cas exceptionnels). Le canal indique comment elles sont saisies : « Autre » correspond à une saisie directement par l'établissement.

## 3.1 Saisie et contrôle avant envoi

La photo est obligatoire pour chaque ligne, **sauf si la demande est urgente**. Pour un logement Solibail, l'agent peut indiquer des rendez-vous prévalidés avec le locataire (conseillé, non bloquant).

```mermaid
flowchart TD
    A([Ouverture du formulaire]) --> B{Brouillon existant,<br/>même logement et même compte ?}
    B -- Non --> C[Nouveau brouillon<br/>préchargé : auteur, accès, clés]
    B -- Oui --> D
    C --> D[Saisie : logement, urgence,<br/>lignes de problème, photos]
    D --> S{Logement Solibail ?}
    S -- Oui --> S1[RDV prévalidés avec le locataire<br/>plusieurs créneaux possibles]
    S -- Non --> D1
    S1 --> D1{Lot = Sinistre / assurance ?}
    D1 -- Oui --> D2[Sinistre = Oui<br/>nature à préciser]
    D1 -- Non --> E
    D2 --> E[Liste de contrôle]
    E --> F{Tout est renseigné ?<br/>logement, urgence, lignes complètes,<br/>sinistre décrit si Oui}
    F -- Non --> G[/Envoi bloqué :<br/>compléter ou enregistrer le brouillon/]
    G --> D
    F -- Oui --> P{Photo par ligne ?<br/>facultative si urgence}
    P -- Manquante --> G
    P -- OK --> H([Envoi autorisé])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B,S,D1,F,P dec
    class A,H term
    class G err
```

## 3.2 Envoi : numéro, origine et imputation

```mermaid
flowchart TD
    H([Envoi autorisé]) --> H1[Réservation du numéro DI]
    H1 --> I{Canal de saisie ?}
    I -- Mail --> I1[Origine = mail]
    I -- Téléphone --> I2[Origine = tel]
    I -- Autre --> I3[Origine = établissement]
    I1 --> J{Facturation<br/>à l'usager ?}
    I2 --> J
    I3 --> J
    J -- Oui --> J1[Imputation : usager<br/>validation hiérarchique requise]
    J -- Non --> J2[Imputation : Equalis]
    J1 --> K([Circuit et statut])
    J2 --> K
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class I,J dec
    class H,K term
```

## 3.3 Circuit, statut et redirection

```mermaid
flowchart TD
    K([Circuit et statut]) --> L{Lot de la ligne =<br/>Sinistre / assurance ?}
    L -- Oui --> L1[Circuit pré-rempli : sinistre]
    L -- Non --> L2[Circuit vide<br/>choisi à la qualification]
    L1 --> M[Statut = À qualifier<br/>historique et accusé de réception<br/>photos classées par logement]
    L2 --> M
    M --> N{Demande issue<br/>d'un constat ?}
    N -- Oui --> N1[Constat lié à la demande<br/>suite = demande]
    N -- Non --> Z
    N1 --> Z([Redirection vers la fiche de la demande])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class L,N dec
    class K,Z term
```
