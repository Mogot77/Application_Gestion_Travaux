import { useState } from 'react'
import type { Ouvrier } from '@/types'
import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Note from '@/components/ui/Note'
import Field from '@/components/ui/Field'
import { getOuv, ouvActifs, shortLot } from '@/helpers/domain'
import { fdur, initials } from '@/helpers/dates'
import { COLORS } from './constants'
import { stats } from './helpers'
import type { ColorPickerProps, WorkerFormProps } from './types'
import SearchBox from '@/components/ui/SearchBox'
import PageHead from '@/components/ui/PageHead'

const ColorPicker = ({ initial }: ColorPickerProps) => {
  const [color, setColor] = useState(initial)
  return (
    <div className="row !gap-2">
      {COLORS.map(c => (
        <label key={c} className="cursor-pointer">
          <input type="radio" name="color" value={c} checked={c === color} onChange={() => setColor(c)} className="absolute opacity-0" />
          <span className="av !size-7" style={{ background: c, outline: c === color ? '3px solid #111827' : 'none', outlineOffset: 2 }}></span>
        </label>
      ))}
    </div>
  )
}

const WorkerForm = ({ S, o }: WorkerFormProps) => {
  const metiers = [...new Set([...S.ouvriers.map(x => x.metier), ...Object.keys(S.ref.lots).map(shortLot)])].filter(Boolean)
  return (
    <>
      <Field label="Nom affiché (obligatoire)" htmlFor="on"><input className="in" id="on" name="nom" defaultValue={o.nom || ''} placeholder="ex. Karim B." required /></Field>
      <Field label="Métier / spécialité" htmlFor="om"><input className="in" id="om" name="metier" list="om-list" defaultValue={o.metier || ''} placeholder="ex. Plomberie" />
        <datalist id="om-list">{metiers.map(m => <option key={m} value={m} />)}</datalist></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Téléphone" htmlFor="ot"><input className="in" id="ot" name="tel" type="tel" defaultValue={o.tel || ''} placeholder="06 ·· ·· ·· ··" /></Field>
        <Field label="E-mail (agenda Outlook)" htmlFor="oe"><input className="in" id="oe" name="email" type="email" defaultValue={o.email || ''} placeholder="prenom.nom@equalis.fr" /></Field>
      </div>
      <div><span className="lbl">Couleur sur le planning et la carte</span><ColorPicker initial={o.color || COLORS[S.ouvriers.length % COLORS.length]} /></div>
    </>
  )
}

const Workers = () => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const [ui, setUi] = useUiState<{ q: string; inactifs: boolean }>('ouv', { q: '', inactifs: false })
  const q = ui.q.toLowerCase()
  const list = S.ouvriers.filter(o => (ui.inactifs || o.actif !== false) && (!q || `${o.nom} ${o.metier} ${o.tel || ''} ${o.email || ''}`.toLowerCase().includes(q)))
  const nInactifs = S.ouvriers.filter(o => o.actif === false).length
  const can = S.profil !== 'etab'
  const actifs = ouvActifs(S)

  const openForm = (o: Ouvrier | null) => openModal({
    title: o ? `Modifier ${o.nom}` : 'Nouvel ouvrier', okLabel: o ? 'Enregistrer' : 'Créer',
    body: <WorkerForm S={S} o={o || {}} />,
    onOk(fd) {
      const cur = getS()
      const nom = String(fd.get('nom') || '').trim()
      if (!nom) { toast('Le nom est obligatoire', 'err'); return false }
      if (cur.ouvriers.some(x => x.nom.toLowerCase() === nom.toLowerCase() && (!o || x.id !== o.id))) { toast('Un ouvrier porte déjà ce nom', 'err'); return false }
      const email = String(fd.get('email') || '').trim()
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('E-mail invalide', 'err'); return false }
      const data = { nom, metier: String(fd.get('metier') || '').trim(), tel: String(fd.get('tel') || '').trim(), email, color: String(fd.get('color') || COLORS[0]) }
      mutate(s => {
        if (!o) s.ouvriers.push({ id: 'o' + Date.now().toString(36), actif: true, ...data })
        else { const t = getOuv(s, o.id); if (t) Object.assign(t, data) }
      }, { now: true })
      toast(o ? 'Modifications enregistrées' : `${nom} ajouté`, 'ok')
    },
  })

  const toggle = (o: Ouvrier) => {
    if (o.actif !== false) {
      const s = stats(S, o)
      if (s.avenir) return toast(`${o.nom} a ${s.avenir} rendez-vous à venir : déplacez-les d'abord dans le planning`, 'err')
      mutate(st => {
        const t = getOuv(st, o.id); if (t) t.actif = false
      }, { now: true })
      toast(`${o.nom} désactivé`)
    } else {
      mutate(st => { const t = getOuv(st, o.id); if (t) t.actif = true }, { now: true })
      toast(`${o.nom} réactivé`, 'ok')
    }
  }
  const del = (o: Ouvrier) => {
    const s = stats(S, o)
    if (s.total) return toast(`${o.nom} a ${s.total} rendez-vous dans l'historique : utilisez « Désactiver »`, 'err')
    openModal({
      title: `Supprimer ${o.nom}`, okLabel: 'Supprimer définitivement', danger: true,
      body: <p className="m-0">{o.nom} sera retiré de la liste des ouvriers. Cette action est définitive.</p>,
      onOk() {
        mutate(st => {
          st.ouvriers = st.ouvriers.filter(x => x.id !== o.id)
        }, { now: true })
        toast(`${o.nom} supprimé`)
      },
    })
  }

  return (
    <Layout active="ouvriers">
      <PageHead
        title="Ouvriers du service technique"
        subtitle={<>{actifs.length} actif{actifs.length > 1 ? 's' : ''}{nInactifs ? ` · ${nInactifs} désactivé${nInactifs > 1 ? 's' : ''}` : ''}. Les ouvriers actifs apparaissent dans le planning et la carte des tournées.</>}
      >
        {can && <Button variant="primary" onClick={() => openForm(null)}>+ Nouvel ouvrier</Button>}
      </PageHead>
      {!can && <Note className="mb-4">Lecture seule pour les établissements.</Note>}
      <div className="row mb-4 !gap-2.5">
        <SearchBox className="w-full sm:w-[280px]" value={ui.q} placeholder="Nom, métier, téléphone…" onChange={q => setUi({ q })} />
        {nInactifs > 0 && <label className="row s13 !gap-1.5"><input type="checkbox" checked={ui.inactifs} onChange={e => setUi({ inactifs: e.target.checked })} /> Afficher les ouvriers désactivés</label>}
      </div>
      <Card className="tbl-wrap">
        <table className="t min-w-[900px]">
          <thead><tr><th></th><th>Nom</th><th>Métier</th><th>Téléphone</th><th>E-mail</th><th>Cette semaine</th><th>À venir</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {list.map(o => {
              const s = stats(S, o); const off = o.actif === false
              return (
                <tr key={o.id} className={off ? 'opacity-60' : ''}>
                  <td className="w-11"><i className="av" style={{ background: o.color }}>{initials(o.nom)}</i></td>
                  <td><strong>{o.nom}</strong></td>
                  <td>{o.metier || '—'}</td>
                  <td>{o.tel || '—'}</td>
                  <td>{o.email ? o.email : <span className="muted">—</span>}</td>
                  <td>{fdur(s.week)} / 35 h</td>
                  <td>{s.avenir} rdv</td>
                  <td>{off ? <Chip>Désactivé</Chip> : <Chip tone="ok">Actif</Chip>}</td>
                  <td className="whitespace-nowrap text-right">
                    {can && (
                      <>
                        <Button size="sm" onClick={() => openForm(o)}>Modifier</Button>{' '}
                        <Button size="sm" onClick={() => toggle(o)}>{off ? 'Réactiver' : 'Désactiver'}</Button>{' '}
                        <Button size="sm" variant="danger" onClick={() => del(o)}>Supprimer</Button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {!list.length && <tr><td colSpan={9} className="empty">{S.ouvriers.length ? 'Aucun ouvrier ne correspond.' : 'Aucun ouvrier. Cliquez sur « + Nouvel ouvrier » pour commencer.'}</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="muted small mt-3">Un ouvrier qui a déjà des rendez-vous ne peut pas être supprimé (son historique et ses rapports restent liés) : désactivez-le. Un ouvrier avec des rendez-vous à venir doit d'abord être remplacé sur le planning.</p>
    </Layout>
  )
}

export default Workers
