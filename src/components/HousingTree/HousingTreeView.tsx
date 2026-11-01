import Ext from '@/components/ui/Ext'
import type { DocFile } from '@/helpers/docs'
import type { HousingTreeViewProps } from './types'

const FileRow = ({ x }: { x: DocFile }) => (
  <div className="f"><Ext name={x.name} />{x.name}{x.note && <span className="cm">{x.note}</span>}</div>
)

/** Dossier d'un logement dans l'arborescence de classement (présentation seule). */
const HousingTreeView = ({ folder, constats, demandes, open }: HousingTreeViewProps) => (
  <details open={open}>
    <summary>{folder}/</summary>
    <details>
      <summary>_Constats/ <span className="cm">{constats.length} photo(s)</span></summary>
      {constats.map(x => <FileRow key={x.name} x={x} />)}
      {!constats.length && <div className="f cm">vide</div>}
    </details>
    {demandes.map((x, i) => (
      <details key={x.folder} open={open && i === demandes.length - 1}>
        <summary>{x.folder}/ <span className="cm">{x.statut}</span></summary>
        {x.files.map(f => <FileRow key={f.name} x={f} />)}
      </details>
    ))}
  </details>
)

export default HousingTreeView
