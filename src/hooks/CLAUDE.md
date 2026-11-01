# `hooks/` : hooks partagés

- `useApp()` : façade des écrans sur le store : `S` (état avec le profil du compte), `mutate(fn, { now })`, `getS()` (dernier état, même après un `mutate` dans le même gestionnaire), `toast`, `openModal`, `closeModal`, `reset`.
- `useAuth()` : compte connecté, rôle, établissement, rôle « joué » (directeur), `login`/`logout`.
- `useRoute()` / `go()` : routage par hash.
- `useUiState(key, initial)` : état d'interface persistant (filtres, onglets, brouillons) lié à une clé.
- `useModal()` : modale ouverte. `useAppStore.ts` : hooks Redux typés (`useAppSelector`, `useAppDispatch`, `useAppStore`). `useTheme()` : thème clair/sombre.

Un hook propre à un seul composant va dans le dossier de ce composant. Les vues (`*View.tsx`) n'importent jamais ces hooks : seuls les conteneurs le font.
