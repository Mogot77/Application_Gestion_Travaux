# `components/` : écrans, composants métier, `ui/`

## Un dossier par composant
`index.ts`, `<Nom>.tsx`, `types.ts` et, **seulement s'il y a du contenu**, `helpers.ts` (fonctions pures propres au composant) et `constants.ts`. Pas de fichier `export {}` de remplissage. Détail dans `.claude/skills/react-structure`.
- Composant = fonction fléchée, `export default`, props typées dans `types.ts` (`XProps`).
- Import via le dossier : `import X from '@/components/X'`.
- Une fonction utilisée par plusieurs composants monte dans `src/helpers/` ; un composant partagé de pure présentation va dans `ui/`.

## Smart + dumb
- **Conteneur** `X.tsx` : lit le store (`useApp`, `useUiState`, `useAuth`), porte la logique (`mutate`, `toast`, `openModal`, navigation) et rend `<Layout>` quand l'écran en a un.
- **Vue** `XView.tsx` : props seulement. Interdit : imports de `@/hooks/*` et `@/store/*`, composants « smart » à l'intérieur (utiliser `PhotoView`, `Chip`...). Le texte et les données affichés viennent de props.
- Le modèle de la vue est construit par une fonction pure `buildXModel(...)` dans `helpers.ts`, partagée par le conteneur et la story.
- `index.ts` : `export { default } from './X'`, `export { default as XView } from './XView'`, `export type * from './types'`.
- Comportement et rendu du conteneur identiques à ce qu'ils étaient avant la séparation.

## Stories
Chaque écran et chaque composant partagé a `X.stories.tsx` (titres `Ecrans/X`, `Composants/X`, `UI/X`), écrite sur la **vue** avec les données de `@/stories` et `fn()` de `storybook/test`. Une story n'importe ni le store, ni firebase, ni les hooks. Voir `src/stories/CLAUDE.md`.

## `ui/` : petits composants purs
`Button`, `Card`, `Chip`, `Field`, `Empty`, `Note`, `Kv`, `Seg`, `Opts`, `Icon`, `Toasts`, `Ext`, `AddPhoto`, `SearchBox`, `FilterSelect`, `Kpi`, `Tabs`, `PageHead`, `Crumb`, `StepHeader`. Zéro logique métier, zéro accès au store ; pilotés par props. Avant d'écrire du balisage (bouton, carte, champ, en-tête), regarder s'il existe déjà ici.

## Style et thème
Classes Tailwind dans le JSX et classes réutilisables d'`index.css` (`card`, `btn`, `chip`, `tbl-wrap`...). Couleurs par jetons (`bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-brand`...), jamais en hexadécimal : le thème sombre redéfinit ces jetons. Les fiches imprimables (`.a4`) restent claires.

## Accessibilité
La modale (`Modal`) a `role="dialog"`, `aria-modal`, piège du focus et retour du focus. Les boutons sans libellé texte ont un `aria-label`.
