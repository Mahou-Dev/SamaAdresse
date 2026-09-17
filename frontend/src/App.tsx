import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { customFetch } from './api/apiClient';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Layout,
  UserCheck,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Phone,
  Mail,
  User as UserIcon,
} from 'lucide-react';

function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const data = await customFetch<{ status: string }>('/api/health');
      setHealthStatus(data.status);
    } catch (err: any) {
      setHealthError(err.message || 'Erreur de connexion');
      setHealthStatus(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Déconnexion effectuée avec succès.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Senegal gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 z-50" />

      {/* Header Bar */}
      <header className="max-w-5xl mx-auto w-full pt-4 pb-6 flex items-center justify-between gap-4 border-b border-slate-900">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold group-hover:border-emerald-500/50 transition">
            🇸🇳
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-100 tracking-tight block">SamaAdresse</span>
            <span className="text-[11px] text-slate-500 block leading-none">Mon Adresse Géolocalisée</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-200">{user.fullName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400">
                  <Shield className="w-3 h-3" />
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Connexion</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-950/40"
              >
                <UserPlus className="w-4 h-4" />
                <span>Inscription</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full py-8 flex-1 flex flex-col justify-center">
        {/* Banner */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sénégal 🇸🇳 — Plateforme Nationale d'Adressage
        </div>

        <div className="mb-10 space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            SamaAdresse — Mon Adresse
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl">
            Génération et gestion d'adresses géolocalisées intelligentes pour les proprietaires et citoyens du Sénégal.
          </p>
        </div>

        {/* Authenticated User Session Card */}
        {isAuthenticated && user && (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-emerald-500/30 shadow-2xl backdrop-blur-md mb-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Session Utilisateur Active</h2>
                <p className="text-xs text-slate-400">Access Token conservé uniquement en mémoire React (Secured)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-500 font-semibold block mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> Nom complet
                </span>
                <span className="text-sm font-bold text-slate-200">{user.fullName}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-500 font-semibold block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Email
                </span>
                <span className="text-sm font-bold text-slate-200 truncate block">{user.email}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-500 font-semibold block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-red-400" /> Téléphone
                </span>
                <span className="text-sm font-bold text-slate-200">{user.phoneNumber}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-500 font-semibold block mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Rôle Utilisateur
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Healthcheck Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Statut du Backend API</h2>
                <p className="text-sm text-slate-400">Test de connexion vers GET /api/health</p>
              </div>
            </div>

            <button
              onClick={fetchHealthStatus}
              disabled={loadingHealth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-sm font-medium text-slate-200 border border-slate-700/60 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-emerald-400' : ''}`} />
              {loadingHealth ? 'Vérification...' : 'Actualiser'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-sm font-semibold text-slate-300">Endpoint: /api/health</span>

            {loadingHealth ? (
              <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Chargement...
              </span>
            ) : healthStatus === 'UP' ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                STATUS : UP
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm">
                <XCircle className="w-4 h-4" />
                {healthError ? `HORS LIGNE (${healthError})` : 'INDISPONIBLE'}
              </span>
            )}
          </div>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <Server className="w-5 h-5" />
              <h3 className="font-bold text-slate-200">Backend & Sécurité</h3>
            </div>
            <p className="text-sm text-slate-400">Spring Boot 3.4 + Java 21</p>
            <p className="text-xs text-slate-500 mt-1">JWT + Cookie SHA-256 + BCrypt + Rate Limit</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <Layout className="w-5 h-5" />
              <h3 className="font-bold text-slate-200">Frontend PWA</h3>
            </div>
            <p className="text-sm text-slate-400">React 19 + Vite + TS</p>
            <p className="text-xs text-slate-500 mt-1">Tailwind v4 + AuthContext mémoire</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-slate-200">Modèle de Données</h3>
            </div>
            <p className="text-sm text-slate-400">Entités User & Address</p>
            <p className="text-xs text-slate-500 mt-1">PostgreSQL 15+ / H2 (UUID, RBAC)</p>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 SamaAdresse — Tous droits réservés</span>
        <span>Phase 2 — Authentification JWT & Modèle Utilisateur</span>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
