# 4. Qualification et choix du circuit

Sources : `components/Qualification/Qualification.tsx`, `components/Qualification/helpers.ts`.

## 4.1 Entrée en qualification

```mermaid
flowchart TD
    A([Ouverture d'une demande]) --> B{Profil établissement ?}
    B -- Oui --> C{Statut}
    C -- "À compléter" --> C1[Bouton J'ai complété<br/>→ À qualifier]
    C -- "À réactualiser" --> C2[Bouton besoin toujours d'actualité<br/>→ À qualifier, date de réception mise à jour]
    C -- Autre --> C3[Lecture seule<br/>fiche imprimable si une fiche existe]
    B -- "Non, coordination" --> D{Statut = À qualifier ?}
    D -- Oui --> D1[Prise en charge automatique<br/>→ En qualification]
    D -- Non --> E
    D1 --> E{Statut}
    E -- "À qualifier, En qualification,<br/>À valider occupant" --> F[Actions de qualification]
    F --> F1[Consulter des entreprises]
    F --> F2[Renvoyer à l'établissement<br/>motif obligatoire → À compléter]
    F --> F3[Rejeter<br/>motif obligatoire → Rejetée]
    F --> F4[Valider → voir 4.2]
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B,C,D,E dec
    class A term
```

Demande de plus de deux mois sans intervention : statut **À réactualiser**. Sans réactualisation avant J+80, rejet automatique (motif « Non réactualisée »). La coordination peut relancer le demandeur, marquer la demande réactualisée ou la rejeter.

## 4.2 Validation : le circuit décide du statut suivant

```mermaid
flowchart TD
    V([Clic sur Valider]) --> A{Chaque ligne a un circuit ?}
    A -- Non --> E[/Erreur : choisir un circuit pour chaque ligne/]
    A -- Oui --> B[Urgence de ligne vide = urgence de la demande]
    B --> C{Au moins une ligne en circuit ST ?}
    C -- Oui --> C1[Numéro de fiche travaux attribué<br/>Statut À planifier<br/>durée = somme des lignes ST]
    C1 --> C2{Autres circuits sur d'autres lignes ?}
    C2 -- Oui --> C3[Mention dans l'historique]
    C2 -- Non --> C4
    C3 --> C4([Aller au planning])
    C -- Non --> D{Une ligne en circuit prestataire ?}
    D -- Oui --> D1[Statut Prestataire<br/>→ lancer la consultation]
    D -- Non --> F{Une ligne en circuit sinistre ?}
    F -- Oui --> F1[Statut Sinistre<br/>déclaration à faire]
    F -- Non --> G[Statut Demandée au bailleur]
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class A,C,C2,D,F dec
    class V,C4 term
    class E err
```

Choisir le circuit **bailleur** sur une ligne force l'imputation « Bailleur propriétaire ». Priorité des circuits : ST, puis prestataire, puis sinistre, puis bailleur.

## 4.3 Suites hors service technique

```mermaid
flowchart TD
    subgraph Bailleur
      B1[Demandée au bailleur] --> B2{Action}
      B2 -- Relancer --> B1
      B2 -- "Travaux faits par le bailleur" --> BC[Clôturée]
    end
    subgraph Prestataire
      P1[Prestataire] --> P2{Action}
      P2 -- "Intervention réalisée" --> P3[Réalisée, à réceptionner]
      P3 --> PC[Réceptionner → Clôturée]
    end
    subgraph Sinistre
      S1[Sinistre] --> S2{Action}
      S2 -- "Déclaration envoyée à l'assureur" --> S1
      S2 -- "Indemnisation actée" --> S3[Lignes → circuit ST<br/>numéro de fiche<br/>statut À planifier]
    end
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B2,P2,S2 dec
```
