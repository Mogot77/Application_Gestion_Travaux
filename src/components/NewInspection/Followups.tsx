import Card from '@/components/ui/Card'
import Seg from '@/components/ui/Seg'
import type { SuiteKey } from '@/helpers/constatSuites'
import type { Role } from '@/helpers/roles'
import type { FollowupsProps } from './types'

/** Suites à donner (avec scénarios conseillés) et choix des échelons à informer par courriel (présentation seule). */
const Followups = ({ model, onPatch }: FollowupsProps) => {
  const { draft: c, scenarios, conseil, suites, echelons } = model
  const label = (k: SuiteKey) => suites.find(s => s.key === k)?.label
  const roleLabel = (r: Role) => echelons.find(e => e.role === r)?.label
  const toggleSuite = (k: SuiteKey, on: boolean) => onPatch({ actions: on ? [...c.actions, k] : c.actions.filter(x => x !== k) })
  const toggleEchelon = (r: Role, on: boolean) => onPatch({ echelons: c.multi ? (on ? [...c.echelons, r] : c.echelons.filter(x => x !== r)) : on ? [r] : [] })
  const apply = () => onPatch({ actions: conseil.suites, echelons: c.multi ? conseil.echelons : conseil.echelons.slice(0, 1) })
  const advised = (k: SuiteKey) => conseil.suites.includes(k) && <span className="tag ml-1.5">Conseillé</span>

  return (
    <>
      <div>
        <span className="lbl">Suites à donner</span>
        {scenarios.length > 0 ? (
          <div className="mb-2 flex flex-col gap-2">
            {scenarios.map(s => (
              <Card key={s.id} className="p-3 text-sm">
                <strong>{s.titre}</strong>
                <p className="muted m-0 mt-0.5">{s.raison}</p>
                <p className="small m-0 mt-1">Suites : {s.suites.map(label).join(' · ')} — Informer : {s.echelons.map(roleLabel).join(', ')}</p>
              </Card>
            ))}
            <div><button type="button" className="btn btn-sm" onClick={apply}>Appliquer les recommandations</button></div>
          </div>
        ) : <p className="small muted mb-2 mt-0">Aucun scénario particulier : sans suite par défaut. Vous pouvez tout de même choisir une action.</p>}
        {suites.map(s => (
          <label key={s.key} className="chkrow items-start">
            <input type="checkbox" checked={c.actions.includes(s.key)} onChange={e => toggleSuite(s.key, e.target.checked)} />
            <span><strong>{s.label}</strong>{advised(s.key)}<small className="muted block">{s.description}</small></span>
          </label>
        ))}
        {c.actions.includes('intervention') && <p className="small mb-0 mt-1.5">« Enregistrer et créer une demande » ouvre ensuite le formulaire d’intervention.</p>}
      </div>
      <div>
        <div className="row between mb-1">
          <span className="lbl m-0">Informer par e-mail</span>
          <Seg values={['Choix multiple', 'Choix simple']} sel={c.multi ? 'Choix multiple' : 'Choix simple'}
            onPick={v => onPatch({ multi: v === 'Choix multiple', echelons: v === 'Choix multiple' ? c.echelons : c.echelons.slice(0, 1) })} />
        </div>
        {echelons.map(e => (
          <label key={e.role} className="chkrow">
            <input type={c.multi ? 'checkbox' : 'radio'} name="echelon" checked={c.echelons.includes(e.role)} onChange={ev => toggleEchelon(e.role, ev.target.checked)} />
            {e.label}{conseil.echelons.includes(e.role) && <span className="tag ml-1.5">Conseillé</span>}
          </label>
        ))}
        {c.echelons.length > 0 && <button type="button" className="linkbtn small mt-1" onClick={() => onPatch({ echelons: [] })}>Ne prévenir personne</button>}
        <p className="small muted mb-0 mt-1.5">À l’enregistrement, votre messagerie s’ouvre avec le message prêt à envoyer aux comptes correspondant à ces échelons (pour les rôles d’établissement, ceux du logement concerné).</p>
      </div>
    </>
  )
}

export default Followups
