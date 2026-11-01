import type { Referentiels as Ref } from '@/types'
import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import Note from '@/components/ui/Note'
import Field from '@/components/ui/Field'
import PageHead from '@/components/ui/PageHead'
import { STAT } from '@/helpers/domain'
import { LISTS, REFUS } from './constants'
import { setProprete } from './helpers'
import type { EditResult } from './types'
import ValueList from './ValueList'
import GroupList from './GroupList'
import ObjList from './ObjList'
import RowsEditor from './RowsEditor'

const ReferenceData = () => {
  const { S, mutate, toast, openModal } = useApp()
  const ref = S.ref
  const can = S.profil !== 'etab'
  const s = ref.seuils

  const setSeuil = (k: keyof Ref['seuils'], v: string) => {
    mutate(st => { st.ref.seuils[k] = Math.max(0, Number(v) || 0) }, { now: true })
    toast('Seuil enregistré', 'ok')
  }
  const editProprete = (i: number) => openModal({
    title: `Note ${i} — libellé`, okLabel: 'Enregistrer',
    body: <input className="in" name="v" defaultValue={ref.proprete[i]} aria-label="Libellé" />,
    onOk: f => {
      let res: EditResult = 'ok'
      mutate(st => { res = setProprete(st.ref, i, String(f.get('v') || '')) }, { now: true })
      if (res !== 'ok') { toast(REFUS[res], 'err'); return false }
      toast('Libellé enregistré', 'ok')
    },
  })

  const section = ([k, t, who, type]: (typeof LISTS)[number]) => {
    let body = null
    if (type === 'list') body = <ValueList arr={ref[k]} target={{ key: k }} can={can} />
    if (type === 'obj') body = <ObjList name={k} can={can} />
    if (type === 'group') body = <GroupList name={k} can={can} />
    return <section key={k} className="card pad"><h2 className="h2">{t}</h2><p className="muted small mb-3 mt-1">{who}</p>{body}</section>
  }

  return (
    <Layout active="referentiels">
      <PageHead title="Référentiels" subtitle="Toutes les listes sont stockées dans Firestore et modifiables par la direction, sans développement : ajouter, renommer, supprimer. Les demandes existantes gardent leur texte d'origine." />
      {!can && <Note className="mb-4">Lecture seule pour les établissements.</Note>}
      <section className="card pad mb-4"><h2 className="h2">Seuils</h2><p className="muted small mb-3 mt-1">Règles internes d'achat et de travaux sur place (valeurs à définir par la direction).</p>
        <div className="grid-auto" style={{ '--min': '240px' } as React.CSSProperties}>
          <Field label="3 devis minimum au-delà de (€ HT)" htmlFor="s1"><input className="in" id="s1" type="number" min={0} defaultValue={s.troisDevis} disabled={!can} onBlur={e => setSeuil('troisDevis', e.target.value)} /></Field>
          <Field label="Validation direction au-delà de (€ HT)" htmlFor="s2"><input className="in" id="s2" type="number" min={0} defaultValue={s.direction} disabled={!can} onBlur={e => setSeuil('direction', e.target.value)} /></Field>
          <Field label="Travaux sur place sans validation jusqu'à (min)" htmlFor="s3"><input className="in" id="s3" type="number" min={0} step={15} defaultValue={s.supplementMin} disabled={!can} onBlur={e => setSeuil('supplementMin', e.target.value)} /></Field>
        </div></section>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(380px,100%),1fr))' }}>
        {LISTS.map(section)}
        <section className="card pad"><h2 className="h2">Villes</h2><p className="muted small mb-3 mt-1">Centre de la commune (latitude ; longitude), utilisé pour placer un logement non géolocalisé sur la carte</p>
          <RowsEditor name="villes" can={can} /></section>
        <section className="card pad"><h2 className="h2">Départements</h2><p className="muted small mb-3 mt-1">Code et nom du dossier dans le plan de classement</p>
          <RowsEditor name="depts" can={can} /></section>
        <section className="card pad"><h2 className="h2">Note de propreté</h2><p className="muted small mb-3 mt-1">De 0 à 6 · une note ≤ 2 alerte la coordination · les 7 niveaux sont fixes, seul le libellé change</p>
          <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>{ref.proprete.map((l, i) => (
            <div key={i} className="row flex-nowrap items-center justify-between !gap-2 s13"><div><strong className="inline-block w-5">{i}</strong>{l}</div>{can && <Button size="sm" onClick={() => editProprete(i)}>Modifier</Button>}</div>
          ))}</div></section>
        <section className="card pad"><h2 className="h2">Statuts</h2><p className="muted small mb-3 mt-1">Calculés par l'outil (liés au fonctionnement) · visibles par tous</p>
          <div className="reflist">{Object.values(STAT).map(([l, c]) => <Chip key={l} tone={c}>{l}</Chip>)}</div></section>
      </div>
    </Layout>
  )
}

export default ReferenceData
