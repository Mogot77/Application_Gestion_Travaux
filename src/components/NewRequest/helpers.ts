import type { AppState, DraftDemande, DraftLigne, Logement } from '@/types'
import { now } from '@/helpers/dates'
import { getLog, profilOf } from '@/helpers/domain'
import type { CheckItem, CheckResult } from './types'

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
  dr.lignes.forEach((l, i) => { if (!l.photos.length) items.push(['wa', `Ligne ${i + 1} : photo manquante`]) })
  if (dr.sinistre === 'Oui') items.push([dr.sinistreInfo.nature ? 'ok' : 'wa', dr.sinistreInfo.nature ? 'Sinistre décrit' : 'Nature du sinistre à préciser'])
  items.push(['na', dr.facturation === 'Oui' ? 'Validation hiérarchique : requise (refacturation)' : 'Validation hiérarchique : non requise'])
  return { items, ok: items.every(i => i[0] !== 'wa') }
}

export const getCe = (S: AppState, id?: string) => S.constats.find(c => c.id === id)

export const logLabel = (l?: Logement) => l ? `${l.id} · ${l.typo === 'BUR' ? 'Bureaux' : l.typo} · ${l.adresse}${l.bat ? ', bât. ' + l.bat : ''}${l.apt ? ', apt ' + l.apt : ''} — ${l.ville} (${l.dept})` : ''
