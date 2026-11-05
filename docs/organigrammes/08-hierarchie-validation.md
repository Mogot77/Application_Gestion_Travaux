# 8. Hiérarchie des fonctions et niveaux de validation

Source : description donnée par le responsable de l'application (fonctionnement réel). Ce schéma est un **schéma cible** : il décrit l'organisation, pas ce que le site fait aujourd'hui (voir la comparaison en fin de fichier).

Principe : les demandes de travaux émanent des **établissements**, sauf cas exceptionnels.

## 8.1 Organigramme des fonctions

```mermaid
flowchart TD
    subgraph TOP[Échelon top management]
      DI[Directeur de l'immobilier]
      DGA[Directeur général adjoint]
    end

    DI --> ST
    subgraph ST[Service technique]
      AGP[Assistante gestion du patrimoine<br/>prévalide et pré-oriente les missions<br/>et demandes de devis]
      CS[Coordinateur superviseur]
      CT1[Coordinateur technique<br/>Sud Seine-et-Marne]
      CT2[Coordinateur technique<br/>Nord Seine-et-Marne]
      CT3[Coordinateur technique<br/>Yvelines]
      O1[Ouvriers terrain]
      O2[Ouvriers terrain]
      O3[Ouvriers terrain]
      CS --> CT1
      CS --> CT2
      CS --> CT3
      CT1 --> O1
      CT2 --> O2
      CT3 --> O3
    end

    subgraph ETAB[Établissements]
      DE[Directeurs d'établissement<br/>valident les devis inférieurs à 3 000 €]
      CDS[Chefs de service]
      TS[Travailleurs sociaux]
      RL[Référents logement<br/>parfois présents]
      DE --> CDS
      CDS --> TS
      DE --> RL
    end
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
```

Rattachement des directeurs d'établissement au niveau supérieur : non précisé (à compléter).

## 8.2 Validation d'une demande de devis

```mermaid
flowchart TD
    A([Demande nécessitant un devis<br/>émise par un établissement<br/>sauf cas exceptionnel]) --> B[Assistante gestion du patrimoine<br/>prévalide et pré-oriente]
    B --> C{Pré-validation acceptée ?}
    C -- Non --> C1[Renvoi ou rejet de la demande]
    C -- Oui --> D[Coordinateur technique<br/>ou consultation d'entreprises<br/>montant chiffré par les entreprises<br/>ou fixé par l'équipe : voir 6.5]
    D --> E[Réception et comparaison des devis<br/>voir organigramme 6]
    E --> F{Montant du devis retenu}
    F -- "Inférieur à 3 000 €" --> G[Validation par le directeur d'établissement]
    F -- "Supérieur à 3 000 €" --> H[Validation par le directeur de l'immobilier<br/>et par le directeur général adjoint]
    G --> I{Décision}
    H --> I
    I -- Validé --> J[Bon de commande émis<br/>demande passée au prestataire]
    I -- Refusé --> K[Choix à revoir]
    K --> E
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class C,F,I dec
    class A term
```

## 8.3 Qui encadre qui, qui valide quoi

| Fonction | Encadre | Valide |
|---|---|---|
| Directeur de l'immobilier | Le service technique | Devis supérieurs à 3 000 € (avec l'autre directeur) |
| Directeur général adjoint | (non précisé) | Devis supérieurs à 3 000 € (avec l'autre directeur) |
| Directeur d'établissement | Chefs de service, référents logement | Devis inférieurs à 3 000 € |
| Chef de service | Les travailleurs sociaux | (non précisé) |
| Assistante gestion du patrimoine | (aucun) | Prévalidation et pré-orientation des missions et demandes de devis |
| Coordinateur superviseur | Les 3 coordinateurs techniques | (non précisé) |
| Coordinateur technique (3 secteurs) | Les ouvriers de son secteur | (non précisé) |

## Points à préciser

- Le montant est-il **HT ou TTC** ?
- Un devis d'**exactement 3 000 €** relève de quel niveau ?
- Le directeur d'établissement valide-t-il uniquement les devis de **son** établissement ?
- Un **ouvrier** peut-il être rattaché à un seul coordinateur ? Les **secteurs** (Sud 77, Nord 77, Yvelines) déterminent-ils la répartition des missions ?
- Qui valide les autres décisions : refacturation à l'usager, rejet d'une demande, travaux supplémentaires, fin de prise en charge ?

## Écarts avec le site actuel

- Le site n'a **qu'un seuil de validation** (« direction », réglé dans les référentiels) et **seul le rôle Directeur** peut valider un choix au-dessus. Il n'y a pas de validation par le directeur d'établissement en dessous.
- Les rôles **Directeur général adjoint**, **Assistante gestion du patrimoine**, **Coordinateur superviseur** et **Référent logement** n'existent pas.
- Les **trois coordinateurs par secteur** ne sont pas distingués : un seul rôle « Coordinateur ».
- La **prévalidation** par l'assistante n'existe pas : la coordination qualifie directement la demande.
- L'option « montant fixé par l'équipe » (6.5) n'existe pas : les entreprises chiffrent toujours.
