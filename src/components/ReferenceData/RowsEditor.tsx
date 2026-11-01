import Button from '@/components/ui/Button'
import type { RowsEditorProps } from './types'

/** Villes (nom + coordonnées) et départements (code + libellé) : ajouter, modifier, supprimer. */
const RowsEditor = ({ rows, isVille, can, onEdit, onDelete }: RowsEditorProps) => (
  <>
    <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
      {rows.map(([k, v]) => (
        <div key={k} className="row flex-nowrap items-center justify-between !gap-2 s13">
          <div><strong>{k}</strong> <span className="muted">{isVille ? `· ${v}` : `— ${v}`}</span></div>
          {can && <div className="row !gap-1"><Button size="sm" onClick={() => onEdit(k)}>Modifier</Button><Button size="sm" variant="danger" onClick={() => onDelete(k)}>Supprimer</Button></div>}
        </div>
      ))}
      {!rows.length && <span className="muted s13">Aucune valeur</span>}
    </div>
    {can && <Button size="sm" className="mt-2.5" onClick={() => onEdit(null)}>Ajouter</Button>}
  </>
)

export default RowsEditor
