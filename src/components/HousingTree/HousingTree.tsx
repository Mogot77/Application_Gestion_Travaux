import Ext from '@/components/ui/Ext'
import { useApp } from '@/hooks/useApp'
import { STAT } from '@/helpers/domain'
import { docsFor, type DocFile } from '@/helpers/docs'
import { logFolder } from './helpers'
import type { HousingTreeProps } from './types'

const FileRow = ({ x }: { x: DocFile }) => (
  <div className="f"><Ext name={x.name} />{x.name}{x.note && <span className="cm">{x.note}</span>}</div>
)

/** Dossier d'un logement dans l'arborescence de classement (constats + une sous-arborescence par demande). */
const HousingTree = ({ l, open }: HousingTreeProps) => {
  const { S } = useApp()
  const docs = docsFor(S, l)
  return (
    <details open={open}>
      <summary>{logFolder(l)}/</summary>
      <details>
        <summary>_Constats/ <span className="cm">{docs.constats.length} photo(s)</span></summary>
        {docs.constats.map(x => <FileRow key={x.name} x={x} />)}
        {!docs.constats.length && <div className="f cm">vide</div>}
      </details>
      {docs.demandes.map((x, i) => (
        <details key={x.folder} open={open && i === docs.demandes.length - 1}>
          <summary>{x.folder}/ <span className="cm">{STAT[x.d.statut][0].toLowerCase()}</span></summary>
          {x.files.map(f => <FileRow key={f.name} x={f} />)}
        </details>
      ))}
    </details>
  )
}

export default HousingTree
