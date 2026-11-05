# 5. Planification, déroulement et fin de mission

Sources : `components/Planning/PlanPanel.tsx`, `AppointmentPanel.tsx`, `helpers.ts`, `helpers/mission.ts`.

## 5.1 Planification

Plage de travail : **8 h – 18 h** ; charge maximale **7 h par jour** et par ouvrier. Plusieurs ouvriers peuvent partager une mission (un responsable + des renforts) : les contrôles s'appliquent à chacun.

```mermaid
flowchart TD
    A([Demande à planifier<br/>ou report nécessaire]) --> B[File triée par urgence<br/>puis date de réception]
    B --> U{Demande<br/>urgente ?}
    U -- Oui --> U1[Rappel des ouvriers<br/>d'astreinte et de leur numéro]
    U -- Non --> C
    U1 --> C[Choisir le responsable,<br/>les renforts éventuels,<br/>la date et l'heure de début]
    C --> D{Tout est<br/>choisi ?}
    D -- Non --> E[/Erreur : compléter le choix/]
    D -- Oui --> F{Fin après 18 h<br/>ou avant 8 h ?}
    F -- Oui --> F1[/Refus : la mission doit tenir<br/>entre 8 h et 18 h/]
    F -- Non --> G{Chevauchement ou<br/>plus de 7 h pour<br/>un membre de l'équipe ?}
    G -- Oui --> G1[Avertissement affiché]
    G -- Non --> H
    G1 --> H[Planifier]
    H --> I[Rendez-vous créé, état Prévue<br/>visible chez tous les ouvriers de l'équipe]
    I --> J([Demande Planifiée<br/>rendez-vous envoyé dans les agendas])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class U,D,F,G dec
    class A,J term
    class E,F1 err
```

## 5.2 Modification d'un rendez-vous prévu

```mermaid
flowchart TD
    R([Rendez-vous sélectionné]) --> A{Action ?}
    A -- Annuler --> B[Rendez-vous supprimé]
    B --> C{Autre rendez-vous<br/>prévu pour la demande ?}
    C -- Non --> D([Demande à planifier])
    C -- Oui --> E([Statut inchangé])
    A -- Déplacer --> F[Rendez-vous supprimé,<br/>créneau précédent proposé]
    F --> D
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class A,C dec
    class R,D,E term
```

## 5.3 Démarrage de la mission

Le temps du rapport vient d'un chronomètre caché (jamais affiché), lancé au démarrage ou à la reprise.

```mermaid
flowchart TD
    A([Rendez-vous Prévu]) --> B[L'ouvrier clique<br/>Démarrer la mission]
    B --> P{Photo de<br/>l'état initial ?}
    P -- Non --> P0[/Refus : au moins une photo<br/>est obligatoire à l'entrée/]
    P0 --> B
    P -- Oui --> C[Chronomètre caché lancé<br/>photos et heure de début enregistrées]
    C --> D([Rendez-vous En cours<br/>demande En cours])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class P dec
    class A,D term
    class P0 err
```

## 5.4 Fin de mission et rapport

```mermaid
flowchart TD
    A([Rendez-vous En cours]) --> B[Formulaire de fin :<br/>statut de chaque ligne, équipe,<br/>déplacements, consommables]
    B --> B2[Travaux supplémentaires<br/>et contrôles de fin à cocher,<br/>observations, signataire]
    B2 --> P{Photo de ce<br/>qui a été fait ?}
    P -- Non --> P0[/Refus : au moins une photo<br/>est obligatoire en sortie/]
    P0 --> B
    P -- Oui --> T[Chronomètre arrêté<br/>temps = décompte arrondi à la minute]
    T --> R[Rapport généré automatiquement :<br/>équipe, temps, lignes, consommables,<br/>supplémentaires, contrôles, photos avant et après]
    R --> E{Accès impossible ou<br/>une ligne non réalisée ?}
    E -- Non --> G([Rendez-vous Réalisé<br/>demande Réalisée])
    E -- Oui --> F[Motif obligatoire]
    F --> F1([Rendez-vous Report nécessaire<br/>demande de retour à planifier])
    G --> I[Coordination :<br/>Réceptionner et clôturer]
    I --> J([Demande Clôturée])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class P,E dec
    class A,G,F1,J term
    class P0 err
```

## 5.5 Reprise d'une mission reportée

```mermaid
flowchart TD
    A([Rendez-vous Report nécessaire]) --> B{Demande déjà reprogrammée<br/>avec un autre rendez-vous ?}
    B -- Oui --> C([Reprise impossible :<br/>la mission suit le nouveau rendez-vous])
    B -- Non --> D[Reprendre la mission<br/>photos facultatives]
    D --> E([Rendez-vous En cours<br/>le chronomètre repart du temps déjà compté])
    %% styles communs
    classDef dec fill:#fff4d6,stroke:#b45309,stroke-width:2px,color:#431407
    classDef term fill:#dbe4ff,stroke:#3730a3,stroke-width:2px,color:#1e1b4b
    classDef err fill:#fde2e2,stroke:#b91c1c,stroke-width:2px,color:#450a0a
    classDef ok fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#052e16
    class B dec
    class A,C,E term
```
