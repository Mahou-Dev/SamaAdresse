import { TriangleAlert } from 'lucide-react'
import { isLocalOnlyUrl } from '../lib/publicUrl'

/**
 * Prévient quand un lien (ou le QR code qui le contient) pointe vers « localhost » : il ne
 * s'ouvrira que sur cet ordinateur, jamais sur le téléphone qui le scanne ou reçoit le SMS.
 */
export function LocalLinkWarning({ url, className = '' }: { url: string; className?: string }) {
  if (!isLocalOnlyUrl(url)) return null
  return (
    <p className={`alert alert--warning ${className}`.trim()} role="note">
      <TriangleAlert aria-hidden="true" className="inline-icon" /> Lien de test : il pointe vers « {new URL(url).host} »
      et ne s’ouvrira que sur cet ordinateur, pas sur un téléphone. En production, le lien utilise le vrai nom de domaine
      du site (réglage VITE_PUBLIC_APP_URL côté site, APP_PUBLIC_BASE_URL côté serveur pour les SMS).
    </p>
  )
}
