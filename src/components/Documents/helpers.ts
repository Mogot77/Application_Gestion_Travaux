import type { AppState, Logement } from '@/types'
import { STAT, profilOf } from '@/helpers/domain'
import { docsFor } from '@/helpers/docs'
import { TODAY, diffDays, slug } from '@/helpers/dates'
import type { HousingTreeViewProps } from '@/components/HousingTree'
import { logFolder } from '@/components/HousingTree/helpers'
import type { DocumentsModel, DocumentsUi } from './types'

/** Données d'affichage du dossier d'un logement dans l'arborescence (même résultat que le conteneur HousingTree). */
const treeOf = (S: AppState, l: Logement): HousingTreeViewProps => {
  const docs = docsFor(S, l)
  return {
    folder: logFolder(l), open: false, constats: docs.constats,
    demandes: docs.demandes.map(x => ({ folder: x.folder, statut: STAT[x.d.statut][0].toLowerCase(), files: x.files })),
  }
}

/** Arborescence Département › Ville › Logement et liste filtrée des fichiers de la vue SharePoint. */
export const buildDocumentsModel = (S: AppState, ui: DocumentsUi): DocumentsModel => {
  const logs = S.logements.filter(l => S.profil !== 'etab' || l.etab === profilOf(S).etab)
  const byDept: Record<string, Record<string, Logement[]>> = {}
  logs.forEach(l => {
    const dk = S.ref.depts[l.dept] || l.dept
    byDept[dk] = byDept[dk] || {}
    ;(byDept[dk][slug(l.ville)] = byDept[dk][slug(l.ville)] || []).push(l)
  })
  const all = logs.flatMap(l => { const d = docsFor(S, l); return [...d.demandes.flatMap(x => x.files), ...d.constats] })
  const files = all.filter(f => !ui.v
    || (ui.v === 'week' && f.name.endsWith('.jpg') && f.date && diffDays(f.date, TODAY) <= 7 && diffDays(f.date, TODAY) >= 0)
    || (ui.v === 'avap' && ['Avant', 'Après'].includes(f.type))
    || (ui.v === 'rap' && f.type === 'Rapport')
    || (ui.v === 'devis' && f.type === 'Devis')
    || (ui.v === 'cons' && f.type === 'Constat'))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return {
    depts: Object.entries(byDept).sort().map(([dept, villes]) => ({
      dept,
      villes: Object.entries(villes).sort().map(([ville, ls]) => ({ ville, count: ls.length, trees: ls.map(l => treeOf(S, l)) })),
    })),
    files,
    view: ui.v,
  }
}
