import { TYPOS } from './constants'
import type { HousingFormProps } from './types'

const field = (name: string, label: string, props: Record<string, string | number | boolean> = {}) => (
  <div><label className="lbl" htmlFor={'nl-' + name}>{label}</label><input className="in" id={'nl-' + name} name={name} {...props} /></div>
)

/** Formulaire de création d'un logement (champs lus par la modale via FormData). */
const HousingForm = ({ etabs }: HousingFormProps) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="lbl" htmlFor="nl-typo">Typologie</label>
        <select className="in" id="nl-typo" name="typo" defaultValue="T2">{TYPOS.map(t => <option key={t} value={t}>{t === 'BUR' ? 'Bureaux' : t}</option>)}</select>
      </div>
      {field('surface', 'Surface (m²)', { type: 'number', min: 1, defaultValue: 40 })}
    </div>
    {field('adresse', 'Adresse (obligatoire)', { placeholder: 'ex. 21 bd des Coquibus', required: true })}
    <div className="grid grid-cols-3 gap-3">
      {field('bat', 'Bâtiment')}{field('etage', 'Étage', { placeholder: 'ex. 2e étage' })}{field('apt', 'N° appartement')}
    </div>
    <div className="grid grid-cols-[110px_1fr] gap-3">
      {field('cp', 'Code postal', { inputMode: 'numeric', maxLength: 5, placeholder: '77100', required: true })}
      {field('ville', 'Ville', { required: true })}
    </div>
    <div>
      <label className="lbl" htmlFor="nl-etab">Établissement / service (obligatoire)</label>
      <input className="in" id="nl-etab" name="etab" list="nl-etabs" required />
      <datalist id="nl-etabs">{etabs.map(e => <option key={e} value={e} />)}</datalist>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {field('section', 'Section / code service')}{field('cgl', 'CGL')}
      {field('dispositif', 'Dispositif')}{field('menage', 'N° ménage')}
      {field('secteur', 'Secteur')}{field('cles', 'N° de clés')}
    </div>
    {field('acces', "Indications d'accès", { placeholder: 'Ascenseur, étage, interphone…' })}
  </>
)

export default HousingForm
