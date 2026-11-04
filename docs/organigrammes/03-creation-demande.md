# 3. Création d'une demande d'intervention

Sources : `components/NewRequest/NewRequest.tsx`, `components/NewRequest/helpers.ts`.

Les demandes émanent des établissements (sauf cas exceptionnels). Le canal ci-dessous indique comment elles sont saisies : « Autre » correspond à une saisie directement par l'établissement.

```mermaid
flowchart TD
    A([Ouverture du formulaire]) --> B{Brouillon existant, même logement<br/>et même compte ?}
    B -- Non --> C[Nouveau brouillon<br/>préchargé : auteur, accès, clés]
    B -- Oui --> D
    C --> D[Saisie : logement, urgence,<br/>lignes de problème, photos]
    D --> D1{Lot = Sinistre / assurance ?}
    D1 -- Oui --> D2[Sinistre = Oui<br/>nature à préciser]
    D1 -- Non --> E
    D2 --> E[Liste de contrôle]
    E --> F{Logement et urgence choisis ?<br/>Chaque ligne : pièce, lot, nature, description ?<br/>Photo par ligne ?<br/>Sinistre décrit si Oui ?}
    F -- "Un point manque" --> G[Envoi bloqué<br/>compléter ou enregistrer le brouillon]
    G --> D
    F -- "Tout est valide" --> H[Réservation du numéro DI]
    H --> I{Canal de saisie}
    I -- Mail --> I1[Origine = mail]
    I -- Téléphone --> I2[Origine = tel]
    I -- "Autre" --> I3[Origine = établissement]
    I1 --> J
    I2 --> J
    I3 --> J
    J{Facturation à l'usager ?}
    J -- Oui --> J1[Imputation : Usager refacturation<br/>validation hiérarchique requise]
    J -- Non --> J2[Imputation : Equalis]
    J1 --> K
    J2 --> K
    K{Lot de la ligne = Sinistre / assurance ?}
    K -- Oui --> K1[Circuit pré-rempli : sinistre]
    K -- Non --> K2[Circuit vide<br/>choisi à la qualification]
    K1 --> L
    K2 --> L
    L[Statut = À qualifier<br/>historique, accusé de réception,<br/>photos classées par logement] --> M{Demande issue d'un constat ?}
    M -- Oui --> M1[Constat lié à la demande<br/>suite = demande]
    M -- Non --> N
    M1 --> N([Redirection vers la fiche de la demande])
```
