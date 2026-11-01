import { useState } from 'react'
import { useApp } from '@/hooks/useApp'
import Button from '@/components/ui/Button'
import ValueList from './ValueList'
import { REFUS } from './constants'
import { addGroup, removeGroup, renameGroup } from './helpers'
import type { EditResult, GroupListProps } from './types'

/** Groupes de listes (lots, signalements) : ajouter, renommer et supprimer un groupe, et éditer ses valeurs. */
const GroupList = ({ name, can }: GroupListProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const [g, setG] = useState('')
  const groups = S.ref[name]

  const run = (fn: (s: typeof S) => EditResult, ok: string): boolean => {
    let res: EditResult = 'ok'
    mutate(s => { res = fn(s) }, { now: true })
    if (res !== 'ok') { toast(REFUS[res], 'err'); return false }
    toast(ok, 'ok')
    return true
  }
  const add = () => { if (run(s => addGroup(s.ref, name, g), 'Groupe ajouté')) setG('') }
  const rename = (old: string) => openModal({
    title: 'Renommer le groupe', okLabel: 'Enregistrer',
    body: <input className="in" name="v" defaultValue={old} aria-label="Nom du groupe" />,
    onOk: f => run(s => renameGroup(s.ref, name, old, String(f.get('v') || '')), 'Groupe renommé') ? undefined : false,
  })
  const del = (old: string) => openModal({
    title: 'Supprimer le groupe', danger: true, okLabel: 'Supprimer',
    body: <p className="m-0">Le groupe « {old} » et ses {groups[old].length} valeur(s) seront supprimés. Les demandes existantes ne changent pas.</p>,
    onOk: () => run(s => removeGroup(s.ref, name, old), 'Groupe supprimé') ? undefined : false,
  })

  return (
    <>
      {Object.entries(groups).map(([g0, arr]) => (
        <details key={g0} className="border-t border-line2 py-2">
          <summary className="cursor-pointer text-[13px] font-semibold">{g0} <span className="muted font-normal">({arr.length})</span></summary>
          <div className="pt-2">
            {can && <div className="row mb-2 !gap-1.5"><Button size="sm" onClick={() => rename(g0)}>Renommer le groupe</Button><Button size="sm" variant="danger" onClick={() => del(g0)}>Supprimer le groupe</Button></div>}
            <ValueList arr={arr} target={{ key: name, group: g0 }} can={can} />
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
