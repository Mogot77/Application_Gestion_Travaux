import { useSyncExternalStore } from 'react'
import { getModal, subscribeModal } from '@/helpers/modal'
import type { ModalSpec } from '@/store/context'

/** Modale actuellement ouverte (ou `null`). */
export const useModal = (): ModalSpec | null => useSyncExternalStore(subscribeModal, getModal, getModal)
