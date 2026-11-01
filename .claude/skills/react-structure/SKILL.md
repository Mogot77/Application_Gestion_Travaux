---
name: react-structure
description: Structurer ou refactorer un projet React/TypeScript en une arborescence propre et scalable — un dossier par composant avec barrels index, plus ui/ types/ constants/ helpers/ partages. A utiliser quand l'utilisateur demande de "structurer", "organiser", "nettoyer", "refactorer l'architecture" ("structure", "organize", "clean up", "refactor"), d'echafauder une nouvelle app React, ou de decouper un gros fichier composant.
---

# Structure de projet React

Imposer (ou migrer vers) cette arborescence. Adapter les noms au projet, garder
les principes.

## Arborescence cible

Tout ce qui rend est un composant et vit sous `components/`. Chacun est un
**dossier-module auto-contenu** avec un jeu de fichiers fixe :

```
src/
  components/
    <Name>/
      index.ts        # le barrel fournit le default : export { <Name> as default } from './<Name>'
      <Name>.tsx      # le composant : fonction flechee, export NOMME (pas de default ici), markup + logique
      helpers.ts      # logique pure locale (fonctions flechees, type de retour explicite)
      constants.ts    # constantes locales (labels, config)
      types.ts        # types locaux — le type des props au minimum
    ui/               # sous-categorie : primitives de presentation partagees (>1 consommateur)
      <Primitive>/    #   meme forme de module : index.ts + <Primitive>.tsx + types.ts
        index.ts
        <Primitive>.tsx   # export default, fonction flechee, pilote par props/className, zero logique
        types.ts          # type des props
  types/              # types partages cross-composant (ex. modele de domaine)
  constants/          # constantes partagees cross-composant (cles, config)
  helpers/            # helpers partages cross-composant (storage, ids…)
  styles/             # styles globaux / entree tailwind
  <entry>.tsx         # point d'entree app/content
```

Importer un composant via le default de son dossier : `import Widget from '../Widget'`.
Les composants "feature" vivent a la racine de `components/` ; les primitives
**partagees** (utilisees par >1 composant) vont dans la sous-categorie
`components/ui/` — meme forme de dossier-module. Les `ui.tsx`/`helpers.ts`/
`constants.ts`/`types.ts` propres a un composant restent dans son dossier. Le code
partage non-rendu (types/constants/helpers) reste dans `src/<couche>/`.

## Regles

1. **Composant = dossier auto-contenu.** Chaque `components/X/` contient le jeu
   complet : `index.ts`, `X.tsx`, `helpers.ts`, `constants.ts`, `types.ts`.
   `X.tsx` utilise un **export nomme** (`export const X = …`) — **pas d'`export
   default` dans un fichier composant**. C'est l'**`index.ts` qui fournit le
   default** : `export { X as default } from './X'`. Importer via
   `import X from '../X'` (le dossier), jamais le fichier brut. `types.ts` contient
   le type des props au minimum. Si un fichier serait vraiment vide, le creer
   quand meme — mais remonter dans `src/<couche>/` partagee tout ce qui sert a un
   **deuxieme** composant.

2. **Fonctions flechees partout.** Composants, handlers, helpers = consts
   flechees (`const X = (props: XProps) => { ... }`), pas de declarations
   `function`. Preferer un retour implicite `=>( … )` pour les composants sans
   logique locale.

3. **`type`, pas `interface`.** Props et formes partagees utilisent des alias
   `type` (`type XProps = { … }`). Pas d'`interface` sauf si le declaration-merging
   est reellement necessaire.

4. **Feature vs primitive — les deux sous `components/`.** Les composants feature
   (structure + logique + cablage d'etat) sont a la racine de `components/`. Les
   primitives de presentation reutilisables (pures, zero storage/reseau, pilotees
   par props/`className` seulement, partagees par >1 feature) vont dans la
   sous-categorie `components/ui/`. Tout ce qui rend est un composant ; pas de
   `ui/` au niveau racine.

5. **L'etat vit au sommet.** Un composant proprietaire detient l'etat ; les
   enfants recoivent donnees + callbacks (`onAdd`, `onChange`…) via props. Les
   composants feuilles/`ui/` ne lisent jamais l'etat global ou le storage
   directement. Remonter l'etat, descendre les handlers.

6. **Types.** Formes partagees dans `types/`. Les types de props restent a cote de
   leur composant (inline ou `types.ts`), toujours en alias `type`.

7. **Constantes, pas de valeurs magiques.** Cles de storage, URLs, limites, enums
   vivent dans `constants/index.ts`. Aucun litteral chaine/nombre duplique entre
   fichiers.

8. **Helpers purs + types.** Wrappers a effet de bord (storage, fetch) et
   transformations pures vont dans `helpers/`, chacun avec un type de retour
   explicite. Les garder agnostiques du framework autant que possible.

9. **Alias de chemin `@/` → `src/`.** Le declarer une fois dans `tsconfig.json`
   (`"paths": { "@/*": ["./src/*"] }` — pas de `baseUrl`, deprecie en TS 7.0 ; les
   paths resolvent relativement au tsconfig) et dans le bundler (Vite
   `resolve.alias { '@': <src> }`) ; garder les deux en phase. Utiliser `@/...`
   pour tout import **cross-dossier**, garder `./...` pour les fichiers **locaux**
   d'un composant. Ne PAS nommer un alias `@types` — TS le reserve aux paquets de
   declarations (TS6137) ; `@/types` convient. Si la config du bundler importe
   `node:*`, ajouter `@types/node` et `"node"` dans `types` du tsconfig.

10. **Barrels pour des imports propres.** Chaque dossier de composant exporte son
    default via `index.ts`. Eviter les chaines relatives profondes la ou un barrel
    se lit mieux.

11. **Style : choisir un systeme, l'appliquer partout.** Classes Tailwind dans le
    JSX, ou CSS modules par composant — pas les deux. Aucune fuite globale. Markup
    + classes vivent directement dans `<Name>.tsx` ; extraire une primitive
    partagee `components/ui/` seulement quand un element style est reutilise par
    >1 composant.

## Comment appliquer

- **Nouveau projet :** echafauder les dossiers ci-dessus, ajouter un dossier de
  composant exemple pour etablir le pattern, cabler le point d'entree.
- **Refactor existant :** reperer le god-component, extraire les enfants dans leurs
  propres dossiers, remonter types/constants/helpers partages, ajouter les barrels,
  corriger les imports, puis typecheck/build pour confirmer que rien n'est casse.
- Toujours lancer le typecheck/build du projet apres restructuration et rapporter
  le resultat. Ne jamais laisser des imports migres a moitie.

## Checklist avant de finir

- [ ] Chaque composant dans son propre dossier avec un barrel `index.ts`
- [ ] Les primitives `ui/` ne contiennent aucune logique metier ni acces storage
- [ ] Etat detenu au sommet, passe via props/callbacks
- [ ] Aucun litteral duplique — valeurs partagees dans `constants/`
- [ ] Types partages dans `types/`, types de props a cote de leur composant
- [ ] Le typecheck / build passe
