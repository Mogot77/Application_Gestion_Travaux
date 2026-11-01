import { useApp } from '@/hooks/useApp'
import Button from '@/components/ui/Button'
import { REFUS } from './constants'
import { setObjEntry } from './helpers'
import type { EditResult, ObjListProps } from './types'

/** Listes d'objets structurants (urgences, circuits, suites) : libellé et description modifiables. */
const ObjList = ({ name, can }: ObjListProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const entries = S.ref[name] as { k: string; l: string; d: string }[]

  const edit = (o: { k: string; l: string; d: string }) => openModal({
    title: 'Modifier la valeur', okLabel: 'Enregistrer',
    body: (
      <>
        <div><label className="lbl" htmlFor="ro-l">Libellé</label><input className="in" id="ro-l" name="l" defaultValue={o.l} /></div>
        <div><label className="lbl" htmlFor="ro-d">Description</label><textarea className="in" id="ro-d" name="d" rows={3} defaultValue={o.d} /></div>
      </>
    ),
    onOk: f => {
      let res: EditResult = 'ok'
      mutate(s => { res = setObjEntry(s.ref, name, o.k, String(f.get('l') || ''), String(f.get('d') || '')) }, { now: true })
      if (res !== 'ok') { toast(REFUS[res], 'err'); return false }
      toast('Valeur enregistrée', 'ok')
    },
  })

  return (
    <>
      <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
        {entries.map(o => (
          <div key={o.k} className="row flex-nowrap items-start justify-between !gap-2 s13">
            <div><strong>{o.l}</strong> <span className="muted">— {o.d}</span></div>
            {can && <Button size="sm" onClick={() => edit(o)}>Modifier</Button>}
          </div>
        ))}
      </div>
      <p className="muted small mb-0 mt-2">Valeurs structurantes : le libellé et la description se modifient, mais pas la liste (le code s'appuie sur ces clés).</p>
    </>
  )
}

export default ObjList
