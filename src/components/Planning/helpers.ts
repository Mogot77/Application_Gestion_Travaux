import type { AppState, Demande, Rdv } from '@/types'
import { RDV_ETAT, chargeOf, dureeST, getD, getLog, getOuv, logAdr, ouvActifs, rdvsOf, shortLot } from '@/helpers/domain'
import { DAY_MAX, type PlanUi } from '@/helpers/planning'
import { TODAY, addDays, fd, fdur, pad, toMin, toTime, weekStart } from '@/helpers/dates'
import type { AppointmentModel, PlanCell, PlanPanelModel, PlanningModel, QueueItem } from './types'

export const getRdv = (S: AppState, id?: string) => S.rdvs.find(r => r.id === id)

export const rdvClass = (S: AppState, r: Rdv) => {
  const d = r.demandeId ? getD(S, r.demandeId) : undefined
  const u = d ? (d.lignes[0].urgence || d.urgence) : 'prog'
  return u === 'urgent' ? 'bu' : u === 'h48' ? 'bh' : 'bp'
}

export const fdurS = (min?: number) => { const v = min || 0; const h = Math.floor(v / 60), m = v % 60; return m ? `${h}h${pad(m)}` : `${h}h` }

const URG_ORDER = { urgent: 0, h48: 1, prog: 2 }
export const planQueue = (demandes: Demande[]) => demandes.filter(d => ['a_planifier', 'acces_impossible'].includes(d.statut))
  .sort((a, b) => (URG_ORDER[a.urgence] - URG_ORDER[b.urgence]) || a.recueLe.localeCompare(b.recueLe))

/** Classe CSS de la carte de la file « À planifier ». */
export const cardCls = (d: Demande): string => d.statut === 'acces_impossible' ? 'u' : ({ urgent: 'u', h48: 'h48', prog: 'pg' }[d.urgence])

/** Heures de début proposées (07:30 à 17:00, pas de 30 min). */
export const startSlots = (): string[] => {
  const debs: string[] = []
  for (let t = toMin('07:30'); t <= toMin('17:00'); t += 30) debs.push(toTime(t))
  return debs
}

/** Modèle de l'écran : file « À planifier », grille de la semaine (ouvriers × jours) et compteurs. */
export const buildPlanningModel = (S: AppState, ui: PlanUi): PlanningModel => {
  const ws = ui.week || weekStart(TODAY)
  const days = [0, 1, 2, 3, 4].map(i => addDays(ws, i))
  const all = planQueue(S.demandes)
  const sel = ui.demandeId ? getD(S, ui.demandeId) : undefined
  const queue = all.filter(d => !ui.fUrg || d.urgence === ui.fUrg).map((d): QueueItem => {
    const log = getLog(S, d.logementId)
    const l0 = d.lignes[0]
    const imp = S.rdvs.find(r => r.demandeId === d.id && r.etat === 'imp')
    return {
      d, cls: cardCls(d), selected: ui.demandeId === d.id,
      ville: log?.ville, dept: log?.dept, typo: log?.typo, logId: log?.id,
      summary: `${l0.piece} — ${shortLot(l0.lot)} · ${l0.nature}${d.lignes.length > 1 ? ' · +' + (d.lignes.length - 1) : ''}`,
      info: imp ? `Report nécessaire le ${fd(imp.date)} (${imp.motifImp || ''})` : `Durée estimée ${fdur(dureeST(d))}`,
    }
  })
  const rows = ouvActifs(S).map(o => ({
    o,
    week: days.reduce((s, dt) => s + chargeOf(S, o.id, dt), 0),
    cells: days.map((dt): PlanCell => {
      const ghost = !!sel && ui.ouvrierId === o.id && ui.date === dt
      return {
        date: dt, today: dt === TODAY,
        blocks: rdvsOf(S, o.id, dt).map(r => ({
          r, icon: { done: '✓ ', running: '▶ ', imp: '⚠ ', planned: '' }[r.etat],
          cls: r.etat === 'imp' ? 'imp' : `${rdvClass(S, r)}${r.etat === 'done' ? ' done' : ''}`,
          selected: ui.rdvSel === r.id,
        })),
        ghost: ghost && sel ? { label: `${sel.id.slice(-4)} ${sel.lignes[0].nature}`, dur: fdurS(dureeST(sel)) } : undefined,
        load: chargeOf(S, o.id, dt) + (ghost && sel ? dureeST(sel) : 0),
      }
    }),
  }))
  return {
    week: ws, days, isCurrentWeek: ws === weekStart(TODAY), queueCount: all.length, fUrg: ui.fUrg, queue, rows,
    hors: S.demandes.filter(d => ['bailleur', 'prestataire'].includes(d.statut)).length,
    todayIds: S.rdvs.flatMap(r => r.date === TODAY && r.demandeId && r.etat === 'planned' ? [r.demandeId] : []),
  }
}

/** Modèle du panneau « fiche mission » : créneau choisi, avertissement éventuel, options des ouvriers. */
export const buildPlanPanelModel = (S: AppState, d: Demande, ui: PlanUi): PlanPanelModel => {
  const dur = dureeST(d)
  let warn = ''
  if (ui.ouvrierId && ui.date && ui.debut) {
    const s = toMin(ui.debut), e = s + dur
    const clash = rdvsOf(S, ui.ouvrierId, ui.date).find(r => r.etat !== 'imp' && s < toMin(r.debut) + r.duree && toMin(r.debut) < e)
    if (clash) warn = `Chevauche ${clash.label} (${clash.debut}).`
    else if (chargeOf(S, ui.ouvrierId, ui.date) + dur > DAY_MAX) warn = 'Dépasse 7 h sur la journée.'
    if (ui.date < TODAY) warn = 'Date passée.'
  }
  const log = getLog(S, d.logementId)
  return {
    d, log, adr: logAdr(log), lignes: d.lignes.filter(l => l.circuit === 'ST' || !l.circuit), dur,
    ouvOptions: ouvActifs(S).map(o => { const c = ui.date ? chargeOf(S, o.id, ui.date) : null; return { v: o.id, l: `${o.nom} — ${o.metier}${c != null ? ` · ${c >= DAY_MAX ? 'complet' : fdurS(c) + ' / 7h'}` : ''}` } }),
    ouvrierId: ui.ouvrierId, date: ui.date, debut: ui.debut, slots: startSlots(),
    fin: ui.debut ? toTime(toMin(ui.debut) + dur) : '', warn, consommables: d.consommables,
    canPlan: !!(ui.ouvrierId && ui.date && ui.debut),
  }
}

/** Modèle du panneau « rendez-vous ». */
export const buildAppointmentModel = (S: AppState, r: Rdv): AppointmentModel => {
  const d = r.demandeId ? getD(S, r.demandeId) : undefined
  const log = d && getLog(S, d.logementId)
  return {
    r, ouvrierNom: getOuv(S, r.ouvrierId)?.nom, demandeId: d?.id,
    logement: log ? `${log.id} · ${log.ville}` : '—',
    travaux: d ? d.lignes.map(l => l.piece + ' · ' + l.nature).join(', ') : r.label,
    etat: RDV_ETAT[r.etat],
  }
}
