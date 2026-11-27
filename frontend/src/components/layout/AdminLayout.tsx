import { ArrowLeft, Flag, LayoutDashboard, ListChecks, LogOut, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import { listReports } from '../../lib/api'
import { initials } from '../../lib/labels'
import type { AdminOutletContext } from '../../pages/admin/adminData'
import { Logo } from './Logo'

/** Console d'administration sombre. L'accès réel est contrôlé par le backend (ROLE_ADMIN). */
export function AdminLayout() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [reportCount, setReportCount] = useState<number | null>(null)
  const [version, setVersion] = useState(0)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!token || !isAdmin) return
    let cancelled = false
    listReports(token, 'OPEN', 0, 1)
      .then((page) => {
        if (!cancelled) setReportCount(page.totalElements)
      })
      .catch(() => { if (!cancelled) setReportCount(null) })
    return () => { cancelled = true }
  }, [token, isAdmin, version])

  const refreshPending = useCallback(() => setVersion((v) => v + 1), [])
  const context: AdminOutletContext = { openReportsCount: reportCount, refreshPending }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Logo tone="dark" to="/admin" suffix="Admin" />
        <nav className="admin-nav" aria-label="Navigation d’administration">
          <NavLink to="/admin" end className="admin-nav__link"><LayoutDashboard aria-hidden="true" />Tableau de bord</NavLink>
          <NavLink to="/admin/signalements" className="admin-nav__link">
            <Flag aria-hidden="true" />Signalements
            {reportCount !== null && reportCount > 0 && <span className="admin-nav__badge" aria-label={`${reportCount} signalements ouverts`}>{reportCount}</span>}
          </NavLink>
          <NavLink to="/admin/adresses" className="admin-nav__link"><ListChecks aria-hidden="true" />Adresses</NavLink>
          <NavLink to="/admin/utilisateurs" className="admin-nav__link"><Users aria-hidden="true" />Utilisateurs</NavLink>
          <NavLink to="/tableau-de-bord" className="admin-nav__link admin-nav__link--back"><ArrowLeft aria-hidden="true" />Mon espace</NavLink>
        </nav>
        <p className="admin-sidebar__note">Actions de modération tracées en base (`admin_actions`).</p>
        <div className="admin-sidebar__user">
          <span className="avatar" aria-hidden="true">{initials(user?.displayName ?? '')}</span>
          <span><strong>{user?.displayName}</strong><small>{isAdmin ? 'Administrateur' : 'Propriétaire'}</small></span>
          <button className="icon-button" type="button" onClick={() => void handleLogout()} aria-label="Se déconnecter"><LogOut /></button>
        </div>
      </aside>
      <div className="admin-main"><Outlet context={context} /></div>
    </div>
  )
}
