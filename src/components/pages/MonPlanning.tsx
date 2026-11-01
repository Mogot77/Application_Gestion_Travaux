import { useApp } from '../../hooks/useApp'
import { Layout } from '../layout/Layout'
import { Chip } from '../ui/Chip'
import { RDV_ETAT, getD, getLog, logAdr } from '../../lib/domain'
import { TODAY, fday, fdur } from '../../lib/dates'

/** Planning personnel d'un ouvrier : uniquement ses propres interventions. */
export function MonPlanning() {
  const { S } = useApp()
  const id = S.moi?.ouvrierId
  const mine = id ? S.rdvs.filter(r => r.ouvrierId === id).sort((a, b) => (a.date + a.debut).localeCompare(b.date + b.debut)) : []
  const upcoming = mine.filter(r => r.date >= TODAY)
  const days = [...new Set(upcoming.map(r => r.date))]

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
            {upcoming.filter(r => r.date === dt).map(r => {
              const d = getD(S, r.demandeId)
              const lg = getLog(S, d?.logementId)
              const [lib, tone] = RDV_ETAT[r.etat]
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#e5e7eb] py-2 first:border-t-0">
                  <b>{r.debut}</b><span className="muted">{fdur(r.duree)}</span>
                  <span className="min-w-[200px] flex-1">{r.label}{lg && <span className="muted"> — {logAdr(lg)}, {lg.ville}</span>}</span>
                  <Chip tone={tone}>{lib}</Chip>
                  {d && <a className="btn btn-sm" href={`#/fiche/${d.id}`}>Fiche</a>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </Layout>
  )
}
