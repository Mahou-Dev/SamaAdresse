import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NewAddressPage } from './pages/NewAddressPage';
import { MyAddressesPage } from './pages/MyAddressesPage';
import { PublicAddressPage } from './pages/PublicAddressPage';
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
  MapPin,
  Copy,
  Check,
  Compass,
  Plus,
  ListFilter,
  ArrowRight,
} from 'lucide-react';

function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const heroCode = "ZIG-KBG-4271";

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(heroCode);
    setCopiedCode(true);
    showToast(`Code d'adresse ${heroCode} copié !`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#231A15] flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Header Bar */}
      <header className="max-w-5xl mx-auto w-full pt-4 pb-6 flex items-center justify-between gap-4 border-b border-[#E6DDD0]">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#1D528F] flex items-center justify-center text-white shadow-sm transition">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-[#231A15] tracking-tight block leading-tight">
              SamaAdresse
            </span>
            <span className="text-xs font-medium text-[#5C4D44] block">
              Signalétique & Adressage Géolocalisé
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/addresses/mine"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#231A15] text-xs font-bold transition"
              >
                <ListFilter className="w-4 h-4 text-[#1D528F]" />
                <span>Mes Adresses</span>
              </Link>
              <Link
                to="/addresses/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#B84A24] hover:bg-[#963919] text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Créer Adresse</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FEF2F2] text-[#5C4D44] hover:text-[#DC2626] border border-[#D4CEBF] hover:border-[#DC2626]/40 text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#231A15] border border-[#D4CEBF] text-xs font-bold transition"
              >
                <LogIn className="w-4 h-4 text-[#1D528F]" />
                <span>Connexion</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#B84A24] hover:bg-[#963919] text-white text-xs font-bold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Inscription</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full py-10 flex-1 flex flex-col justify-center">
        {/* Ancrage Terrain Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F2ECE1] border border-[#E6DDD0] text-[#231A15] text-xs font-bold w-fit mb-6">
          <Compass className="w-4 h-4 text-[#B84A24]" />
          <span>SÉNÉGAL • ZIGUINCHOR & REGIONS</span>
        </div>

        <div className="mb-8 space-y-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#231A15] leading-tight">
            L'adresse exacte de votre maison, <br className="hidden sm:inline" />
            même sans nom de rue.
          </h1>
          <p className="text-base sm:text-lg text-[#5C4D44] max-w-2xl leading-relaxed">
            Transformez vos repères visuels ("après la mosquée, 3e concession") en un code court, mémorisable et géolocalisé.
          </p>
        </div>

        {/* HERO ADDRESS PLAQUE (LE LIVRABLE CLÉ) */}
        <div className="mb-10 w-full max-w-2xl">
          <div className="rounded-2xl border-4 border-[#1D528F] bg-[#FFFFFF] shadow-md overflow-hidden">
            {/* Plaque Header Band */}
            <div className="bg-[#1D528F] px-6 py-2.5 text-center text-white flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest uppercase">République du Sénégal</span>
              <span className="text-xs font-mono font-bold tracking-wider uppercase">Region Ziguinchor</span>
            </div>

            {/* Plaque Body Content */}
            <div className="p-6 sm:p-8 text-center bg-[#FFFFFF] space-y-4">
              <span className="text-xs font-bold text-[#5C4D44] uppercase tracking-wider block">
                Plaque d'Adressage Officielle
              </span>

              <div className="inline-flex items-center gap-3 bg-[#FBF9F5] px-6 py-3 rounded-xl border border-[#D4CEBF]">
                <span className="text-3xl sm:text-5xl font-extrabold font-mono text-[#231A15] tracking-widest">
                  {heroCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Copier le code d'adresse"
                  className="p-2 rounded-lg bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#231A15] transition cursor-pointer border border-[#D4CEBF]"
                >
                  {copiedCode ? <Check className="w-5 h-5 text-[#2A6B44]" /> : <Copy className="w-5 h-5 text-[#1D528F]" />}
                </button>
              </div>

              <div className="pt-2 text-sm font-medium text-[#5C4D44] flex items-center justify-center gap-1.5 max-w-md mx-auto">
                <MapPin className="w-4 h-4 text-[#B84A24] shrink-0" />
                <span>Quartier Kangourou • 3e concession après la Grande Mosquée</span>
              </div>

              <div className="pt-3 flex justify-center gap-3">
                <Link
                  to={`/a/${heroCode}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#1D528F] font-bold text-xs transition border border-[#D4CEBF]"
                >
                  <span>Tester la Fiche Publique</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Authenticated User Session Card */}
        {isAuthenticated && user && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E6DDD0]">
              <div className="p-3 rounded-xl bg-[#F2ECE1] text-[#1D528F]">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#231A15]">Session Propriétaire Active</h2>
                <p className="text-xs text-[#5C4D44]">Access Token en mémoire React (Sécurisé)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0]">
                <span className="text-xs text-[#5C4D44] font-semibold block mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#1D528F]" /> Nom complet
                </span>
                <span className="text-sm font-bold text-[#231A15]">{user.fullName}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0]">
                <span className="text-xs text-[#5C4D44] font-semibold block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#B84A24]" /> Email
                </span>
                <span className="text-sm font-bold text-[#231A15] truncate block">{user.email}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0]">
                <span className="text-xs text-[#5C4D44] font-semibold block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#2A6B44]" /> Téléphone
                </span>
                <span className="text-sm font-bold text-[#231A15]">{user.phoneNumber}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0]">
                <span className="text-xs text-[#5C4D44] font-semibold block mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#1D528F]" /> Rôle Utilisateur
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1D528F]/10 text-[#1D528F] font-bold text-xs">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Healthcheck Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#E6DDD0]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#F2ECE1] text-[#2A6B44]">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#231A15]">Statut API & Base de Données</h2>
                <p className="text-sm text-[#5C4D44]">Connexion PostgreSQL 16 via Spring Boot (/api/health)</p>
              </div>
            </div>

            <button
              onClick={fetchHealthStatus}
              disabled={loadingHealth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] active:scale-95 transition text-sm font-bold text-[#231A15] border border-[#D4CEBF] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-[#1D528F]' : ''}`} />
              {loadingHealth ? 'Vérification...' : 'Actualiser'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0]">
            <span className="text-sm font-semibold text-[#231A15]">Endpoint: /api/health</span>

            {loadingHealth ? (
              <span className="inline-flex items-center gap-2 text-sm text-[#5C4D44]">
                <span className="w-2 h-2 rounded-full bg-[#B84A24] animate-ping" />
                Chargement...
              </span>
            ) : healthStatus === 'UP' ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF4ED] border border-[#2A6B44]/30 text-[#1C4E30] font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#2A6B44]" />
                STATUT : CONNECTÉ (POSTGRESQL 16)
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] font-bold text-sm">
                <XCircle className="w-4 h-4 text-[#DC2626]" />
                {healthError ? `HORS LIGNE (${healthError})` : 'INDISPONIBLE'}
              </span>
            )}
          </div>
        </div>

        {/* Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#F2ECE1] border border-[#E6DDD0]">
            <div className="flex items-center gap-3 text-[#1D528F] mb-2">
              <Server className="w-5 h-5" />
              <h3 className="font-bold text-[#231A15]">Backend Spring Boot</h3>
            </div>
            <p className="text-sm text-[#5C4D44]">Spring Boot 3.4 + Java 21</p>
            <p className="text-xs text-[#8C7B70] mt-1">Génération Code ZONE-QUARTIER-XXXX</p>
          </div>

          <div className="p-5 rounded-xl bg-[#F2ECE1] border border-[#E6DDD0]">
            <div className="flex items-center gap-3 text-[#B84A24] mb-2">
              <Layout className="w-5 h-5" />
              <h3 className="font-bold text-[#231A15]">Frontend PWA</h3>
            </div>
            <p className="text-sm text-[#5C4D44]">React 19 + Vite + TypeScript</p>
            <p className="text-xs text-[#8C7B70] mt-1">Design Terre & Enseigne de Ziguinchor</p>
          </div>

          <div className="p-5 rounded-xl bg-[#F2ECE1] border border-[#E6DDD0]">
            <div className="flex items-center gap-3 text-[#2A6B44] mb-2">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-[#231A15]">Base de Données</h3>
            </div>
            <p className="text-sm text-[#5C4D44]">PostgreSQL 16 sur port 5434</p>
            <p className="text-xs text-[#8C7B70] mt-1">Entités User & Address (UUID, Index)</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full pt-6 border-t border-[#E6DDD0] text-center text-xs text-[#5C4D44] flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 SamaAdresse — Plateforme Nationale d'Adressage Géolocalisé</span>
        <span>Ziguinchor, Sénégal</span>
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
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
