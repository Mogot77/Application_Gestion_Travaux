import { useEffect, useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import Modal from '@/components/Modal'
import Toasts from '@/components/ui/Toasts'
import { createAppStore } from './index'
import { startEffects } from './effects'
import { useAppSelector } from '@/hooks/useAppStore'
import { useModal } from '@/hooks/useModal'
import { closeModal } from '@/helpers/modal'

/** Affiche les données une fois chargées, plus la modale et les messages. */
const Shell = ({ children }: { children: ReactNode }) => {
  const ready = useAppSelector(s => s.ui.ready)
  const syncFailed = useAppSelector(s => s.ui.syncFailed)
  const toasts = useAppSelector(s => s.ui.toasts)
  const modal = useModal()
  return (
    <>
      {ready ? children : (
        <p className="p-6 text-sm text-[#6b7280]">
          {syncFailed ? "Impossible de joindre la base de données. Vérifiez votre connexion puis rechargez la page." : 'Chargement des données…'}
        </p>
      )}
      {modal && <Modal spec={modal} onClose={closeModal} />}
      <Toasts items={toasts} />
    </>
  )
}

/** Fournit le store Redux (un par session connectée) et démarre ses effets (cache local, Firestore, photos). */
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [{ store, listener }] = useState(createAppStore)
  useEffect(() => startEffects(store, listener), [store, listener])
  return <Provider store={store}><Shell>{children}</Shell></Provider>
}
