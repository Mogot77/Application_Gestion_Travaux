import { combineReducers } from '@reduxjs/toolkit'
import app from './appReducer'
import ui from './uiReducer'

export const rootReducer = combineReducers({ app, ui })

export type RootState = ReturnType<typeof rootReducer>

export * from './appReducer'
export * from './uiReducer'
