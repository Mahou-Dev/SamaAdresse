import { Archive, SearchX, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicState } from '../hooks/usePublicAddress'

/** États communs des pages publiques : chargement, introuvable, archivée/suspendue (410), hors ligne, erreur. */
export function PublicStates({ state }: { state: Exclude<PublicState, { kind: 'ready' }> }) {
  if (state.kind === 'loading') return <p className="loading" role="status">Chargement de l’adresse…</p>
  if (state.kind === 'gone') {
    return (
      <section className="panel state">
        <Archive aria-hidden="true" />
        <h1>Adresse indisponible</h1>
        <p>Cette adresse a été archivée par son propriétaire ou suspendue par la modération. Sa fiche publique et son QR code sont désactivés.</p>
        <Link className="button button-primary" to="/recherche">Rechercher un autre code</Link>
      </section>
    )
  }
  if (state.kind === 'not-found') {
    return (
      <section className="panel state">
        <SearchX aria-hidden="true" />
        <h1>Adresse introuvable</h1>
        <p>Ce code ne correspond à aucune adresse active enregistrée dans SamaAdresse.</p>
        <Link className="button button-primary" to="/recherche">Rechercher un autre code</Link>
      </section>
    )
  }
  if (state.kind === 'offline') {
    return (
      <section className="panel state">
        <WifiOff aria-hidden="true" />
        <h1>Vous êtes hors ligne</h1>
        <p>Cette fiche n’a pas encore été consultée sur cet appareil : elle n’est pas disponible sans connexion. Les fiches déjà ouvertes restent consultables hors ligne.</p>
      </section>
    )
  }
  return <p className="alert alert--error" role="alert">Le service est momentanément indisponible. Réessayez plus tard.</p>
}
