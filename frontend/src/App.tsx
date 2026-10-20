import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicAddressPage } from './pages/PublicAddressPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AppNavigation } from './components/AppNavigation';
import { AppFooter } from './components/AppFooter';
import { OfflineBanner } from './components/OfflineBanner';
import { ReloadPrompt } from './components/ReloadPrompt';

// Lazy loading des routes secondaires et volumineuses (Partie 0.7)
const initialPathname = typeof window !== 'undefined' ? window.location.pathname : '';
const myAddressesPreload = initialPathname.startsWith('/addresses/mine') ? import('./pages/MyAddressesPage') : null;
const newAddressPreload = initialPathname.startsWith('/addresses/new') ? import('./pages/NewAddressPage') : null;
const directoryPreload = initialPathname.startsWith('/annuaire') ? import('./pages/DirectoryPage') : null;
const dashboardPreload = initialPathname.startsWith('/tableau-de-bord') ? import('./pages/DashboardPage') : null;

const DashboardPage = lazy(() => (dashboardPreload ?? import('./pages/DashboardPage')).then(m => ({ default: m.DashboardPage })));
const MyAddressesPage = lazy(() => (myAddressesPreload ?? import('./pages/MyAddressesPage')).then(m => ({ default: m.MyAddressesPage })));
const NewAddressPage = lazy(() => (newAddressPreload ?? import('./pages/NewAddressPage')).then(m => ({ default: m.NewAddressPage })));
const EditAddressPage = lazy(() => import('./pages/EditAddressPage').then(m => ({ default: m.EditAddressPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const DirectoryPage = lazy(() => (directoryPreload ?? import('./pages/DirectoryPage')).then(m => ({ default: m.DirectoryPage })));

const RouteLoadingFallback = () => (
  <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-h-[1100px] animate-pulse">
    <div className="h-9 bg-[#E6DDD0] rounded-lg w-1/3" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-28 bg-[#FBF7EF] border border-[#766B5B] rounded-xl" />
      <div className="h-28 bg-[#FBF7EF] border border-[#766B5B] rounded-xl" />
      <div className="h-28 bg-[#FBF7EF] border border-[#766B5B] rounded-xl" />
      <div className="h-28 bg-[#FBF7EF] border border-[#766B5B] rounded-xl" />
    </div>
    <div className="h-44 bg-[#FBF7EF] border border-[#766B5B] rounded-xl" />
    <div className="h-96 bg-[#FBF7EF] border border-[#766B5B] rounded-xl" />
  </div>
);

export function App() {
  return (
    <OnlineStatusProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#EADFC8] text-[#231A15]">
              <AppNavigation />
              <OfflineBanner />
              <main className="flex-1 flex flex-col">
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
