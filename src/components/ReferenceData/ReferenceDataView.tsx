import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import Note from '@/components/ui/Note'
import Field from '@/components/ui/Field'
import PageHead from '@/components/ui/PageHead'
import ValueList from './ValueList'
import GroupList from './GroupList'
import ObjList from './ObjList'
import RowsEditor from './RowsEditor'
import type { ReferenceDataViewProps, SectionModel } from './types'

/** Référentiels (vue) : seuils, listes modifiables, villes, départements, notes de propreté et statuts. */
const ReferenceDataView = ({ model, onSetSeuil, onEditProprete, onAddValue, onRenameValue, onRemoveValue, onAddGroup, onRenameGroup, onRemoveGroup, onEditObj, onEditRow, onDeleteRow }: ReferenceDataViewProps) => {
  const { can, seuils: s } = model

  const section = (sec: SectionModel) => {
    let body = null
    if (sec.type === 'list') {
      const target = { key: sec.k }
      body = <ValueList arr={sec.values} can={can} onAdd={v => onAddValue(target, v)} onRename={i => onRenameValue(target, i)} onRemove={i => onRemoveValue(target, i)} />
    }
    if (sec.type === 'obj') body = <ObjList entries={sec.entries} can={can} onEdit={o => onEditObj(sec.k, o)} />
    if (sec.type === 'group') {
      body = (
        <GroupList
          groups={sec.groups} can={can}
          onAddGroup={g => onAddGroup(sec.k, g)} onRenameGroup={old => onRenameGroup(sec.k, old)} onRemoveGroup={old => onRemoveGroup(sec.k, old)}
          onAdd={(g, v) => onAddValue({ key: sec.k, group: g }, v)}
          onRename={(g, i) => onRenameValue({ key: sec.k, group: g }, i)}
          onRemove={(g, i) => onRemoveValue({ key: sec.k, group: g }, i)}
        />
      )
    }
    return <section key={sec.k} className="card pad"><h2 className="h2">{sec.title}</h2><p className="muted small mb-3 mt-1">{sec.who}</p>{body}</section>
  }

  return (
    <>
      <PageHead title="Référentiels" subtitle="Toutes les listes sont stockées dans Firestore et modifiables par la direction, sans développement : ajouter, renommer, supprimer. Les demandes existantes gardent leur texte d'origine." />
      {!can && <Note className="mb-4">Lecture seule pour les établissements.</Note>}
      <section className="card pad mb-4"><h2 className="h2">Seuils</h2><p className="muted small mb-3 mt-1">Règles internes d'achat et de travaux sur place (valeurs à définir par la direction).</p>
        <div className="grid-auto" style={{ '--min': '240px' } as React.CSSProperties}>
          <Field label="3 devis minimum au-delà de (€ HT)" htmlFor="s1"><input className="in" id="s1" type="number" min={0} defaultValue={s.troisDevis} disabled={!can} onBlur={e => onSetSeuil('troisDevis', e.target.value)} /></Field>
          <Field label="Validation direction au-delà de (€ HT)" htmlFor="s2"><input className="in" id="s2" type="number" min={0} defaultValue={s.direction} disabled={!can} onBlur={e => onSetSeuil('direction', e.target.value)} /></Field>
          <Field label="Travaux sur place sans validation jusqu'à (min)" htmlFor="s3"><input className="in" id="s3" type="number" min={0} step={15} defaultValue={s.supplementMin} disabled={!can} onBlur={e => onSetSeuil('supplementMin', e.target.value)} /></Field>
        </div></section>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(380px,100%),1fr))' }}>
        {model.sections.map(section)}
        <section className="card pad"><h2 className="h2">Villes</h2><p className="muted small mb-3 mt-1">Centre de la commune (latitude ; longitude), utilisé pour placer un logement non géolocalisé sur la carte</p>
          <RowsEditor rows={model.villes} isVille can={can} onEdit={k => onEditRow('villes', k)} onDelete={k => onDeleteRow('villes', k)} /></section>
        <section className="card pad"><h2 className="h2">Départements</h2><p className="muted small mb-3 mt-1">Code et nom du dossier dans le plan de classement</p>
          <RowsEditor rows={model.depts} isVille={false} can={can} onEdit={k => onEditRow('depts', k)} onDelete={k => onDeleteRow('depts', k)} /></section>
        <section className="card pad"><h2 className="h2">Note de propreté</h2><p className="muted small mb-3 mt-1">De 0 à 6 · une note ≤ 2 alerte la coordination · les 7 niveaux sont fixes, seul le libellé change</p>
          <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>{model.proprete.map((l, i) => (
            <div key={i} className="row flex-nowrap items-center justify-between !gap-2 s13"><div><strong className="inline-block w-5">{i}</strong>{l}</div>{can && <Button size="sm" onClick={() => onEditProprete(i)}>Modifier</Button>}</div>
          ))}</div></section>
        <section className="card pad"><h2 className="h2">Statuts</h2><p className="muted small mb-3 mt-1">Calculés par l'outil (liés au fonctionnement) · visibles par tous</p>
          <div className="reflist">{model.statuts.map(([l, c]) => <Chip key={l} tone={c}>{l}</Chip>)}</div></section>
      </div>
    </>
  )
}

export default ReferenceDataView
