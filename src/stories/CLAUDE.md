# `stories/` et Storybook

Catalogue des composants : `npm run storybook` (http://localhost:6006). Configuration dans `.storybook/` (`main.ts`, `preview.tsx` avec bascule de thème dans la barre d'outils). Publié avec le site dans `/storybook` par le workflow de déploiement (`base: './'` pour fonctionner sous un sous-dossier).

## Données factices
`mockState.ts` (réexporté par `index.ts`) : `mockState`, `mockRef`, `mockLogements`, `mockDemandes`, `mockRdvs`, `mockConstats`, `mockConsultations`, `mockOuvriers`, `mockEntreprises`, `withProfile(role)`. **Uniquement pour les stories** : ne jamais les importer depuis le code de l'application (les données réelles viennent de Firestore).

## Écrire une story
- Fichier `X.stories.tsx` à côté du composant, titre `Ecrans/X`, `Composants/X` ou `UI/X`.
- Sur la **vue** (`XView`), avec le modèle construit par le vrai `buildXModel` appliqué aux données factices ; callbacks avec `fn()` de `storybook/test`.
- 2 à 4 stories : cas par défaut, vide, et variante par rôle quand ça compte (`withProfile('ouvrier')`...).
- Pas de hook d'état dans `render` (règles des hooks) : créer un petit composant `Demo` dans le fichier.
- Une story n'importe ni le store, ni firebase, ni `@/hooks/*`.
- Les cartes chargent Leaflet et ont besoin d'internet pour les fonds de carte.
