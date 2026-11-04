# Organigrammes des processus de décision

Schémas des règles de décision de l'application, déduits du code (`src/helpers`, `src/components`). Ils documentent le fonctionnement : ils ne sont pas utilisés par le site.

Le fichier 8 décrit l'organisation réelle (schéma cible) ; les fichiers 1 à 7 décrivent ce que fait le site aujourd'hui.

Les schémas sont écrits en [Mermaid](https://mermaid.js.org/) : ils s'affichent directement sur GitHub et dans l'aperçu Markdown de VS Code.

| # | Fichier | Processus |
|---|---------|-----------|
| 1 | [01-acces-connexion.md](01-acces-connexion.md) | Connexion, liste blanche, rôles et droits |
| 2 | [02-constat-etat.md](02-constat-etat.md) | Constat d'état : scénarios, suites et échelons à informer |
| 3 | [03-creation-demande.md](03-creation-demande.md) | Création d'une demande d'intervention |
| 4 | [04-qualification.md](04-qualification.md) | Qualification par la coordination et choix du circuit |
| 5 | [05-planification-mission.md](05-planification-mission.md) | Planification, déroulement et fin de mission |
| 6 | [06-consultation-devis.md](06-consultation-devis.md) | Consultation d'entreprises, notation des devis, décision |
| 7 | [07-cycle-vie-demande.md](07-cycle-vie-demande.md) | Vue d'ensemble : statuts d'une demande |
| 8 | [08-hierarchie-validation.md](08-hierarchie-validation.md) | Hiérarchie des fonctions et niveaux de validation des devis |
| 9 | [09-refacturation.md](09-refacturation.md) | Refacturation à l'usager : création et vie d'une facture |

Les mêmes schémas sont exportés en images dans [png/](png/) (un fichier par schéma, nommé `<fichier>_<numéro du schéma>.png`).

Quand une règle change dans le code, mettre à jour le schéma correspondant.
