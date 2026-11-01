import { useApp } from '@/hooks/useApp'
import Button from '@/components/ui/Button'
import { REFUS } from './constants'
import { removeRow, setDept, setVille } from './helpers'
import type { EditResult, RowsEditorProps } from './types'

/** Villes (nom + coordonnées) et départements (code + libellé) : ajouter, modifier, supprimer. */
const RowsEditor = ({ name, can }: RowsEditorProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const isVille = name === 'villes'
  const rows: [string, string][] = Object.entries(S.ref[name]).map(([k, v]) => [k, isVille ? (v as [number, number]).join(' ; ') : String(v)])

  const form = (old: string | null) => {
    const cur = old ? S.ref[name][old] : undefined
    openModal({
      title: old ? 'Modifier' : 'Ajouter', okLabel: 'Enregistrer',
      body: isVille ? (
        <>
          <div><label className="lbl" htmlFor="rw-a">Ville</label><input className="in" id="rw-a" name="a" defaultValue={old ?? ''} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="lbl" htmlFor="rw-b">Latitude</label><input className="in" id="rw-b" name="b" inputMode="decimal" defaultValue={cur ? (cur as [number, number])[0] : ''} /></div>
            <div><label className="lbl" htmlFor="rw-c">Longitude</label><input className="in" id="rw-c" name="c" inputMode="decimal" defaultValue={cur ? (cur as [number, number])[1] : ''} /></div>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <div><label className="lbl" htmlFor="rw-a">Code</label><input className="in" id="rw-a" name="a" defaultValue={old ?? ''} /></div>
          <div><label className="lbl" htmlFor="rw-b">Libellé du dossier</label><input className="in" id="rw-b" name="b" defaultValue={cur ? String(cur) : ''} /></div>
        </div>
      ),
      onOk: f => {
        let res: EditResult = 'ok'
        const a = String(f.get('a') || '')
        const b = String(f.get('b') || '')
        mutate(s => { res = isVille ? setVille(s.ref, old, a, b, String(f.get('c') || '')) : setDept(s.ref, old, a, b) }, { now: true })
        if (res !== 'ok') { toast(REFUS[res as Exclude<EditResult, 'ok'>], 'err'); return false }
        toast('Enregistré', 'ok')
      },
    })
  }
  const del = (k: string) => openModal({
    title: 'Supprimer', danger: true, okLabel: 'Supprimer',
    body: <p className="m-0">« {k} » sera supprimé.</p>,
    onOk: () => { mutate(s => { removeRow(s.ref, name, k) }, { now: true }); toast('Supprimé', 'ok') },
  })

  return (
    <>
      <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
        {rows.map(([k, v]) => (
          <div key={k} className="row flex-nowrap items-center justify-between !gap-2 s13">
            <div><strong>{k}</strong> <span className="muted">{isVille ? `· ${v}` : `— ${v}`}</span></div>
            {can && <div className="row !gap-1"><Button size="sm" onClick={() => form(k)}>Modifier</Button><Button size="sm" variant="danger" onClick={() => del(k)}>Supprimer</Button></div>}
          </div>
        ))}
        {!rows.length && <span className="muted s13">Aucune valeur</span>}
      </div>
      {can && <Button size="sm" className="mt-2.5" onClick={() => form(null)}>Ajouter</Button>}
    </>
  )
}

export default RowsEditor
