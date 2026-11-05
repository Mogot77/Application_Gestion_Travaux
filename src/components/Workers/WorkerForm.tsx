import Field from '@/components/ui/Field'
import ColorPicker from './ColorPicker'
import type { WorkerFormProps } from './types'

/** Formulaire de création / modification d'un ouvrier (affiché dans la modale). */
const WorkerForm = ({ o, metiers, defaultColor }: WorkerFormProps) => (
  <>
    <Field label="Nom affiché (obligatoire)" htmlFor="on"><input className="in" id="on" name="nom" defaultValue={o.nom || ''} placeholder="ex. Karim B." required /></Field>
    <Field label="Métier / spécialité" htmlFor="om"><input className="in" id="om" name="metier" list="om-list" defaultValue={o.metier || ''} placeholder="ex. Plomberie" />
      <datalist id="om-list">{metiers.map(m => <option key={m} value={m} />)}</datalist></Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Téléphone" htmlFor="ot"><input className="in" id="ot" name="tel" type="tel" defaultValue={o.tel || ''} placeholder="06 ·· ·· ·· ··" /></Field>
      <Field label="E-mail (agenda Outlook)" htmlFor="oe"><input className="in" id="oe" name="email" type="email" defaultValue={o.email || ''} placeholder="prenom.nom@exemple.fr" /></Field>
    </div>
    <div className="rounded-lg bg-panel p-3">
      <label className="row !gap-2 text-sm font-semibold"><input type="checkbox" name="astreinte" defaultChecked={!!o.astreinte} /> D’astreinte (urgences)</label>
      <Field label="Numéro d’astreinte (à défaut, le téléphone ci-dessus)" htmlFor="ota" className="mt-2"><input className="in" id="ota" name="telAstreinte" type="tel" defaultValue={o.telAstreinte || ''} placeholder="06 ·· ·· ·· ··" /></Field>
    </div>
    <div><span className="lbl">Couleur sur le planning et la carte</span><ColorPicker initial={o.color || defaultColor} /></div>
  </>
)

export default WorkerForm
