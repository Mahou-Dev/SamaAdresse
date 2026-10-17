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
const MyAddressesPage = lazy(() => import('./pages/MyAddressesPage').then(m => ({ default: m.MyAddressesPage })));
const NewAddressPage = lazy(() => import('./pages/NewAddressPage').then(m => ({ default: m.NewAddressPage })));
const EditAddressPage = lazy(() => import('./pages/EditAddressPage').then(m => ({ default: m.EditAddressPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage').then(m => ({ default: m.DirectoryPage })));

const RouteLoadingFallback = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
    <div className="h-8 bg-[#E6DDD0] rounded w-1/3" />
    <div className="h-32 bg-[#E6DDD0]/60 rounded-xl" />
  </div>
);

export function App() {
  return (
    <OnlineStatusProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#231A15]">
              <AppNavigation />
              <OfflineBanner />
              <main className="flex-1 flex flex-col">
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/annuaire" element={<DirectoryPage />} />
                    <Route path="/account" element={<AccountPage />} />
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
