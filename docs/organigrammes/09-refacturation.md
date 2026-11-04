# 9. Refacturation à l'usager

Sources : `components/Billing/`, `components/Invoice/`, `helpers/billing.ts`.

## 9.1 Création de la facture

```mermaid
flowchart TD
    A(["Demande avec au moins une ligne<br/>imputée « Usager (refacturation) »"]) --> B{Facture active existe déjà<br/>pour cette demande ?}
    B -- Oui --> B1[Demande non proposée<br/>seule une facture annulée libère la demande]
    B -- Non --> C[Écran Refacturation : Nouvelle facture<br/>choix de la demande]
    C --> D[Réservation du numéro FA]
    D --> E{Devis retenu pour la demande ?}
    E -- Oui --> E1[Une ligne : montant HT du devis<br/>et TVA du devis]
    E -- Non --> E2[Une ligne par travail refacturé<br/>prix à saisir, TVA 10 %]
    E1 --> F[Consommables pris ajoutés en lignes à chiffrer]
    E2 --> F
    F --> G[Destinataire : ménage et adresse du logement<br/>émetteur : celui de la dernière facture<br/>échéance J + 30]
    G --> H([Facture Brouillon])
```

## 9.2 Vie de la facture

```mermaid
flowchart TD
    A([Brouillon]) --> B[Édition : émetteur, destinataire, dates,<br/>lignes, taux de TVA par ligne, mentions]
    B --> C[Totaux : HT, TVA par taux, TTC]
    C --> D{Émettre}
    D --> E{Mentions obligatoires complètes ?<br/>émetteur : nom, adresse, SIRET<br/>destinataire : nom, adresse<br/>dates, au moins une ligne, montant supérieur à 0}
    E -- Non --> E1[/Erreur : liste des points à compléter/]
    E1 --> B
    E -- Oui --> F([Émise<br/>facture figée])
    F --> G{Suite}
    G -- Paiement reçu --> H([Payée])
    G -- Annuler --> I([Annulée])
    A -- Annuler --> I
    F --> J[Imprimer ou enregistrer en PDF]
```

Une facture annulée garde son numéro. Une facture payée ne peut plus être annulée.
