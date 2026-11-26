import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppNavigation } from './components/AppNavigation';
import { AppFooter } from './components/AppFooter';
import { OfflineBanner } from './components/OfflineBanner';
import { ReloadPrompt } from './components/ReloadPrompt';
import { ErrorBoundary } from './app/boundaries/ErrorBoundary';

// Lazy loading des routes secondaires et volumineuses (Partie 0.7, P03 & P04)
const initialPathname = typeof window !== 'undefined' ? window.location.pathname : '';
const loginPreload = initialPathname === '/login' ? import('./pages/LoginPage') : null;
const registerPreload = initialPathname === '/register' ? import('./pages/RegisterPage') : null;
const publicAddressPreload = initialPathname.startsWith('/a/') ? import('./pages/PublicAddressPage') : null;
const myAddressesPreload = initialPathname.startsWith('/addresses/mine') ? import('./pages/MyAddressesPage') : null;
const newAddressPreload = initialPathname.startsWith('/addresses/new') ? import('./pages/NewAddressPage') : null;
const directoryPreload = initialPathname.startsWith('/annuaire') ? import('./pages/DirectoryPage') : null;
const dashboardPreload = initialPathname.startsWith('/tableau-de-bord') ? import('./pages/DashboardPage') : null;

const LoginPage = lazy(() => (loginPreload ?? import('./pages/LoginPage')).then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => (registerPreload ?? import('./pages/RegisterPage')).then(m => ({ default: m.RegisterPage })));
const PublicAddressPage = lazy(() => (publicAddressPreload ?? import('./pages/PublicAddressPage')).then(m => ({ default: m.PublicAddressPage })));
const DashboardPage = lazy(() => (dashboardPreload ?? import('./pages/DashboardPage')).then(m => ({ default: m.DashboardPage })));
const MyAddressesPage = lazy(() => (myAddressesPreload ?? import('./pages/MyAddressesPage')).then(m => ({ default: m.MyAddressesPage })));
const NewAddressPage = lazy(() => (newAddressPreload ?? import('./pages/NewAddressPage')).then(m => ({ default: m.NewAddressPage })));
const EditAddressPage = lazy(() => import('./pages/EditAddressPage').then(m => ({ default: m.EditAddressPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const DirectoryPage = lazy(() => (directoryPreload ?? import('./pages/DirectoryPage')).then(m => ({ default: m.DirectoryPage })));

const RouteLoadingFallback = () => (
  <div
    className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-[720px] animate-pulse"
    aria-label="Chargement de la page"
  >
    <div className="h-9 bg-surface-hover rounded-xl w-1/3" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div className="h-64 bg-surface border border-border rounded-2xl" />
      <div className="h-64 bg-surface border border-border rounded-2xl" />
      <div className="h-64 bg-surface border border-border rounded-2xl" />
    </div>
  </div>
);

export function App() {
  return (
    <OnlineStatusProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-canvas text-ink">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-tooltip)] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-institution focus:text-ink-inverse focus:text-sm focus:font-semibold focus:shadow-lg"
              >
                Aller au contenu principal
              </a>
              <AppNavigation />
              <OfflineBanner />
              <main id="main-content" className="flex-1 flex flex-col">
                <ErrorBoundary>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/annuaire" element={<DirectoryPage />} />
                    <Route
                      path="/tableau-de-bord"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/a/:code" element={<PublicAddressPage />} />
                    <Route
                      path="/addresses/new"
                      element={
                        <ProtectedRoute>
                          <NewAddressPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/addresses/mine"
                      element={
                        <ProtectedRoute>
                          <MyAddressesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/addresses/:id/edit"
                      element={
                        <ProtectedRoute>
                          <EditAddressPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </main>
              <AppFooter />
              <ReloadPrompt />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </OnlineStatusProvider>
  );
}

export default App;
