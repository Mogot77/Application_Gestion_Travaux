import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { ValueListProps } from './types'

/** Liste de valeurs : ajouter, renommer (clic sur la valeur) et supprimer. */
const ValueList = ({ arr, can, onAdd, onRename, onRemove }: ValueListProps) => {
  const [v, setV] = useState('')
  const add = () => { if (onAdd(v)) setV('') }

  return (
    <>
      <div className="reflist">
        {arr.map((val, i) => (
          <span key={val} className="refitem">
            {can ? <button type="button" className="!text-ink hover:!text-brand" title="Renommer" onClick={() => onRename(i)}>{val}</button> : val}
            {can && <button type="button" aria-label="Supprimer" onClick={() => onRemove(i)}>×</button>}
          </span>
        ))}
      </div>
      {can && (
        <div className="row mt-2.5 flex-nowrap !gap-1.5">
          <input className="in sm" placeholder="Nouvelle valeur" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <Button size="sm" onClick={add}>Ajouter</Button>
        </div>
      )}
    </>
  )
}

export default ValueList
