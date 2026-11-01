import { useState } from 'react'
import Button from '@/components/ui/Button'
import ValueList from './ValueList'
import type { GroupListProps } from './types'

/** Groupes de listes (lots, signalements) : ajouter, renommer et supprimer un groupe, et éditer ses valeurs. */
const GroupList = ({ groups, can, onAddGroup, onRenameGroup, onRemoveGroup, onAdd, onRename, onRemove }: GroupListProps) => {
  const [g, setG] = useState('')
  const add = () => { if (onAddGroup(g)) setG('') }

  return (
    <>
      {groups.map(([g0, arr]) => (
        <details key={g0} className="border-t border-line2 py-2">
          <summary className="cursor-pointer text-[13px] font-semibold">{g0} <span className="muted font-normal">({arr.length})</span></summary>
          <div className="pt-2">
            {can && <div className="row mb-2 !gap-1.5"><Button size="sm" onClick={() => onRenameGroup(g0)}>Renommer le groupe</Button><Button size="sm" variant="danger" onClick={() => onRemoveGroup(g0)}>Supprimer le groupe</Button></div>}
            <ValueList arr={arr} can={can} onAdd={v => onAdd(g0, v)} onRename={i => onRename(g0, i)} onRemove={i => onRemove(g0, i)} />
          </div>
        </details>
      ))}
      {can && (
        <div className="row mt-3 flex-nowrap !gap-1.5 border-t border-line2 pt-3">
          <input className="in sm" placeholder="Nouveau groupe" value={g} onChange={e => setG(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <Button size="sm" onClick={add}>Ajouter un groupe</Button>
        </div>
      )}
    </>
  )
}

export default GroupList
