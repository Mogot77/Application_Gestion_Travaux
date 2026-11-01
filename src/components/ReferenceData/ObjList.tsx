import Button from '@/components/ui/Button'
import type { ObjListProps } from './types'

/** Listes d'objets structurants (urgences, circuits, suites) : libellé et description modifiables. */
const ObjList = ({ entries, can, onEdit }: ObjListProps) => (
  <>
    <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
      {entries.map(o => (
        <div key={o.k} className="row flex-nowrap items-start justify-between !gap-2 s13">
          <div><strong>{o.l}</strong> <span className="muted">— {o.d}</span></div>
          {can && <Button size="sm" onClick={() => onEdit(o)}>Modifier</Button>}
        </div>
      ))}
    </div>
    <p className="muted small mb-0 mt-2">Valeurs structurantes : le libellé et la description se modifient, mais pas la liste (le code s'appuie sur ces clés).</p>
  </>
)

export default ObjList
