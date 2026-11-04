# 5. Planification, déroulement et fin de mission

Sources : `components/Planning/PlanPanel.tsx`, `AppointmentPanel.tsx`, `helpers.ts`, `helpers/mission.ts`.

## 5.1 Planification

```mermaid
flowchart TD
    A([Demande À planifier ou Report nécessaire]) --> B[File triée : urgent, sous 48 h, programmable,<br/>puis date de réception]
    B --> C[Choix ouvrier, date, heure de début]
    C --> D{Ouvrier, date et créneau choisis ?}
    D -- Non --> E[/Erreur : choisir ouvrier, date, créneau/]
    D -- Oui --> F{Chevauche un rendez-vous existant ?}
    F -- Oui --> F1[Avertissement : chevauchement]
    F -- Non --> G{Charge du jour + durée > 7 h ?}
    G -- Oui --> G1[Avertissement : dépasse 7 h]
    G -- Non --> H
    F1 --> H[Planifier]
    G1 --> H
    H --> I[Rendez-vous créé, état Prévue<br/>numéro de fiche si absent<br/>lignes ST → planifiées]
    I --> J[Statut Planifiée<br/>rendez-vous envoyé dans l'agenda de l'ouvrier]
```

## 5.2 Modification d'un rendez-vous prévu

```mermaid
flowchart TD
    R([Rendez-vous sélectionné]) --> A{Action}
    A -- Annuler --> B[Rendez-vous supprimé]
    B --> C{Autre rendez-vous prévu<br/>pour la demande ?}
    C -- Non --> D[Statut À planifier]
    C -- Oui --> E[Statut inchangé]
    A -- Déplacer --> F[Rendez-vous supprimé<br/>statut À planifier<br/>créneau précédent proposé]
```

## 5.3 Déroulement de la mission par l'ouvrier

Le temps du rapport vient d'un chronomètre caché (jamais affiché), lancé au démarrage ou à la reprise de la mission.

```mermaid
flowchart TD
    A([Rendez-vous Prévu]) --> B[Démarrer la mission]
    B --> P1{Au moins une photo<br/>de l'état initial ?}
    P1 -- Non --> P0[/Erreur : photo obligatoire/]
    P1 -- Oui --> C[Rendez-vous En cours<br/>chronomètre caché lancé<br/>photos de l'état initial enregistrées<br/>heure de début réelle enregistrée<br/>demande En cours]
    C --> D[Fin de mission : statut de chaque ligne ST,<br/>consommables, signataire]
    D --> P2{Au moins une photo<br/>de ce qui a été fait ?}
    P2 -- Non --> P3[/Erreur : photo obligatoire/]
    P2 -- Oui --> T[Chronomètre arrêté<br/>temps du rapport = décompte, arrondi à la minute supérieure]
    T --> E{Report forcé ou<br/>une ligne non réalisée ?}
    E -- Oui --> F[Rendez-vous Report nécessaire<br/>motif obligatoire]
    F --> F1[Demande Report nécessaire<br/>retour dans la file de planification]
    E -- Non --> G[Rendez-vous Réalisé]
    G --> G1[Demande Réalisée<br/>date d'intervention enregistrée]
    F1 --> H[Rapport généré automatiquement<br/>temps, lignes, consommables, photos avant et après]
    G1 --> H
    G1 --> I[Coordination : Réceptionner et clôturer → Clôturée]
    F1 --> R{Demande déjà reprogrammée<br/>avec un autre rendez-vous ?}
    R -- Non --> R1[Reprendre la mission<br/>photos facultatives<br/>le chronomètre repart du temps déjà compté]
    R1 --> C
    R -- Oui --> R2[Reprise impossible<br/>la mission suit le nouveau rendez-vous]
```
