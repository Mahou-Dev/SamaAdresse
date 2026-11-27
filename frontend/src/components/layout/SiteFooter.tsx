import { MapPin } from 'lucide-react'
import { Logo } from './Logo'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Logo tone="dark" />
          <p>Une adresse, un monde de possibilités.</p>
        </div>
        <p className="site-footer__tagline">L’innovation au service d’un meilleur accès aux lieux.</p>
        <p className="site-footer__place"><MapPin aria-hidden="true" /> Sénégal</p>
      </div>
    </footer>
  )
}
