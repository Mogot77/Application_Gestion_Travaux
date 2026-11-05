import type { AppState, Demande } from '@/types'
import { URG, equipeIds, getD, getLog, getOuv } from '@/helpers/domain'
import type { SheetModel } from './types'

/** Modèle d'une fiche : rendez-vous, ouvrier, lignes ST, photos et rapport, calculés depuis l'état. */
export const buildSheetModel = (S: AppState, d: Demande): SheetModel => {
  const r = S.rdvs.filter(x => x.demandeId === d.id && (x.etat !== 'imp' || x.rapport)).sort((a, b) => b.date.localeCompare(a.date))[0]
  const rp = r?.rapport
  const lignes = d.lignes.filter(l => l.circuit === 'ST' || !l.circuit)
  return {
    d,
    log: getLog(S, d.logementId),
    r,
    imp: S.rdvs.find(x => x.demandeId === d.id && x.etat === 'imp'),
    o: r && getOuv(S, r.ouvrierId),
    equipe: r ? equipeIds(r).map(id => getOuv(S, id)?.nom).filter((n): n is string => !!n) : [],
    rp,
    lignes,
    photos: lignes.flatMap((l, i) => l.photos.filter(p => p && p !== 'seed').map(src => ({ src, n: i + 1, piece: l.piece }))),
    urgLabel: URG[d.urgence][2],
    supps: rp ? rp.supps || [] : [],
    motifsAcces: S.ref.motifsAcces.slice(0, 3),
  }
}

/** Fiches des demandes listées (identifiants séparés par des virgules), les inconnues sont ignorées. */
export const buildSheets = (S: AppState, ids: string): SheetModel[] =>
  ids.split(',').map(i => getD(S, i)).filter((d): d is Demande => !!d).map(d => buildSheetModel(S, d))
