import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import { getD } from '@/helpers/domain'
import { ftime } from '@/helpers/dates'
import { MOTIFS_REPORT_EXTRA, finishMission, lignesST, startMission, tempsEcoule } from '@/helpers/mission'
import type { LigneStatut, Rdv } from '@/types'
import { buildScheduleModel } from './helpers'
import FinishMissionForm from './FinishMissionForm'
import MyScheduleView from './MyScheduleView'

/** Planning personnel d'un ouvrier : ses interventions, avec démarrage et fin de mission (rapport généré automatiquement). */
const MySchedule = () => {
  const { S, mutate, toast, openModal } = useApp()
  const model = buildScheduleModel(S)

  const demarrer = (r: Rdv) => {
    mutate(s => { startMission(s, r.id) }, { now: true })
    toast('Mission démarrée', 'ok')
  }

  const terminer = (r: Rdv) => {
    const d = getD(S, r.demandeId)
    const lignes = d ? lignesST(d.lignes) : []
    const motifs = [...S.ref.motifsAcces, ...MOTIFS_REPORT_EXTRA]
    const conso = d?.consommables ?? []
    openModal({
      title: `Terminer la mission${d ? ' · ' + d.id : ''}`, okLabel: 'Valider et générer le rapport', wide: true,
      body: <FinishMissionForm debut={ftime(r.debutReel) || r.debut} lignes={lignes} motifs={motifs} conso={conso} tempsDefault={tempsEcoule(ftime(r.debutReel) || r.debut)} />,
      onOk: f => {
        const acces = f.get('acces') === 'on'
        const st = lignes.map((_, i) => (acces ? 'non_realisee' : String(f.get(`l${i}`) || 'realisee')) as LigneStatut)
        const report = st.some(x => x !== 'realisee') || (acces && !lignes.length)
        const motif = acces ? String(f.get('motif') || "Refus d'accès") : String(f.get('motif') || '')
        if (report && !motif) { toast('Indiquez le motif du report', 'err'); return false }
        const used = conso.flatMap((c, i) => f.get(`c${i}`) === 'on' ? [{ nom: c.nom, qte: Math.max(1, Number(f.get(`q${i}`)) || c.qte) }] : [])
        let res: 'done' | 'report' | null = null
        mutate(s => {
          res = finishMission(s, r.id, {
            lignes: st, report, motif: report ? motif : '', obs: String(f.get('obs') || '').trim(),
            conso: used, tempsMin: Math.max(1, Number(f.get('temps')) || 1), signataire: String(f.get('signataire') || '').trim(),
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
      <MyScheduleView model={model} onStart={id => byId(id, demarrer)} onFinish={id => byId(id, terminer)} />
    </Layout>
  )
}

export default MySchedule
