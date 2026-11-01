import type { IconDef, IconName } from './types'

export const PATHS: Record<IconName, IconDef> = {
  chev: { s: 16, c: '#5B6472', d: <path d="M6 9l6 6 6-6" /> },
  search: { s: 16, c: '#5B6472', d: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></> },
  cam: { s: 20, c: 'currentColor', d: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></> },
  photo: { s: 22, c: '#7A8494', w: 1.8, d: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></> },
  info: { s: 18, c: '#1D4ED8', d: <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></> },
  upload: { s: 22, c: '#1D4ED8', d: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" /> },
}
