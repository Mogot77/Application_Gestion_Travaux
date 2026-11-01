/* Génération des dossiers et noms de fichiers (règles de nommage du plan de classement) */
import type { AppState, Demande, Logement } from '../types'
import { pad, slug } from './dates'
import { getCs, getEnt, getOuv, shortLot } from './domain'

export interface DocFile {
  name: string; type: string; demande: string; logement: string; ville: string; etab: string
  lot: string; piece: string; date: string; ouvrier: string; note?: string
}
export interface DocFolder { folder: string; d: Demande; files: DocFile[] }

export const logFolder = (l: Logement) => `${l.id}_${slug(l.adresse)}${l.apt ? `_Apt-${l.bat || ''}${pad(Number(l.apt))}` : ''}`

export const docsFor = (S: AppState, l: Logement): { demandes: DocFolder[]; constats: DocFile[] } => {
  const out: DocFolder[] = []
  const ds = S.demandes.filter(d => d.logementId === l.id && d.statut !== 'brouillon').sort((a, b) => a.recueLe.localeCompare(b.recueLe))
  ds.forEach(d => {
    const files: DocFile[] = []
    const meta = (name: string, type: string, extra: Partial<DocFile> = {}) =>
      files.push({ name, type, demande: d.id, logement: l.id, ville: l.ville, etab: l.etab, lot: '—', piece: '—', date: '', ouvrier: '', ...extra })
    meta(`${d.id}_00_Demande.pdf`, 'Demande', { date: d.recueLe.slice(0, 10) })
    d.lignes.forEach((ln, i) => {
      const base = `${d.id}_L${i + 1}_${slug(ln.piece)}_${slug(shortLot(ln.lot))}-${slug(ln.nature.split(' ')[0])}`
      ;(ln.photos || []).forEach((_p, j) => meta(`${base}_AVANT_${pad(j + 1)}.jpg`, 'Avant', { lot: shortLot(ln.lot), piece: ln.piece, date: d.recueLe.slice(0, 10) }))
    })
    if (d.ft) meta(`${d.id}_${d.ft}_Fiche-intervention.pdf`, 'Fiche ST')
    S.rdvs.filter(r => r.demandeId === d.id && r.rapport).forEach(r => {
      const o = getOuv(S, r.ouvrierId)?.nom || ''
      d.lignes.forEach((ln, i) => (ln.photosApres || []).forEach((_p, j) =>
        meta(`${d.id}_L${i + 1}_${slug(ln.piece)}_${slug(shortLot(ln.lot))}-${slug(ln.nature.split(' ')[0])}_APRES_${pad(j + 1)}.jpg`, 'Après', { lot: shortLot(ln.lot), piece: ln.piece, date: r.date, ouvrier: o })))
      ;(r.rapport?.supps || []).forEach((s, i) =>
        meta(`${d.id}_S${i + 1}_${slug(s.piece)}_${slug(shortLot(s.lot))}-${slug(s.nature.split(' ')[0])}_SUPP_01.jpg`, 'Supplément', { lot: shortLot(s.lot), piece: s.piece, date: r.date, ouvrier: o, note: 'travaux ajoutés sur place' }))
      meta(`${d.id}_Rapport_${r.date}_interne.pdf`, 'Rapport', { lot: shortLot(d.lignes[0].lot), date: r.date, ouvrier: o })
      meta(`${d.id}_Rapport_${r.date}_etablissement.pdf`, 'Rapport', { lot: shortLot(d.lignes[0].lot), date: r.date, ouvrier: o })
    })
    if (d.consultationId) {
      const c = getCs(S, d.consultationId)
      if (c) Object.entries(c.reponses).filter(([, r]) => r.statut === 'recu').forEach(([eid, r]) =>
        meta(`${d.id}_Devis_${slug(getEnt(S, eid)?.nom || eid)}_${r.date}.pdf`, 'Devis', { date: r.date || '', note: 'prestataire' }))
    }
    if (d.sinistreInfo) meta(`${d.id}_Sinistre_Declaration_${d.recueLe.slice(0, 10)}.pdf`, 'Sinistre')
    out.push({ folder: `${d.id}_${d.recueLe.slice(0, 10)}`, d, files })
  })
  const cons: DocFile[] = S.constats.filter(c => c.logementId === l.id).flatMap(c => c.photos.map((_p, j) => ({
    name: `${c.id}_${c.date}_${pad(j + 1)}.jpg`, type: 'Constat', demande: '—', logement: l.id, ville: l.ville, etab: l.etab, lot: '—', piece: '—', date: c.date, ouvrier: '',
  })))
  return { demandes: out, constats: cons }
}
