import { useSyncExternalStore } from 'react'
import { getModal, subscribeModal } from '@/store/local/modal'
import type { ModalSpec } from '@/store/types'

/** Modale actuellement ouverte (ou `null`). */
export const useModal = (): ModalSpec | null => useSyncExternalStore(subscribeModal, getModal, getModal)
