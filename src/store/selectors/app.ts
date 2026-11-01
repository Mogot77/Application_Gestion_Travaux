import type { RootState } from '@/store/reducers'

export const selectApp = (s: RootState) => s.app
export const selectRef = (s: RootState) => s.app.ref
