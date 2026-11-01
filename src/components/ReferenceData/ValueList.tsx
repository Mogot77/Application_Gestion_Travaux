import { useState } from 'react'
import { useApp } from '@/hooks/useApp'
import Button from '@/components/ui/Button'
import { REFUS } from './constants'
import { addValue, removeValue, renameValue } from './helpers'
import type { EditResult, ValueListProps } from './types'

/** Liste de valeurs : ajouter, renommer (clic sur la valeur) et supprimer. */
const ValueList = ({ arr, target, can }: ValueListProps) => {
  const { mutate, toast, openModal } = useApp()
  const [v, setV] = useState('')

  const add = () => {
    let res: EditResult = 'ok'
    mutate(s => { res = addValue(s.ref, target, v) }, { now: true })
    if (res !== 'ok') return toast(REFUS[res], 'err')
    toast('Valeur ajoutée', 'ok')
    setV('')
  }
  const del = (i: number) => {
    let res: EditResult = 'ok'
    mutate(s => { res = removeValue(s.ref, target, i) }, { now: true })
    if (res !== 'ok') toast(REFUS[res], 'err')
  }
  const rename = (i: number) => openModal({
    title: 'Renommer la valeur', okLabel: 'Enregistrer',
    body: <input className="in" name="v" defaultValue={arr[i]} aria-label="Valeur" />,
    onOk: f => {
      let res: EditResult = 'ok'
      mutate(s => { res = renameValue(s.ref, target, i, String(f.get('v') || '')) }, { now: true })
      if (res !== 'ok') { toast(REFUS[res], 'err'); return false }
      toast('Valeur renommée (les demandes existantes gardent l\u2019ancien texte)', 'ok')
    },
  })

  return (
    <>
      <div className="reflist">
        {arr.map((val, i) => (
          <span key={val} className="refitem">
            {can ? <button type="button" className="!text-ink hover:!text-brand" title="Renommer" onClick={() => rename(i)}>{val}</button> : val}
            {can && <button type="button" aria-label="Supprimer" onClick={() => del(i)}>×</button>}
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
