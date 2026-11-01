import type { Referentiels as Ref } from '@/types'
import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import { REFUS } from './constants'
import { addGroup, addValue, buildReferenceDataModel, pick, removeGroup, removeRow, removeValue, renameGroup, renameValue, setDept, setObjEntry, setProprete, setVille } from './helpers'
import { NameBody, ObjBody, RowBody } from './ModalBodies'
import ReferenceDataView from './ReferenceDataView'
import type { EditResult, GroupKey, ObjEntry, ObjKey, RowsKey, Target } from './types'

const ReferenceData = () => {
  const { S, mutate, toast, openModal } = useApp()
  const ref = S.ref

  /** Applique une modification des référentiels ; toast d'erreur si refusée, toast `ok` (si fourni) sinon. */
  const run = (fn: (r: Ref) => EditResult, ok?: string): boolean => {
    let res: EditResult = 'ok'
    mutate(s => { res = fn(s.ref) }, { now: true })
    if (res !== 'ok') { toast(REFUS[res], 'err'); return false }
    if (ok) toast(ok, 'ok')
    return true
  }

  const setSeuil = (k: keyof Ref['seuils'], v: string) => {
    mutate(st => { st.ref.seuils[k] = Math.max(0, Number(v) || 0) }, { now: true })
    toast('Seuil enregistré', 'ok')
  }
  const editProprete = (i: number) => openModal({
    title: `Note ${i} — libellé`, okLabel: 'Enregistrer',
    body: <NameBody defaultValue={ref.proprete[i]} label="Libellé" />,
    onOk: f => run(r => setProprete(r, i, String(f.get('v') || '')), 'Libellé enregistré') ? undefined : false,
  })

  const onAddValue = (t: Target, v: string) => run(r => addValue(r, t, v), 'Valeur ajoutée')
  const onRemoveValue = (t: Target, i: number) => { run(r => removeValue(r, t, i)) }
  const onRenameValue = (t: Target, i: number) => openModal({
    title: 'Renommer la valeur', okLabel: 'Enregistrer',
    body: <NameBody defaultValue={pick(ref, t)[i]} label="Valeur" />,
    onOk: f => run(r => renameValue(r, t, i, String(f.get('v') || '')), 'Valeur renommée (les demandes existantes gardent l’ancien texte)') ? undefined : false,
  })

  const onAddGroup = (name: GroupKey, g: string) => run(r => addGroup(r, name, g), 'Groupe ajouté')
  const onRenameGroup = (name: GroupKey, old: string) => openModal({
    title: 'Renommer le groupe', okLabel: 'Enregistrer',
    body: <NameBody defaultValue={old} label="Nom du groupe" />,
    onOk: f => run(r => renameGroup(r, name, old, String(f.get('v') || '')), 'Groupe renommé') ? undefined : false,
  })
  const onRemoveGroup = (name: GroupKey, old: string) => openModal({
    title: 'Supprimer le groupe', danger: true, okLabel: 'Supprimer',
    body: <p className="m-0">Le groupe « {old} » et ses {ref[name][old].length} valeur(s) seront supprimés. Les demandes existantes ne changent pas.</p>,
    onOk: () => run(r => removeGroup(r, name, old), 'Groupe supprimé') ? undefined : false,
  })

  const onEditObj = (name: ObjKey, o: ObjEntry) => openModal({
    title: 'Modifier la valeur', okLabel: 'Enregistrer',
    body: <ObjBody entry={o} />,
    onOk: f => run(r => setObjEntry(r, name, o.k, String(f.get('l') || ''), String(f.get('d') || '')), 'Valeur enregistrée') ? undefined : false,
  })

  const onEditRow = (name: RowsKey, old: string | null) => {
    const isVille = name === 'villes'
    const cur = old ? ref[name][old] : undefined
    const defaults = isVille
      ? { a: old ?? '', b: cur ? String((cur as [number, number])[0]) : '', c: cur ? String((cur as [number, number])[1]) : '' }
      : { a: old ?? '', b: cur ? String(cur) : '', c: '' }
    openModal({
      title: old ? 'Modifier' : 'Ajouter', okLabel: 'Enregistrer',
      body: <RowBody isVille={isVille} {...defaults} />,
      onOk: f => {
        const a = String(f.get('a') || '')
        const b = String(f.get('b') || '')
        return run(r => isVille ? setVille(r, old, a, b, String(f.get('c') || '')) : setDept(r, old, a, b), 'Enregistré') ? undefined : false
      },
    })
  }
  const onDeleteRow = (name: RowsKey, k: string) => openModal({
    title: 'Supprimer', danger: true, okLabel: 'Supprimer',
    body: <p className="m-0">« {k} » sera supprimé.</p>,
    onOk: () => { mutate(s => { removeRow(s.ref, name, k) }, { now: true }); toast('Supprimé', 'ok') },
  })

  return (
    <Layout active="referentiels">
      <ReferenceDataView
        model={buildReferenceDataModel(S)}
        onSetSeuil={setSeuil} onEditProprete={editProprete}
        onAddValue={onAddValue} onRenameValue={onRenameValue} onRemoveValue={onRemoveValue}
        onAddGroup={onAddGroup} onRenameGroup={onRenameGroup} onRemoveGroup={onRemoveGroup}
        onEditObj={onEditObj} onEditRow={onEditRow} onDeleteRow={onDeleteRow}
      />
    </Layout>
  )
}

export default ReferenceData
