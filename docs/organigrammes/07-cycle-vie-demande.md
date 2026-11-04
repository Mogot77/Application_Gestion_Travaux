# 7. Cycle de vie d'une demande (vue d'ensemble)

Sources : `helpers/domain.ts` (statuts), `Qualification`, `Planning`, `mission.ts`, `Quotes`.

```mermaid
stateDiagram-v2
    [*] --> a_qualifier : Création (envoi du formulaire)
    a_qualifier --> en_qualification : Prise en charge par la coordination
    a_qualifier --> a_completer : Renvoi à l'établissement
    en_qualification --> a_completer : Renvoi à l'établissement
    a_completer --> a_qualifier : Demande complétée
    a_qualifier --> rejetee : Rejet
    en_qualification --> rejetee : Rejet
    a_completer --> rejetee : Rejet
    a_reactualiser --> a_qualifier : Besoin confirmé
    a_reactualiser --> rejetee : Rejet ou échéance J+80

    en_qualification --> a_planifier : Valider (circuit ST)
    en_qualification --> prestataire : Valider (circuit prestataire)
    en_qualification --> sinistre : Valider (circuit sinistre)
    en_qualification --> bailleur : Valider (circuit bailleur)

    a_planifier --> planifiee : Rendez-vous créé
    planifiee --> a_planifier : Rendez-vous annulé ou déplacé
    planifiee --> en_cours : Mission démarrée
    en_cours --> realisee : Toutes les lignes réalisées
    en_cours --> acces_impossible : Report nécessaire
    acces_impossible --> planifiee : Replanifiée
    realisee --> cloturee : Réception

    prestataire --> consultation : Consultation envoyée
    consultation --> prestataire : Décision validée, bon de commande
    prestataire --> realisee : Intervention du prestataire réalisée
    sinistre --> a_planifier : Indemnisation actée (travaux ST)
    bailleur --> cloturee : Travaux faits par le bailleur

    rejetee --> [*]
    cloturee --> [*]
```

Statuts terminaux (`CLOSED`) : clôturée, rejetée, annulée. Statuts de qualification (`QUALIF`) : à qualifier, en qualification, à valider (occupant).
