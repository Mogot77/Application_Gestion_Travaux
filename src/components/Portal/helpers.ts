import type { AppState } from '@/types'
import { TODAY, addDays, diffDays } from '@/helpers/dates'
import { entDocs, getCs, getD, getEnt, getLog, shortLot } from '@/helpers/domain'
import { DOC_NAMES } from './constants'
import type { DocRow, PortalModel } from './types'

/** Modèle d'affichage du portail ; null si le lien est invalide (consultation, entreprise, demande ou logement introuvable). */
export const buildPortalModel = (S: AppState, csId: string, eid: string): PortalModel | null => {
  const c = getCs(S, csId)
  if (!c) return null
  const e = getEnt(S, eid)
  const d = getD(S, c.demandeId)
  const log = getLog(S, d?.logementId)
  if (!e || !d || !log) return null
  const dc = entDocs(e)
  const docRows = DOC_NAMES.map(([k, label]): DocRow => {
    const ok = dc.st[k]
    const exp = k === 'rc' || k === 'decennale' ? e.docs[k] : addDays(e.docs[k], k === 'kbis' ? 92 : 182)
    const soon = ok && diffDays(TODAY, exp) < 70
    return { k, label, status: !ok ? 'expired' : soon ? 'soon' : 'ok', exp }
  })
  return {
    c, e, d, log, eid,
    r: c.reponses[eid] || { statut: 'attente' as const },
    closed: c.statut === 'commande' || diffDays(c.dateLimite, TODAY) > 0,
    docsOk: dc.ok,
    docRows,
    photos: c.lignes.flatMap(i => d.lignes[i].photos),
    lotsLabel: c.lignes.map(i => shortLot(d.lignes[i].lot)).filter((v, i, a) => a.indexOf(v) === i).join(' et '),
    entOptions: c.entreprises.map(x => ({ v: x, l: getEnt(S, x)?.nom || x })),
  }
}
