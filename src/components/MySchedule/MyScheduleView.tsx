import Chip from '@/components/ui/Chip'
import { fday, fdur } from '@/helpers/dates'
import type { MyScheduleViewProps } from './types'

/** Vue pure du planning personnel d'un ouvrier. */
const MyScheduleView = ({ model, onStart, onFinish, onResume }: MyScheduleViewProps) => (
  <>
    <h1 className="mb-1 text-xl font-bold">Mon planning</h1>
    <p className="muted mb-4 text-sm">{model.nom}</p>
    {!model.hasWorker ? (
      <p className="card p-6 text-sm">
        Votre compte n’est associé à aucun ouvrier. Demandez à un administrateur de renseigner votre adresse e-mail ({model.email}) dans la fiche ouvrier.
      </p>
    ) : model.days.length === 0 ? (
      <p className="card p-6 text-sm">Aucune intervention à venir.</p>
    ) : model.days.map(day => (
      <section key={day.date} className="card mb-4 p-4">
        <h2 className="mb-2 text-base font-semibold">{fday(day.date)}{day.today && <small className="ml-2">Aujourd’hui</small>}</h2>
        <ul className="m-0 list-none p-0">
          {day.items.map(({ r, place, etat: [lib, tone], canStart, canFinish, canResume, demandeId }) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line py-2 first:border-t-0">
              <b>{r.debut}</b><span className="muted">{fdur(r.duree)}</span>
              <span className="min-w-[200px] flex-1">{r.label}{place && <span className="muted"> — {place}</span>}{r.motifImp && <span className="muted"> · {r.motifImp}</span>}</span>
              <Chip tone={tone}>{lib}</Chip>
              {canStart && <button className="btn btnp btn-sm" onClick={() => onStart(r.id)}>Démarrer la mission</button>}
              {canResume && <button className="btn btnp btn-sm" onClick={() => onResume(r.id)}>Reprendre la mission</button>}
              {canFinish && <button className="btn btnp btn-sm" onClick={() => onFinish(r.id)}>Terminer la mission</button>}
              {demandeId && <a className="btn btn-sm" href={`#/fiche/${demandeId}`}>{r.rapport ? 'Rapport' : 'Fiche'}</a>}
            </li>
          ))}
        </ul>
      </section>
    ))}
  </>
)

export default MyScheduleView
