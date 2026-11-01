import { useState } from 'react'
import type { Referentiels as Ref } from '../../types'
import { useApp } from '../../hooks/useApp'
import { Layout } from '../layout/Layout'
import { Chip } from '../ui/Chip'
import { STAT } from '../../lib/domain'

type ListKey = { [K in keyof Ref]: Ref[K] extends string[] ? K : never }[keyof Ref]
type GroupKey = { [K in keyof Ref]: Ref[K] extends Record<string, string[]> ? K : never }[keyof Ref]
type ObjKey = 'urgences' | 'circuits'

// [clé, titre, qui renseigne, type] — list : tableau de chaînes, obj : tableau {k,l,d}, group : objet de listes
const LISTS: ([ListKey, string, string, 'list'] | [ObjKey, string, string, 'obj'] | [GroupKey, string, string, 'group'])[] = [
  ['fonctions', "Fonction de l'auteur", 'Pré-remplie depuis le compte · modifiable', 'list'],
  ['urgences', "Niveau d'urgence", 'Établissement · requalifiable par la coordination', 'obj'],
  ['piecesLogement', 'Pièces du logement', 'Établissement · filtrées selon la typologie (T2 : sans chambre 2 · T4 : ajoute chambre 3)', 'list'],
  ['piecesAutres', 'Pièces : autres', 'Établissement', 'list'],
  ['lots', 'Lots de travaux et natures', "Établissement · liste en cascade, alignée si possible sur les lots de l'accord-cadre", 'group'],
  ['cles', 'Mise à disposition des clés', 'Établissement', 'list'],
  ['imputations', 'Imputation de la charge', 'Coordination · par ligne', 'list'],
  ['circuits', "Circuit d'exécution", 'Coordination · par ligne', 'obj'],
  ['natSinistre', 'Nature du sinistre', 'Établissement · suivi par la coordination et la gestion locative', 'list'],
  ['assureurs', 'Assureur concerné', 'Coordination', 'list'],
  ['motifsRenvoi', 'Motifs de renvoi (à compléter)', 'Coordination · obligatoire pour renvoyer', 'list'],
  ['motifsRejet', 'Motifs de rejet', 'Coordination · obligatoire pour rejeter', 'list'],
  ['contextes', "Constat d'état : contexte", 'Tout salarié', 'list'],
  ['signalements', 'Signalements du constat', 'Tout salarié · cases à cocher, plusieurs choix', 'group'],
  ['motifsAcces', 'Motifs « accès impossible »', 'Ouvrier sur place · photo obligatoire', 'list'],
]

interface Target { key: ListKey | GroupKey; group?: string }

const pick = (r: Ref, t: Target): string[] => t.group ? (r[t.key as GroupKey])[t.group] : r[t.key as ListKey]

function Chips({ arr, target, can }: { arr: string[]; target: Target; can: boolean }) {
  const { mutate, toast } = useApp()
  const del = (i: number) => {
    if (arr.length <= 1) return toast('La liste doit garder au moins une valeur', 'err')
    mutate(s => { pick(s.ref, target).splice(i, 1) }, { now: true })
  }
  return (
    <div className="reflist">
      {arr.map((v, i) => <span key={v} className="refitem">{v}{can && <button aria-label="Supprimer" onClick={() => del(i)}>×</button>}</span>)}
    </div>
  )
}

function Adder({ arr, target }: { arr: string[]; target: Target }) {
  const { mutate, toast } = useApp()
  const [v, setV] = useState('')
  const add = () => {
    const val = v.trim()
    if (!val) return
    if (arr.includes(val)) return toast('Valeur déjà présente', 'err')
    mutate(s => { pick(s.ref, target).push(val) }, { now: true })
    toast('Valeur ajoutée', 'ok')
    setV('')
  }
  return (
    <div className="row mt-2.5 flex-nowrap !gap-1.5">
      <input className="in sm" placeholder="Nouvelle valeur" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
      <button className="btn btn-sm" onClick={add}>Ajouter</button>
    </div>
  )
}

export function Referentiels() {
  const { S, mutate, toast, openModal, reset } = useApp()
  const ref = S.ref
  const can = S.profil !== 'etab'
  const s = ref.seuils

  const setSeuil = (k: keyof Ref['seuils'], v: string) => {
    mutate(st => { st.ref.seuils[k] = Math.max(0, Number(v) || 0) }, { now: true })
    toast('Seuil enregistré', 'ok')
  }
  const resetDemo = () => openModal({
    title: 'Réinitialiser la démo', danger: true, okLabel: 'Réinitialiser',
    body: <p className="m-0">Toutes les saisies (demandes, photos, plannings, constats, devis) seront remplacées par les données d'exemple.</p>,
    onOk() { reset(); location.hash = '#/demandes'; toast('Données de démo rechargées', 'ok') },
  })

  const section = ([k, t, who, type]: (typeof LISTS)[number]) => {
    let body = null
    if (type === 'list') body = <><Chips arr={ref[k]} target={{ key: k }} can={can} />{can && <Adder arr={ref[k]} target={{ key: k }} />}</>
    if (type === 'obj') body = (
      <>
        <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>{ref[k].map(o => <div key={o.k} className="s13"><strong>{o.l}</strong> <span className="muted">— {o.d}</span></div>)}</div>
        <p className="muted small mb-0 mt-2">Valeurs structurantes : modification par l'administrateur.</p>
      </>
    )
    if (type === 'group') body = Object.entries(ref[k]).map(([g, arr]) => (
      <details key={g} className="border-t border-line2 py-2">
        <summary className="cursor-pointer text-[13px] font-semibold">{g} <span className="muted font-normal">({arr.length})</span></summary>
        <div className="pt-2"><Chips arr={arr} target={{ key: k, group: g }} can={can} />{can && <Adder arr={arr} target={{ key: k, group: g }} />}</div>
      </details>
    ))
    return <section key={k} className="card pad"><h2 className="h2">{t}</h2><p className="muted small mb-3 mt-1">{who}</p>{body}</section>
  }

  return (
    <Layout active="referentiels">
      <div className="pagehead"><div><h1 className="mb-1">Menus déroulants de la fiche travaux</h1><p className="muted m-0">Listes administrables par la direction, sans développement. Chaque menu indique qui le renseigne.</p></div>
        <div className="row !gap-2"><button className="btn btnd" onClick={resetDemo}>Réinitialiser les données de démo</button></div></div>
      {!can && <div className="note mb-4">Lecture seule pour les établissements.</div>}
      <section className="card pad mb-4"><h2 className="h2">Seuils</h2><p className="muted small mb-3 mt-1">Règles internes d'achat et de travaux sur place (valeurs à définir par la direction).</p>
        <div className="grid-auto" style={{ '--min': '240px' } as React.CSSProperties}>
          <div><label className="lbl" htmlFor="s1">3 devis minimum au-delà de (€ HT)</label><input className="in" id="s1" type="number" min={0} defaultValue={s.troisDevis} disabled={!can} onBlur={e => setSeuil('troisDevis', e.target.value)} /></div>
          <div><label className="lbl" htmlFor="s2">Validation direction au-delà de (€ HT)</label><input className="in" id="s2" type="number" min={0} defaultValue={s.direction} disabled={!can} onBlur={e => setSeuil('direction', e.target.value)} /></div>
          <div><label className="lbl" htmlFor="s3">Travaux sur place sans validation jusqu'à (min)</label><input className="in" id="s3" type="number" min={0} step={15} defaultValue={s.supplementMin} disabled={!can} onBlur={e => setSeuil('supplementMin', e.target.value)} /></div>
        </div></section>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(380px,100%),1fr))' }}>
        {LISTS.map(section)}
        <section className="card pad"><h2 className="h2">Statuts</h2><p className="muted small mb-3 mt-1">Calculés par l'outil · visibles par tous</p>
          <div className="reflist">{Object.values(STAT).map(([l, c]) => <Chip key={l} tone={c}>{l}</Chip>)}</div></section>
        <section className="card pad"><h2 className="h2">Note de propreté</h2><p className="muted small mb-3 mt-1">De 0 à 6 · une note ≤ 2 alerte la coordination</p>
          <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>{ref.proprete.map((l, i) => <div key={l} className="s13"><strong className="inline-block w-5">{i}</strong>{l}</div>)}</div></section>
      </div>
    </Layout>
  )
}
