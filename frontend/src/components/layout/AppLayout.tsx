import {
  CirclePlus, LayoutDashboard, LogOut, Map, MapPinned, Menu, Plus, Search, Settings, ShieldCheck, X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import { initials } from '../../lib/labels'
import { OfflineBanner } from '../OfflineBanner'
import { Logo } from './Logo'

const NAV = [
  { to: '/tableau-de-bord', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/mes-adresses', label: 'Mes adresses', icon: MapPinned, end: true },
  { to: '/mes-adresses/nouvelle', label: 'Créer une adresse', icon: CirclePlus, end: true },
  { to: '/recherche', label: 'Rechercher', icon: Search, end: false },
  { to: '/carte', label: 'Carte', icon: Map, end: true },
  { to: '/compte', label: 'Paramètres', icon: Settings, end: true },
]

const TABS = [
  { to: '/tableau-de-bord', label: 'Accueil', icon: LayoutDashboard },
  { to: '/mes-adresses', label: 'Adresses', icon: MapPinned, end: true },
  { to: '/mes-adresses/nouvelle', label: 'Créer', icon: Plus, primary: true },
  { to: '/carte', label: 'Carte', icon: Map },
  { to: '/compte', label: 'Profil', icon: Settings },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = query.trim()
    navigate(code ? `/recherche?code=${encodeURIComponent(code)}` : '/recherche')
    setQuery('')
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'app-sidebar app-sidebar--open' : 'app-sidebar'} id="app-navigation">
        <div className="app-sidebar__top">
          <Logo tone="dark" to="/tableau-de-bord" />
          <button className="icon-button app-sidebar__close" type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X /></button>
        </div>
        <nav className="app-nav" aria-label="Navigation de l’espace personnel">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="app-nav__link"><Icon aria-hidden="true" />{label}</NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className="app-nav__link app-nav__link--admin"><ShieldCheck aria-hidden="true" />Administration</NavLink>
          )}
        </nav>
        <div className="app-sidebar__user">
          <span className="avatar" aria-hidden="true">{initials(user?.displayName ?? '')}</span>
          <span className="app-sidebar__identity">
            <strong>{user?.displayName}</strong>
            <small>{user?.role === 'ADMIN' ? 'Administrateur' : 'Propriétaire'}</small>
          </span>
          <button className="icon-button" type="button" onClick={() => void handleLogout()} aria-label="Se déconnecter" title="Se déconnecter"><LogOut /></button>
        </div>
      </aside>
      {menuOpen && <button className="app-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        <header className="app-topbar">
          <button className="icon-button app-topbar__menu" type="button" onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu" aria-expanded={menuOpen} aria-controls="app-navigation"><Menu /></button>
          <form className="app-topbar__search" role="search" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="topbar-search">Rechercher un code d’adresse</label>
            <Search aria-hidden="true" />
            <input id="topbar-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un code, ex. ZIG-KBG-4271" autoComplete="off" />
          </form>
          <span className="avatar avatar--sm app-topbar__avatar" title={user?.email} aria-hidden="true">{initials(user?.displayName ?? '')}</span>
        </header>
        <OfflineBanner />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
      <nav className="app-tabbar" aria-label="Raccourcis">
        {TABS.map(({ to, label, icon: Icon, end, primary }) => (
          <NavLink key={to} to={to} end={end} className={primary ? 'app-tabbar__link app-tabbar__link--primary' : 'app-tabbar__link'}>
            <span className="app-tabbar__icon"><Icon aria-hidden="true" /></span>{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
