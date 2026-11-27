import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import './styles/components.css'
import './styles/public.css'
import './styles/app.css'
import './styles/admin.css'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AdaptiveLayout } from './components/layout/AdaptiveLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { AppLayout } from './components/layout/AppLayout'
import { PublicLayout } from './components/layout/PublicLayout'
import { AccountPage } from './pages/AccountPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyAddressesPage } from './pages/MyAddressesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { SearchPage } from './pages/SearchPage'

// Pages avec carte Leaflet ou QR code : chargées à la demande pour alléger l'accueil.
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })))
const AdminAddressesPage = lazy(() => import('./pages/admin/AdminAddressesPage').then((m) => ({ default: m.AdminAddressesPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const MapPage = lazy(() => import('./pages/MapPage').then((m) => ({ default: m.MapPage })))
const MyAddressDetailPage = lazy(() => import('./pages/MyAddressDetailPage').then((m) => ({ default: m.MyAddressDetailPage })))
const NewAddressPage = lazy(() => import('./pages/NewAddressPage').then((m) => ({ default: m.NewAddressPage })))
const PublicAddressPage = lazy(() => import('./pages/PublicAddressPage').then((m) => ({ default: m.PublicAddressPage })))
const SharePage = lazy(() => import('./pages/SharePage').then((m) => ({ default: m.SharePage })))

function LegacyEditRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/mes-adresses/${encodeURIComponent(id)}` : '/mes-adresses'} replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<p className="loading page-fallback" role="status">Chargement…</p>}>
          <Routes>
            {/* Site public + redirections de compatibilité des anciennes URL */}
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="connexion" element={<LoginPage />} />
              <Route path="inscription" element={<RegisterPage />} />
              <Route path="login" element={<Navigate to="/connexion" replace />} />
              <Route path="register" element={<Navigate to="/inscription" replace />} />
              <Route path="annuaire" element={<Navigate to="/recherche" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Pages publiques affichées dans l'espace personnel quand on est connecté */}
            <Route element={<AdaptiveLayout />}>
              <Route path="recherche" element={<SearchPage />} />
              <Route path="carte" element={<MapPage />} />
              <Route path="a/:code" element={<PublicAddressPage />} />
              <Route path="a/:code/partage" element={<SharePage />} />
            </Route>

            {/* Espace personnel (la protection réelle est assurée par le backend JWT) */}
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="tableau-de-bord" element={<DashboardPage />} />
              <Route path="mes-adresses" element={<MyAddressesPage />} />
              <Route path="mes-adresses/nouvelle" element={<NewAddressPage />} />
              <Route path="mes-adresses/:id" element={<MyAddressDetailPage />} />
              <Route path="compte" element={<AccountPage />} />
              {/* Alias de compatibilité avec les anciens liens / raccourcis PWA */}
              <Route path="addresses/mine" element={<Navigate to="/mes-adresses" replace />} />
              <Route path="addresses/new" element={<Navigate to="/mes-adresses/nouvelle" replace />} />
              <Route path="addresses/:id/edit" element={<LegacyEditRedirect />} />
              <Route path="account" element={<Navigate to="/compte" replace />} />
            </Route>

            {/* Administration (rôle ADMIN vérifié par le backend /api/admin/**) */}
            <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route path="admin" element={<Outlet />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="signalements" element={<AdminReportsPage />} />
                <Route path="moderation" element={<Navigate to="/admin/signalements" replace />} />
                <Route path="adresses" element={<AdminAddressesPage />} />
                <Route path="utilisateurs" element={<AdminUsersPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
