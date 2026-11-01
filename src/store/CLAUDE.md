# `store/` : état, synchro Firestore, cache local

Redux Toolkit. Un store par session connectée, créé par `AppProvider` (`createAppStore` dans `index.ts`), avec le cache local comme état de départ puis les données Firestore.

## Organisation
- `index.ts` : `configureStore` + types (`RootState`, `AppStore`, `AppDispatch`). Auto-freeze d'Immer désactivé (certains écrans trient des copies de l'état).
- `reducers/` : `appReducer` (données métier : `mutated`, `remoteApplied`, `replaced`) et `uiReducer` (toasts, `ready`, `syncFailed`).
- `selectors/` : `selectApp`, `selectReady`... et `withMe` (profil du compte connecté, mémorisé : tous les composants reçoivent le même objet).
- `thunks/` : `toast`, `resetLocal`.
- `listeners/` : effets de bord (`persistence` sauvegarde, `sync` Firestore, `photos` envoi Cloudinary, `lifecycle` fermeture de page, `refsMigration` ponctuel). Démarrés par `startEffects`.
- `queries/` : accès aux données (`appSync` Firestore, `counters`, `firebase`, `localCache`, `syncCursor`, `users`).
- `local/` : petits états hors Redux (état d'UI persistant, modale car son contenu est du JSX non sérialisable).
- `providers/` : `AppProvider`, `AuthProvider` (contexte d'authentification, Redux pour les données).
- `types.ts` : `AppCtx`, `ModalSpec`, `ToastKind`.

## `mutate(fn)` (via `useApp`)
`fn` mute directement l'état (Immer) et ne doit pas dépendre de sa valeur de retour. `{ now: true }` sauvegarde tout de suite, sinon avec 250 ms de délai. Pas d'`await` dans `fn`.

## Synchro Firestore (`queries/appSync.ts`)
- Chaque document écrit porte `updatedAt` (serveur) et une clé d'ordre `_i` **stable** (`helpers/cloudState.ts`, `fillOrder`). Ne jamais réintroduire un index positionnel : un `unshift` réécrirait toute la collection.
- Suppression = pierre tombale `deleted: true` (jamais de `delete`), pour que les lectures incrémentales la voient.
- Lecture **incrémentale** (`updatedAt > curseur`) à partir du cache local ; lecture **complète** au premier lancement, après `resetLocal`, ou si la dernière a plus de 24 h. Le curseur (`equalis-travaux-sync-v1`) et le cache (`equalis-travaux-v2`) vont ensemble.
- Écriture champ par champ (`mergeFields`) et fusion à trois voies à la réception (`mergeRemote`) : deux personnes sur des champs différents d'un même document ne s'écrasent pas ; un même champ reste « dernier écrit gagne ».
- Une écriture refusée est retentée (5 fois, délai croissant) ; une photo restée locale prévient l'utilisateur.
- `meta/counters` n'est pas une donnée de l'application : ignoré par la synchro.

## Numéros lisibles (DI, CE, CS, FT, BC)
Attribués par un compteur atomique (`queries/counters.ts`). Le gestionnaire d'événement appelle `await reserveIds(getS(), [...])` **avant** `mutate`, puis `nextId` consomme la réservation. Hors ligne, `nextId` retombe sur un numéro de secours unique (`DI-2026-T7K2`). Voir `helpers/ids.ts`.

## Photos
`helpers/photos.ts` redimensionne puis envoie sur Cloudinary (preset *unsigned*). Sans configuration ou hors ligne, la photo reste une data-URL locale, jamais envoyée à Firestore (`cloudState.ts` l'écarte), puis `listeners/photos.ts` l'envoie au chargement et au retour du réseau. Pas de suppression côté Cloudinary.

## Référentiels et données
Aucun jeu de démo ni référentiel dans le code : tout vient de Firestore (`ref/main`), éditable depuis l'écran Référentiels. `helpers/emptyState.ts` fournit l'état vide de départ.
