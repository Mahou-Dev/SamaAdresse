import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Plus, LogIn, User, Eye, BookOpen, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AppNavigation: React.FC = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const demoCode = import.meta.env.VITE_DEMO_CODE || 'ZIG-KBG-8454';
  const examplePath = `/a/${demoCode}`;

  // Masquer la navigation globale sur les pages d'authentification
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <>
      {/* =========================================================================
       * 1. Navigation Desktop (>= 768 px) : Barre supérieure sobre et fixe
       * ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#12304F] border-b border-[#766B5B] transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo cliquable */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-[#F2B233] rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FBF7EF] flex items-center justify-center text-[#12304F] shadow-sm">
              <MapPin className="w-4 h-4 text-[#12304F]" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#FBF7EF] tracking-tight block leading-tight">
                SamaAdresse
              </span>
              <span className="text-[11px] font-medium text-[#EADFC8] block">
                Ziguinchor & Sénégal
              </span>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Navigation principale">
            <Link
              to="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 touch-target ${
                pathname === '/'
                  ? 'bg-[#FBF7EF] text-[#12304F] shadow-sm'
                  : 'text-[#EADFC8] hover:text-[#FBF7EF] hover:bg-[#FBF7EF]/10'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Link>

            <Link
              to="/annuaire"
              aria-current={pathname === '/annuaire' ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 touch-target ${
                pathname === '/annuaire'
                  ? 'bg-[#FBF7EF] text-[#12304F] shadow-sm'
                  : 'text-[#EADFC8] hover:text-[#FBF7EF] hover:bg-[#FBF7EF]/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Annuaire</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/tableau-de-bord"
                  aria-current={pathname === '/tableau-de-bord' ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 touch-target ${
                    pathname === '/tableau-de-bord'
                      ? 'bg-[#FBF7EF] text-[#12304F] shadow-sm'
                      : 'text-[#EADFC8] hover:text-[#FBF7EF] hover:bg-[#FBF7EF]/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Tableau de bord</span>
                </Link>

                <Link
                  to="/addresses/mine"
                  aria-current={pathname === '/addresses/mine' ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 touch-target ${
                    pathname === '/addresses/mine'
                      ? 'bg-[#FBF7EF] text-[#12304F] shadow-sm'
                      : 'text-[#EADFC8] hover:text-[#FBF7EF] hover:bg-[#FBF7EF]/10'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Mes adresses</span>
                </Link>
              </>
            )}

            {/* Lien de navigation : Nouvelle adresse */}
            <Link
              to="/addresses/new"
              aria-current={pathname === '/addresses/new' ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 touch-target ${
                pathname === '/addresses/new'
                  ? 'bg-[#FBF7EF] text-[#12304F] shadow-sm'
                  : 'text-[#EADFC8] hover:text-[#FBF7EF] hover:bg-[#FBF7EF]/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle adresse</span>
            </Link>

            {/* Authentification / Profil */}
            <div className="h-5 w-px bg-[#766B5B] mx-1" aria-hidden="true" />

            {isAuthenticated ? (
              <Link
                to="/account"
                aria-current={pathname === '/account' ? 'page' : undefined}
                className={`text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 touch-target ${
                  pathname === '/account'
                    ? 'bg-[#FBF7EF] text-[#12304F] shadow-sm'
                    : 'text-[#EADFC8] hover:text-[#FBF7EF] hover:bg-[#FBF7EF]/10'
                }`}
                title="Accéder à mon espace personnel"
              >
                <User className="w-4 h-4" />
                <span>Compte</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg border border-[#F2B233] bg-[#F2B233] hover:bg-[#DDA025] text-[#231A15] text-xs font-bold transition flex items-center gap-1.5 touch-target shadow-sm"
              >
                <LogIn className="w-4 h-4 text-[#231A15]" />
                <span>Se connecter</span>
              </Link>
            )}
          </nav>

          {/* Version simplifiée sur mobile pour l'en-tête (en-tête léger) */}
          <div className="md:hidden flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg border border-[#F2B233] bg-[#F2B233] hover:bg-[#DDA025] text-[#231A15] text-xs font-bold flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-[#231A15]" />
                <span>Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
       * 2. Navigation Mobile (< 768 px) : Barre basse fixe (App Bar)
       * ========================================================================= */}
      <nav
        className="order-last sticky bottom-0 left-0 right-0 z-40 bg-[#FBF7EF] border-t border-[#766B5B] px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden shadow-sm no-print"
        aria-label="Navigation mobile"
      >
        {isAuthenticated ? (
          /* Barre connecté : Accueil / Annuaire / [Nouvelle adresse] / Mes adresses / Compte */
          <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-0.5 text-center">
            <Link
              to="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link
              to="/annuaire"
              aria-current={pathname === '/annuaire' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/annuaire'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Annuaire</span>
            </Link>

            <Link
              to="/addresses/new"
              aria-current={pathname === '/addresses/new' ? 'page' : undefined}
              aria-label="Créer une nouvelle adresse"
              className="flex flex-col items-center justify-center -mt-4 touch-target group"
            >
              <div className="w-10 h-10 rounded-full bg-[#B84A24] text-white flex items-center justify-center shadow-[0_3px_6px_rgba(184,74,36,0.35)] group-active:scale-95 transition">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-[#B84A24] mt-0.5 whitespace-nowrap">Créer</span>
            </Link>

            <Link
              to="/addresses/mine"
              aria-current={pathname === '/addresses/mine' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/addresses/mine'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <MapPin className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Adresses</span>
            </Link>

            <Link
              to="/account"
              aria-current={pathname === '/account' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/account'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Compte</span>
            </Link>
          </div>
        ) : (
          /* Barre visiteur non connecté : Accueil / Annuaire / [Créer mon adresse] / Voir un exemple / Se connecter */
          <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-0.5 text-center">
            <Link
              to="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link
              to="/annuaire"
              aria-current={pathname === '/annuaire' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/annuaire'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Annuaire</span>
            </Link>

            <Link
              to="/addresses/new"
              aria-current={pathname === '/addresses/new' ? 'page' : undefined}
              aria-label="Créer mon adresse"
              className="flex flex-col items-center justify-center -mt-4 touch-target group"
            >
              <div className="w-10 h-10 rounded-full bg-[#B84A24] text-white flex items-center justify-center shadow-[0_3px_6px_rgba(184,74,36,0.35)] group-active:scale-95 transition">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-[#B84A24] mt-0.5 whitespace-nowrap">Créer</span>
            </Link>

            <Link
              to={examplePath}
              aria-current={pathname === examplePath ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === examplePath
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <Eye className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Exemple</span>
            </Link>

            <Link
              to="/login"
              aria-current={pathname === '/login' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg touch-target transition ${
                pathname === '/login'
                  ? 'text-[#1D528F] font-bold'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              <LogIn className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Connexion</span>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};
