import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import { getD } from '@/helpers/domain'
import { ftime } from '@/helpers/dates'
import { CHECKS_FIN, MOTIFS_REPORT_EXTRA, SUITES_SUPP, finishMission, lignesST, startMission, type SuppSaisie } from '@/helpers/mission'
import { equipeIds, getOuv } from '@/helpers/domain'
import type { LigneStatut, Rdv } from '@/types'
import { buildScheduleModel } from './helpers'
import FinishMissionForm from './FinishMissionForm'
import PhotoPicker from './PhotoPicker'
import MyScheduleView from './MyScheduleView'

/** Planning personnel d'un ouvrier : ses interventions, avec démarrage et fin de mission (rapport généré automatiquement). */
const MySchedule = () => {
  const { S, mutate, toast, openModal } = useApp()
  const model = buildScheduleModel(S)

  /** Démarrage (photos de l'état initial obligatoires) ou reprise (photos facultatives) : lance le chronomètre caché. */
  const demarrer = (r: Rdv, resume = false) => {
    const d = getD(S, r.demandeId)
    openModal({
      title: `${resume ? 'Reprendre' : 'Démarrer'} la mission${d ? ' · ' + d.id : ''}`, okLabel: resume ? 'Reprendre la mission' : 'Démarrer la mission',
      body: <PhotoPicker name="avant" legend={resume ? "Photos de l'état actuel (facultatif)" : "Photos de l'état initial"} hint="Prenez les photos avant de commencer les travaux." required={!resume} />,
      onOk: f => {
        const photos = f.getAll('avant').map(String).filter(Boolean)
        if (!resume && !photos.length) { toast("Prenez au moins une photo de l'état initial", 'err'); return false }
        let res: 'start' | 'resume' | null = null
        mutate(s => { res = startMission(s, r.id, photos) }, { now: true })
        const done = res as 'start' | 'resume' | null
        if (done) toast(done === 'resume' ? 'Mission reprise' : 'Mission démarrée', 'ok')
        else toast('Impossible de démarrer cette mission', 'err')
      },
    })
  }

  const terminer = (r: Rdv) => {
    const d = getD(S, r.demandeId)
    const lignes = d ? lignesST(d.lignes) : []
    const motifs = [...S.ref.motifsAcces, ...MOTIFS_REPORT_EXTRA]
    const conso = d?.consommables ?? []
    openModal({
      title: `Terminer la mission${d ? ' · ' + d.id : ''}`, okLabel: 'Valider et générer le rapport', wide: true,
      body: <FinishMissionForm debut={ftime(r.debutReel) || r.debut} lignes={lignes} motifs={motifs} conso={conso} equipe={equipeIds(r).map(id => getOuv(S, id)?.nom).filter((n): n is string => !!n)} />,
      onOk: f => {
        const acces = f.get('acces') === 'on'
        const st = lignes.map((_, i) => (acces ? 'non_realisee' : String(f.get(`l${i}`) || 'realisee')) as LigneStatut)
        const report = st.some(x => x !== 'realisee') || (acces && !lignes.length)
        const motif = acces ? String(f.get('motif') || "Refus d'accès") : String(f.get('motif') || '')
        if (report && !motif) { toast('Indiquez le motif du report', 'err'); return false }
        const photosApres = f.getAll('apres').map(String).filter(Boolean)
        if (!photosApres.length) { toast('Prenez au moins une photo de ce qui a été fait', 'err'); return false }
        const used = conso.flatMap((c, i) => f.get(`c${i}`) === 'on' ? [{ nom: c.nom, qte: Math.max(1, Number(f.get(`q${i}`)) || c.qte) }] : [])
        const supps = [0, 1, 2].flatMap((i): SuppSaisie[] => {
          const description = String(f.get(`sd${i}`) || '').trim()
          if (!description) return []
          const suite = SUITES_SUPP.find(([k]) => k === f.get(`ss${i}`))?.[0] ?? 'programmer'
          return [{ piece: String(f.get(`sp${i}`) || '').trim(), description, duree: Math.max(0, Number(f.get(`sm${i}`)) || 0), suite }]
        })
        const checks = CHECKS_FIN.filter((_, i) => f.get(`k${i}`) === 'on')
        const deplacements = Math.max(1, Math.round(Number(f.get('depl')) || 1))
        let res: 'done' | 'report' | null = null
        mutate(s => {
          res = finishMission(s, r.id, {
            lignes: st, report, motif: report ? motif : '', obs: String(f.get('obs') || '').trim(),
            conso: used, photosApres, signataire: String(f.get('signataire') || '').trim(), supps, checks, deplacements,
          })
        }, { now: true })
        toast(res === 'report' ? 'Mission terminée : report nécessaire' : 'Mission réalisée · rapport généré', 'ok')
      },
    })
  }

  const byId = (id: string, fn: (r: Rdv) => void) => {
    const r = S.rdvs.find(x => x.id === id)
    if (r) fn(r)
  }

  return (
    <Layout active="planning">
      <MyScheduleView model={model} onStart={id => byId(id, r => demarrer(r))} onFinish={id => byId(id, terminer)} onResume={id => byId(id, r => demarrer(r, true))} />
    </Layout>
  )
}

export default MySchedule
