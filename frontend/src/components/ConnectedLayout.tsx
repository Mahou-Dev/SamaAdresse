import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { useToast } from './Toast';
import { getDraftsCount } from '../utils/offlineDb';
import { syncManager } from '../utils/syncManager';
import { PageHeader } from './ui/PageHeader';
import type { PageHeaderProps } from './ui/PageHeader';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Avatar } from './ui/Avatar';
import { cn } from '../utils/cn';
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
  Compass,
} from 'lucide-react';

export interface ConnectedLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: PageHeaderProps['action'];
  secondaryAction?: PageHeaderProps['secondaryAction'];
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  backTo?: string;
  backLabel?: string;
  maxWidth?: 'default' | 'wide';
}

export const ConnectedLayout: React.FC<ConnectedLayoutProps> = ({
  children,
  title,
  subtitle,
  action,
  secondaryAction,
  breadcrumbs,
  backTo,
  backLabel,
  maxWidth = 'default',
}) => {
  const { user, logout, isOfflineAuth } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [pendingDrafts, setPendingDrafts] = useState<number>(0);

  const refreshDrafts = useCallback(() => {
    getDraftsCount()
      .then((c) => setPendingDrafts(c))
      .catch(() => {
        // IndexedDB indisponible
      });
  }, []);

  useEffect(() => {
    refreshDrafts();
    const unsubscribe = syncManager.subscribe((event) => {
      if (
        event.type === 'SYNC_COMPLETE' ||
        event.type === 'SYNC_SUCCESS' ||
        event.type === 'SYNC_ERROR'
      ) {
        refreshDrafts();
      }
    });
    return () => unsubscribe();
  }, [refreshDrafts]);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    showToast('Déconnexion effectuée avec succès.', 'info');
    navigate('/');
  };

  const handleLogoutClick = async () => {
    try {
      const count = await getDraftsCount();
      if (count > 0) {
        setPendingDrafts(count);
        setShowLogoutModal(true);
        return;
      }
    } catch {
      // ignorer si IndexedDB inaccessible
    }
    await confirmLogout();
  };

  const navItems: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    badge?: number;
  }[] = [
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
      badge: pendingDrafts > 0 ? pendingDrafts : undefined,
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
    <div className="flex-1 flex flex-col lg:flex-row w-full bg-surface text-ink min-h-[calc(100vh-4rem)]">
      {/* Barre latérale Desktop (>= 1024 px) — SamaAdresse Clarté */}
      <aside
        className="hidden lg:flex w-[256px] shrink-0 border-r border-border bg-surface-elevated flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 z-20 no-print"
        aria-label="Navigation de l'espace personnel"
      >
        <div className="space-y-4">
          {/* Identité utilisateur & état réseau */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={user?.fullName || 'Utilisateur'}
                size="sm"
                tone={user?.role === 'ADMIN' ? 'brand' : 'institution'}
                status={isOnline ? 'online' : 'offline'}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-bold text-ink truncate leading-tight"
                  title={user?.fullName}
                >
                  {user?.fullName || 'Utilisateur'}
                </p>
                <span className="inline-block text-xs font-medium text-ink-muted truncate">
                  {user?.role === 'ADMIN' ? 'Administrateur' : 'Propriétaire'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-ink-muted font-medium">Réseau</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-success font-semibold">
                  <Wifi className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>En ligne</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning font-semibold">
                  <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hors ligne</span>
                </span>
              )}
            </div>
          </div>

          {/* Action principale rapide */}
          <Link
            to="/addresses/new"
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs min-h-[42px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>Nouvelle adresse</span>
          </Link>

          {/* Liens de l'espace connecté */}
          <nav className="space-y-1" aria-label="Menu de l'espace personnel">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[42px]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
                    item.isActive
                      ? 'bg-institution-soft text-institution border border-institution-border'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface border border-transparent'
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning-soft border border-warning-border text-warning text-[11px] font-bold font-mono"
                      title={`${item.badge} en attente de synchronisation`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Pont vers l'annuaire public */}
          <div className="pt-3 border-t border-border">
            <Link
              to="/annuaire"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface transition-colors min-h-[38px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
            >
              <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Explorer l'annuaire public</span>
            </Link>
          </div>
        </div>

        {/* Pied de barre latérale */}
        <div className="pt-4 border-t border-border space-y-2.5">
          {isOfflineAuth && (
            <div className="p-2.5 rounded-xl bg-warning-soft border border-warning-border text-xs text-warning font-medium leading-snug">
              Session locale hors ligne active.
            </div>
          )}

          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-danger hover:bg-danger-soft border border-transparent hover:border-danger-border transition-colors min-h-[42px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Zone de contenu principale */}
      <div
        className={cn(
          'flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 lg:pb-12 space-y-6 min-w-0',
          maxWidth === 'wide' ? 'max-w-[1280px]' : 'max-w-[1120px]'
        )}
      >
        {title && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            action={action}
            secondaryAction={secondaryAction}
            breadcrumbs={breadcrumbs}
            backTo={backTo}
            backLabel={backLabel}
          />
        )}
        {children}
      </div>

      {/* Modale de confirmation de déconnexion si brouillons hors ligne en attente */}
      <ConfirmDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Adresses en attente d'envoi"
        description={
          pendingDrafts === 1
            ? "1 adresse enregistrée sur cet appareil n'est pas encore envoyée au serveur. Elle sera conservée localement et rattachée à ce compte lors de votre prochaine reconnexion."
            : `${pendingDrafts} adresses enregistrées sur cet appareil ne sont pas encore envoyées au serveur. Elles seront conservées localement et rattachées à ce compte lors de votre prochaine reconnexion.`
        }
        confirmLabel="Confirmer la déconnexion"
        cancelLabel="Annuler"
        variant="warning"
      />
    </div>
  );
};
