import type { IconDef, IconName } from './types'

export const PATHS: Record<IconName, IconDef> = {
  chev: { s: 16, c: 'var(--color-muted)', d: <path d="M6 9l6 6 6-6" /> },
  search: { s: 16, c: 'var(--color-muted)', d: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></> },
  cam: { s: 20, c: 'currentColor', d: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></> },
  photo: { s: 22, c: 'var(--color-icon)', w: 1.8, d: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></> },
  info: { s: 18, c: 'var(--color-brand)', d: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></> },
  sun: { s: 18, c: 'currentColor', d: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> },
  moon: { s: 18, c: 'currentColor', d: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /> },
  upload: { s: 22, c: 'var(--color-brand)', d: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" /> },
}
