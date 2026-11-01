import { Component, type ErrorInfo } from 'react'
import { ReactReduxContext } from 'react-redux'
import { resetDemo } from '@/store/appSlice'
import type { AppDispatch } from '@/store'
import type { ErrorBoundaryProps, ErrorBoundaryState } from './types'

/** Filet de sécurité : un écran défaillant n'emporte pas toute l'application. */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ReactReduxContext
  declare context: React.ContextType<typeof ReactReduxContext>
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info.componentStack) }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="main mx-auto max-w-[1440px] p-6">
        <div className="card pad">
          <h1>Erreur d'affichage</h1>
          <p className="muted">{this.state.error.message}</p>
          <div className="row">
            <button className="btn" onClick={() => { this.setState({ error: null }); location.hash = '#/demandes' }}>Retour aux demandes</button>
            <button className="btn btnd" onClick={() => { (this.context?.store.dispatch as AppDispatch | undefined)?.(resetDemo()); this.setState({ error: null }); location.hash = '#/demandes' }}>Réinitialiser les données de démo</button>
          </div>
        </div>
      </main>
    )
  }
}

export default ErrorBoundary
