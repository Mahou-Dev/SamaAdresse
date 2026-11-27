import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker (mode hors ligne, PWA installable) : seulement dans la version construite,
// pour ne pas interférer avec le rechargement à chaud du serveur de développement.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Navigateur sans Service Worker ou contexte non sécurisé : l'application reste utilisable en ligne.
    })
  })
}
