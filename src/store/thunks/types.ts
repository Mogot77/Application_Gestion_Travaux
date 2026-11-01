import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store/reducers'

export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>
