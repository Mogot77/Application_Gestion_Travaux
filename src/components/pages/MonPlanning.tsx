import { useApp } from '../../hooks/useApp'
import { Layout } from '../layout/Layout'
import { Chip } from '../ui/Chip'
import { RDV_ETAT, getD, getLog, logAdr } from '../../lib/domain'
import { TODAY, fday, fdur, ftime } from '../../lib/dates'
import { MOTIFS_REPORT_EXTRA, finishMission, lignesST, startMission, tempsEcoule } from '../../lib/mission'
import type { LigneStatut, Rdv } from '../../types'

const STATUTS: [LigneStatut, string][] = [['realisee', 'Réalisée'], ['partielle', 'Partielle'], ['non_realisee', 'Non réalisée']]

/** Planning personnel d'un ouvrier : ses interventions, avec démarrage et fin de mission (rapport généré automatiquement). */
export function MonPlanning() {
  const { S, mutate, toast, openModal } = useApp()
  const id = S.moi?.ouvrierId
  const mine = id ? S.rdvs.filter(r => r.ouvrierId === id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut)) : []
  const shown = mine.filter(r => r.date >= TODAY || r.etat === 'running')
  const days = [...new Set(shown.map(r => r.date))]

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
      body: (
        <>
          <p className="muted m-0 text-sm">Début réel : {ftime(r.debutReel) || r.debut}. Le rapport d’intervention est généré à partir de ce formulaire.</p>
          <fieldset className="m-0 border-0 p-0">
            <legend className="lbl">Travaux réalisés</legend>
            {lignes.map((l, i) => (
              <div key={i} className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="min-w-[200px] flex-1 text-sm"><b>{l.piece}</b> · {l.nature}</span>
                <select className="in max-w-[170px]" name={`l${i}`} defaultValue="realisee" aria-label={`Statut de la ligne ${i + 1}`}>
                  {STATUTS.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
                </select>
              </div>
            ))}
            {!lignes.length && <p className="muted m-0 text-sm">Aucune ligne de travaux : la mission sera considérée réalisée.</p>}
          </fieldset>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="acces" /> Accès impossible (aucun travail réalisé)</label>
          <div>
            <label className="lbl" htmlFor="fm-motif">Motif du report (si une ligne n’est pas réalisée)</label>
            <select className="in" id="fm-motif" name="motif" defaultValue=""><option value="">— Choisir —</option>{motifs.map(m => <option key={m}>{m}</option>)}</select>
          </div>
          {conso.length > 0 && (
            <fieldset className="m-0 border-0 p-0">
              <legend className="lbl">Consommables utilisés</legend>
              {conso.map((c, i) => (
                <div key={i} className="mb-1 flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`c${i}`} defaultChecked={c.pris} aria-label={c.nom} />
                  <span className="flex-1">{c.nom}</span>
                  <input className="in w-20" type="number" min={1} name={`q${i}`} defaultValue={c.qte} aria-label={`Quantité de ${c.nom}`} />
                </div>
              ))}
            </fieldset>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="lbl" htmlFor="fm-t">Temps passé (minutes)</label><input className="in" id="fm-t" type="number" min={1} name="temps" defaultValue={tempsEcoule(ftime(r.debutReel) || r.debut)} /></div>
            <div><label className="lbl" htmlFor="fm-s">Signataire (occupant ou référent, facultatif)</label><input className="in" id="fm-s" name="signataire" /></div>
          </div>
          <div><label className="lbl" htmlFor="fm-o">Observations</label><textarea className="in" id="fm-o" name="obs" rows={3} /></div>
        </>
      ),
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

  return (
    <Layout active="planning">
      <h1 className="mb-1 text-xl font-bold">Mon planning</h1>
      <p className="muted mb-4 text-sm">{S.moi?.nom}</p>
      {!id ? (
        <p className="card p-6 text-sm">
          Votre compte n’est associé à aucun ouvrier. Demandez à un administrateur de renseigner votre adresse e-mail ({S.moi?.email}) dans la fiche ouvrier.
        </p>
      ) : days.length === 0 ? (
        <p className="card p-6 text-sm">Aucune intervention à venir.</p>
      ) : days.map(dt => (
        <section key={dt} className="card mb-4 p-4">
          <h2 className="mb-2 text-base font-semibold">{fday(dt)}{dt === TODAY && <small className="ml-2">Aujourd’hui</small>}</h2>
          <ul className="m-0 list-none p-0">
            {shown.filter(r => r.date === dt).map(r => {
              const d = getD(S, r.demandeId)
              const lg = getLog(S, d?.logementId)
              const [lib, tone] = RDV_ETAT[r.etat]
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#e5e7eb] py-2 first:border-t-0">
                  <b>{r.debut}</b><span className="muted">{fdur(r.duree)}</span>
                  <span className="min-w-[200px] flex-1">{r.label}{lg && <span className="muted"> — {logAdr(lg)}, {lg.ville}</span>}{r.motifImp && <span className="muted"> · {r.motifImp}</span>}</span>
                  <Chip tone={tone}>{lib}</Chip>
                  {r.etat === 'planned' && r.date <= TODAY && <button className="btn btnp btn-sm" onClick={() => demarrer(r)}>Démarrer la mission</button>}
                  {r.etat === 'running' && <button className="btn btnp btn-sm" onClick={() => terminer(r)}>Terminer la mission</button>}
                  {d && <a className="btn btn-sm" href={`#/fiche/${d.id}`}>{r.rapport ? 'Rapport' : 'Fiche'}</a>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </Layout>
  )
}
