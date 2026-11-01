import { useEffect, useState, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import Modal from '@/components/Modal'
import Toasts from '@/components/ui/Toasts'
import { createAppStore } from '@/store'
import { startEffects } from '@/store/listeners'
import { selectReady, selectSyncFailed, selectToasts } from '@/store/selectors'
import { useAppSelector } from '@/hooks/useAppStore'
import { useModal } from '@/hooks/useModal'
import { closeModal } from '@/store/local/modal'

/** Affiche les données une fois chargées, plus la modale et les messages. */
const Shell = ({ children }: { children: ReactNode }) => {
  const ready = useAppSelector(selectReady)
  const syncFailed = useAppSelector(selectSyncFailed)
  const toasts = useAppSelector(selectToasts)
  const modal = useModal()
  return (
    <>
      {ready ? children : (
        <p className="p-6 text-sm text-muted">
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
