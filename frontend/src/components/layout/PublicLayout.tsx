import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import { OfflineBanner } from '../OfflineBanner'
import { Logo } from './Logo'
import { SiteFooter } from './SiteFooter'

/** Site public. Sur l'accueil, l'en-tête est posé en transparence sur le visuel sombre. */
export function PublicLayout() {
  const { status } = useAuth()
  const { pathname } = useLocation()
  const overlay = pathname === '/'
  return (
    <div className="public-shell">
      <header className={overlay ? 'public-header public-header--overlay' : 'public-header'}>
        <div className="public-header__inner">
          <Logo tone="dark" />
          <nav className="public-nav" aria-label="Navigation principale">
            <a href="/#fonctionnement">Comment ça marche</a>
            <NavLink to="/recherche">Annuaire</NavLink>
            <NavLink to="/carte">Carte</NavLink>
          </nav>
          {status === 'authenticated' ? (
            <Link className="button button-primary button-sm" to="/tableau-de-bord">Mon espace</Link>
          ) : (
            <div className="public-header__actions">
              <Link className="public-header__login" to="/connexion">Se connecter</Link>
              <Link className="button button-primary button-sm" to="/inscription">Créer un compte</Link>
            </div>
          )}
        </div>
      </header>
      <OfflineBanner />
      <Outlet />
      <SiteFooter />
    </div>
  )
}
