import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { usePwaInstall } from '../utils/usePwaInstall';
import { getDraftsCount } from '../utils/offlineDb';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  LogIn,
  ArrowRight,
  WifiOff,
  Download,
  CheckCircle2,
  Smartphone,
  AlertCircle,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { canInstall, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [visitedCodes, setVisitedCodes] = useState<string[]>([]);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('visited_address_codes') || '[]');
      if (Array.isArray(stored)) {
        setVisitedCodes(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogoutClick = async () => {
    try {
      const count = await getDraftsCount();
      if (count > 0) {
        setPendingDraftsCount(count);
        setShowLogoutConfirmModal(true);
        return;
      }
    } catch {
      // ignore
    }
    await confirmLogout();
  };

  const confirmLogout = async () => {
    setShowLogoutConfirmModal(false);
    await logout();
    showToast('Déconnexion effectuée avec succès.', 'info');
    navigate('/');
  };

  const handleInstallClick = async () => {
    const success = await triggerInstall();
    if (success) {
      showToast('Application en cours d’installation.', 'success');
    }
  };

  if (!isOnline) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center items-center text-center font-sans">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F2ECE1] border border-[#D4CEBF] flex items-center justify-center text-[#8A3112] mx-auto">
            <WifiOff className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#231A15]">
              Connexion requise pour afficher cette page
            </h1>
            <p className="text-xs text-[#5C4D44] leading-relaxed">
              L'accès à votre espace personnel nécessite une connexion Internet active. Les fiches d'adresses déjà consultées restent consultables hors ligne.
            </p>
          </div>

          {visitedCodes.length > 0 && (
            <div className="pt-3 border-t border-[#E6DDD0] text-left">
              <span className="text-[11px] font-semibold text-[#5C4D44] block mb-2">
                Fiches consultées disponibles hors ligne :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {visitedCodes.map((c) => (
                  <Link
                    key={c}
                    to={`/a/${c}`}
                    className="inline-block px-2.5 py-1 text-xs font-mono font-bold bg-[#F2ECE1] text-[#231A15] rounded border border-[#D4CEBF] hover:border-[#8C8272] transition"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center items-center text-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#F2ECE1] border border-[#D4CEBF] flex items-center justify-center text-[#1D528F] mb-4">
          <User className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#231A15] tracking-tight mb-2">
          Espace personnel
        </h1>
        <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed mb-6">
          Connectez-vous pour retrouver vos adresses enregistrées et gérer vos plaques.
        </p>
        <div className="w-full space-y-3">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs sm:text-sm font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] touch-target"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </Link>
          <Link
            to="/register"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#231A15] text-xs sm:text-sm font-bold transition touch-target"
          >
            <span>Créer un compte</span>
            <ArrowRight className="w-4 h-4 text-[#5C4D44]" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 font-sans space-y-6">
      <div className="pb-4 border-b border-[#E6DDD0]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
          Espace personnel
        </h1>
        <p className="text-xs sm:text-sm text-[#5C4D44] mt-1">
          Informations de votre compte SamaAdresse
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-xl border border-[#8C8272] bg-[#FFFFFF] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E6DDD0]">
          <div className="w-12 h-12 rounded-full bg-[#1D528F] text-white flex items-center justify-center text-lg font-bold">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#231A15]">
              {user.fullName}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2A6B44] bg-[#2A6B44]/10 px-2 py-0.5 rounded border border-[#2A6B44]/20 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>Compte actif</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[#FBF9F5] border border-[#D4CEBF] space-y-1">
            <span className="text-[#5C4D44] text-[11px] flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#1D528F]" />
              <span>Adresse e-mail</span>
            </span>
            <p className="font-semibold text-[#231A15] break-all">{user.email}</p>
          </div>

          <div className="p-3 rounded-lg bg-[#FBF9F5] border border-[#D4CEBF] space-y-1">
            <span className="text-[#5C4D44] text-[11px] flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-[#1D528F]" />
              <span>Numéro de téléphone</span>
            </span>
            <p className="font-semibold text-[#231A15] font-mono">{user.phoneNumber || 'Non renseigné'}</p>
          </div>
        </div>

        {/* Section PWA : Installer l'application */}
        <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#D4CEBF] space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#1D528F]" />
                <span className="text-xs font-bold text-[#231A15]">
                  Installer l'application
                </span>
              </div>
              <p className="text-xs text-[#5C4D44]">
                Accédez à SamaAdresse en un geste depuis votre écran d'accueil et retrouvez vos fiches hors ligne.
              </p>
            </div>

            {isInstalled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A6B44]/10 text-[#2A6B44] text-xs font-semibold border border-[#2A6B44]/20 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Application installée</span>
              </span>
            ) : canInstall ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-sm cursor-pointer touch-target shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installer</span>
              </button>
            ) : null}
          </div>

          {!isInstalled && !canInstall && (
            <div className="text-[11px] text-[#5C4D44] bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E6DDD0]">
              {isIos ? (
                <p>
                  Pour installer l'application sur iPhone ou iPad : appuyez sur le bouton <strong>Partager</strong> dans Safari, puis sélectionnez <strong>« Sur l'écran d'accueil »</strong>.
                </p>
              ) : (
                <p>
                  Vous pouvez installer SamaAdresse sur votre appareil directement depuis le menu de votre navigateur (« Installer l'application » ou « Ajouter à l'écran d'accueil »).
                </p>
              )}
            </div>
          )}
        </div>

        {user.role === 'ADMIN' && (
          <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#8C8272] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#231A15] block">
                Administration et modération
              </span>
              <span className="text-xs text-[#5C4D44] block">
                Examiner les signalements publics et gérer les adresses signalées.
              </span>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#1D528F] bg-[#FFFFFF] hover:bg-[#FBF9F5] text-[#1D528F] text-xs font-bold transition cursor-pointer touch-target shrink-0"
            >
              <span>Accéder à la modération</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#991B1B]/40 bg-[#FFFFFF] hover:bg-[#FEF2F2] text-[#991B1B] text-xs font-bold transition shadow-sm cursor-pointer touch-target"
          >
            <LogOut className="w-4 h-4 text-[#991B1B]" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {showLogoutConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8C8272] shadow-xl p-6 max-w-md w-[calc(100vw-32px)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#DC2626]/30 flex items-center justify-center text-[#991B1B] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 id="logout-dialog-title" className="text-base font-bold text-[#231A15]">
                Adresses en attente d'envoi
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
              {pendingDraftsCount === 1
                ? "1 adresse enregistrée sur cet appareil n'est pas encore envoyée. Elle sera conservée mais associée à ce compte lors de votre prochaine connexion."
                : `${pendingDraftsCount} adresses enregistrées sur cet appareil ne sont pas encore envoyées. Elles seront conservées mais associées à ce compte lors de votre prochaine connexion.`}
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#8C8272] text-[#231A15] hover:bg-[#F2ECE1] text-xs font-bold transition min-h-[44px]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition min-h-[44px]"
              >
                Confirmer la déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
