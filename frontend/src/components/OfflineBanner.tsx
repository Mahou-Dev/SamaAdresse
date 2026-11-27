import { WifiOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'

/** Bandeau affiché tant que l'appareil est hors ligne. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <p className="offline-strip" role="status">
      <WifiOff aria-hidden="true" />Hors ligne : les fiches déjà consultées restent disponibles ; les nouvelles adresses sont gardées sur l’appareil jusqu’au retour du réseau.
    </p>
  )
}
