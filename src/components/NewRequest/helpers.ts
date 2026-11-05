import type { AppState, DraftDemande, DraftLigne, Logement } from '@/types'
import { now } from '@/helpers/dates'
import { getLog, piecesFor, profilOf } from '@/helpers/domain'
import type { CheckItem, CheckResult, LogementGroup, NewRequestModel } from './types'

/** Dispositif Solibail (comparaison sans tenir compte de la casse). */
export const isSolibail = (l?: Logement) => !!l && l.dispositif.toLowerCase().includes('solibail')

export const emptyLine = (): DraftLigne => ({ piece: '', lot: '', nature: '', description: '', photos: [], extra: {} })

export const newDraft = (S: AppState, logId?: string, constatId?: string): DraftDemande => {
  const p = profilOf(S)
  const log = getLog(S, logId)
  return {
    auteur: p.nom, auteurEmail: S.moi?.email, fonction: p.fonction, tel: '', logementId: logId || '', urgence: '', dateSouhaitee: '',
    acces: log ? log.acces : '', numCles: log ? log.cles : '', lieuCles: S.ref.cles[0],
    facturation: 'Non', sinistre: 'Non', sinistreInfo: { nature: '', date: '', fuite: '', tiers: '', constat: '' },
    observations: '', lignes: [emptyLine()], canal: S.profil === 'coord' ? 'Mail' : '', constatId: constatId || '', savedAt: now(),
  }
}

export const check = (S: AppState, dr: DraftDemande): CheckResult => {
  const items: CheckItem[] = []
  const log = getLog(S, dr.logementId)
  items.push([log ? 'ok' : 'wa', log ? 'Logement sélectionné' : 'Logement à sélectionner'])
  items.push([dr.urgence ? 'ok' : 'wa', dr.urgence ? 'Urgence renseignée' : "Niveau d'urgence à choisir"])
  const complete = dr.lignes.filter(l => l.piece && l.lot && l.nature && l.description.trim())
  items.push([complete.length === dr.lignes.length && complete.length ? 'ok' : 'wa', complete.length === dr.lignes.length ? `${complete.length} problème${complete.length > 1 ? 's' : ''} décrit${complete.length > 1 ? 's' : ''}` : `${dr.lignes.length - complete.length} ligne(s) incomplète(s)`])
  // Photo obligatoire, sauf pour une demande urgente (on ne retarde pas l'envoi)
  if (dr.urgence !== 'urgent') dr.lignes.forEach((l, i) => { if (!l.photos.length) items.push(['wa', `Ligne ${i + 1} : photo manquante`]) })
  if (isSolibail(log)) {
    const n = dr.rdvLocataire?.length ?? 0
    items.push([n ? 'ok' : 'na', n ? `${n} RDV prévalidé${n > 1 ? 's' : ''} avec le locataire` : 'Solibail : aucun RDV prévalidé avec le locataire (recommandé)'])
  }
  if (dr.sinistre === 'Oui') items.push([dr.sinistreInfo.nature ? 'ok' : 'wa', dr.sinistreInfo.nature ? 'Sinistre décrit' : 'Nature du sinistre à préciser'])
  items.push(['na', dr.facturation === 'Oui' ? 'Validation hiérarchique : requise (refacturation)' : 'Validation hiérarchique : non requise'])
  return { items, ok: items.every(i => i[0] !== 'wa') }
}

export const getCe = (S: AppState, id?: string) => S.constats.find(c => c.id === id)

export const logLabel = (l?: Logement) => l ? `${l.id} · ${l.typo === 'BUR' ? 'Bureaux' : l.typo} · ${l.adresse}${l.bat ? ', bât. ' + l.bat : ''}${l.apt ? ', apt ' + l.apt : ''} — ${l.ville} (${l.dept})` : ''

/** Logements proposés, groupés par ville ; un établissement ne voit que les siens (et les bureaux). */
export const logementGroups = (S: AppState): LogementGroup[] => {
  const villes = [...new Set(S.logements.map(l => l.ville))].sort()
  return villes.map(v => ({
    ville: v,
    items: S.logements
      .filter(l => l.ville === v && (S.profil !== 'etab' || l.etab === profilOf(S).etab || l.typo === 'BUR'))
      .map(l => ({ id: l.id, label: logLabel(l) })),
  }))
}

/** Modèle d'affichage de la fiche de demande pour un brouillon donné. */
export const buildNewRequestModel = (S: AppState, dr: DraftDemande): NewRequestModel => {
  const log = getLog(S, dr.logementId)
  const pp = piecesFor(S, log)
  return {
    dr, log,
    constat: getCe(S, dr.constatId),
    check: check(S, dr),
    isCoord: S.profil === 'coord',
    isSolibail: isSolibail(log),
    service: log ? log.etab : profilOf(S).etab || '—',
    groups: logementGroups(S),
    urgences: S.ref.urgences,
    urgenceDesc: (S.ref.urgences.find(u => u.k === dr.urgence) || { d: 'Urgent : sécurité, fuite active, porte bloquée, panne générale.' }).d,
    fonctions: S.ref.fonctions,
    cles: S.ref.cles,
    natSinistre: S.ref.natSinistre,
    lots: S.ref.lots,
    pieces: pp.pieces,
    autresPieces: pp.autres,
    arrivee: S.logements.map(x => ({ v: x.id, l: `${x.id} · ${x.ville}` })),
  }
}
