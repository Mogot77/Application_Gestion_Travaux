import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Pas de <StrictMode> : en développement il monte chaque effet deux fois, ce qui ouvre deux fois les écouteurs Firestore
// (lectures facturées en double) et démarre deux synchronisations concurrentes. Le comportement doit rester identique à la production.
createRoot(document.getElementById('root') as HTMLElement).render(<App />)
