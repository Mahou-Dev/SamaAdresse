import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { useToast } from './Toast';
import { getDraftsCount } from '../utils/offlineDb';
import { PageHeader } from './ui/PageHeader';
import type { PageHeaderProps } from './ui/PageHeader';
import { ConfirmDialog } from './ui/ConfirmDialog';
import {
  LayoutDashboard,
  MapPin,
  User,
  HelpCircle,
  ShieldAlert,
  Plus,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react';

export interface ConnectedLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: PageHeaderProps['action'];
  backTo?: string;
  backLabel?: string;
}

export const ConnectedLayout: React.FC<ConnectedLayoutProps> = ({
  children,
  title,
  subtitle,
  action,
  backTo,
  backLabel,
}) => {
  const { user, logout, isOfflineAuth } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [pendingDrafts, setPendingDrafts] = useState<number>(0);

  useEffect(() => {
    getDraftsCount()
      .then((c) => setPendingDrafts(c))
      .catch(() => {});
  }, []);

  const handleLogoutClick = async () => {
    try {
      const count = await getDraftsCount();
      if (count > 0) {
        setPendingDrafts(count);
        setShowLogoutModal(true);
        return;
      }
    } catch {
      // ignore
    }
    await confirmLogout();
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    showToast('Déconnexion effectuée avec succès.', 'info');
    navigate('/');
  };

  const navItems = [
    {
      to: '/tableau-de-bord',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      isActive: pathname === '/tableau-de-bord',
    },
    {
      to: '/addresses/mine',
      label: 'Mes adresses',
      icon: MapPin,
      isActive: pathname.startsWith('/addresses') && pathname !== '/addresses/new',
    },
    {
      to: '/account',
      label: 'Compte',
      icon: User,
      isActive: pathname === '/account' && !search.includes('tab=aide'),
    },
    {
      to: '/account?tab=aide',
      label: 'Aide & guide',
      icon: HelpCircle,
      isActive: pathname === '/account' && search.includes('tab=aide'),
    },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({
      to: '/admin',
      label: 'Administration',
      icon: ShieldAlert,
      isActive: pathname.startsWith('/admin'),
    });
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full bg-[#EADFC8] min-h-[calc(100vh-4rem)]">
      {/* =========================================================================
       * Barre latérale Desktop (>= 1024 px) : 248 px fixe
       * ========================================================================= */}
      <aside
        className="hidden lg:flex w-[248px] shrink-0 border-r border-[#766B5B] bg-[#FBF7EF] flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 z-30"
        aria-label="Navigation de l'espace personnel"
      >
        <div className="space-y-4">
          {/* Identité utilisateur */}
          <div className="p-3 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#12304F] text-[#FBF7EF] flex items-center justify-center font-bold text-sm shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#231A15] truncate" title={user?.fullName}>
                  {user?.fullName || 'Utilisateur'}
                </p>
                <span className="inline-block text-[10px] font-semibold text-[#5C4D44] truncate">
                  {user?.role === 'ADMIN' ? 'Administrateur' : 'Propriétaire'}
                </span>
              </div>
            </div>

            {/* Statut réseau */}
            <div className="pt-2 border-t border-[#766B5B]/30 flex items-center justify-between text-[11px]">
              <span className="text-[#5C4D44] font-medium">Réseau :</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[#2A6B44] font-semibold">
                  <Wifi className="w-3 h-3" />
                  <span>En ligne</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#8A3112] font-semibold">
                  <WifiOff className="w-3 h-3" />
                  <span>Hors ligne</span>
                </span>
              )}
            </div>
          </div>

          {/* Action principale rapide */}
          <div>
            <Link
              to="/addresses/new"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-white text-xs font-bold transition shadow-sm touch-target"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nouvelle adresse</span>
            </Link>
          </div>

          {/* Liens de navigation */}
          <nav className="space-y-1" aria-label="Menu principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition touch-target focus-visible:outline-2 focus-visible:outline-[#F2B233] ${
                    item.isActive
                      ? 'bg-[#12304F] text-[#FBF7EF] shadow-sm'
                      : 'text-[#5C4D44] hover:text-[#231A15] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pied de barre latérale */}
        <div className="pt-4 border-t border-[#766B5B]/30 space-y-2">
          {isOfflineAuth && (
            <div className="p-2 rounded-lg bg-[#FFF7ED] border border-[#8A3112]/30 text-[11px] text-[#8A3112]">
              Session locale hors ligne active.
            </div>
          )}

          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#991B1B] hover:bg-[#FEF2F2] border border-transparent hover:border-[#DC2626]/30 transition touch-target cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F2B233]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
       * Zone de contenu principale (max 1120 px)
       * ========================================================================= */}
      <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {title && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            action={action}
            backTo={backTo}
            backLabel={backLabel}
          />
        )}
        {children}
      </main>

      {/* Modale de confirmation de déconnexion si brouillons hors ligne */}
      <ConfirmDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Adresses en attente d'envoi"
        description={
          pendingDrafts === 1
            ? "1 adresse enregistrée sur cet appareil n'est pas encore envoyée au serveur. Elle sera conservée localement mais rattachée à ce compte lors de votre prochaine reconnexion."
            : `${pendingDrafts} adresses enregistrées sur cet appareil ne sont pas encore envoyées au serveur. Elles seront conservées localement mais rattachées à ce compte lors de votre prochaine reconnexion.`
        }
        confirmLabel="Confirmer la déconnexion"
        cancelLabel="Annuler"
        variant="warning"
      />
    </div>
  );
};
