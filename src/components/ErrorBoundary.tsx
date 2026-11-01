import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AppContext } from '../store/context'

interface State { error: Error | null }

/** Filet de sécurité : un écran défaillant n'emporte pas toute l'application. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  static contextType = AppContext
  declare context: React.ContextType<typeof AppContext>
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State { return { error } }
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
            <button className="btn btnd" onClick={() => { this.context?.reset(); this.setState({ error: null }); location.hash = '#/demandes' }}>Réinitialiser les données de démo</button>
          </div>
        </div>
      </main>
    )
  }
}
