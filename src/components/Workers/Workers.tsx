import type { Ouvrier } from '@/types'
import { useApp } from '@/hooks/useApp'
import { useUiState } from '@/hooks/useUiState'
import Layout from '@/components/Layout'
import { getOuv } from '@/helpers/domain'
import { COLORS } from './constants'
import { buildWorkersModel, metiersOf, stats } from './helpers'
import WorkerForm from './WorkerForm'
import WorkersView from './WorkersView'
import type { WorkersUi } from './types'

const Workers = () => {
  const { S, mutate, getS, toast, openModal } = useApp()
  const [ui, setUi] = useUiState<WorkersUi>('ouv', { q: '', inactifs: false })

  const openForm = (o: Ouvrier | null) => openModal({
    title: o ? `Modifier ${o.nom}` : 'Nouvel ouvrier', okLabel: o ? 'Enregistrer' : 'Créer',
    body: <WorkerForm o={o || {}} metiers={metiersOf(S)} defaultColor={COLORS[S.ouvriers.length % COLORS.length]} />,
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
      <WorkersView
        model={buildWorkersModel(S, ui)} q={ui.q} showInactive={ui.inactifs}
        onQuery={q => setUi({ q })} onShowInactive={inactifs => setUi({ inactifs })}
        onCreate={() => openForm(null)} onEdit={openForm} onToggle={toggle} onDelete={del}
      />
    </Layout>
  )
}

export default Workers
