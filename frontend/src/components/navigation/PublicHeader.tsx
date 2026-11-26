import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MapPin,
  Plus,
  LogIn,
  Eye,
  Compass,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { useToast } from '../Toast';
import { OfflineStatusIndicator } from '../shared/OfflineStatusIndicator';
import { getDraftsCount } from '../../utils/offlineDb';
import { syncManager } from '../../utils/syncManager';
import { cn } from '../../utils/cn';

const UserProfileMenu = lazy(() =>
  import('../shared/UserProfileMenu').then((m) => ({ default: m.UserProfileMenu }))
);
const ConfirmDialog = lazy(() =>
  import('../ui/ConfirmDialog').then((m) => ({ default: m.ConfirmDialog }))
);

/**
 * Navigation publique unifiée SamaAdresse 2.0 « Clarté ».
 *
 * - Desktop (>= 768 px) : en-tête unique fixe, sobre et structuré (marque, liens principaux,
 *   indicateur hors ligne contextuel, CTA « Créer une adresse », profil ou connexion).
 * - Mobile (< 768 px) : en-tête compact + barre inférieure de 4 destinations distinctes,
 *   sans duplication entre en-tête et barre inférieure.
 */
export const PublicHeader: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { showToast } = useToast();

  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const demoCode = import.meta.env.VITE_DEMO_CODE || 'ZIG-KBG-8454';
  const examplePath = `/a/${demoCode}`;

  const refreshDraftsCount = useCallback(() => {
    getDraftsCount()
      .then((count) => setPendingDrafts(count))
      .catch(() => {
        // IndexedDB indisponible (ex. navigation privée restreinte)
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    refreshDraftsCount();
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'SYNC_START' || event.type === 'SYNC_PROGRESS') {
        setIsSyncing(true);
      } else if (event.type === 'SYNC_COMPLETE' || event.type === 'SYNC_ERROR') {
        setIsSyncing(false);
        refreshDraftsCount();
      } else if (event.type === 'SYNC_SUCCESS') {
        refreshDraftsCount();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, refreshDraftsCount]);

  const effectivePendingDrafts = isAuthenticated ? pendingDrafts : 0;
  const effectiveIsSyncing = isAuthenticated ? isSyncing : false;

  const confirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await logout();
    showToast('Déconnexion effectuée avec succès.', 'info');
    navigate('/');
  }, [logout, navigate, showToast]);

  const handleLogoutRequest = useCallback(async () => {
    try {
      const count = await getDraftsCount();
      if (count > 0) {
        setPendingDrafts(count);
        setShowLogoutModal(true);
        return;
      }
    } catch {
      // ignorer
    }
    await confirmLogout();
  }, [confirmLogout]);

  // Masquer la navigation globale sur les pages d'authentification
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const showOfflinePill = !isOnline || effectivePendingDrafts > 0 || effectiveIsSyncing;

  const desktopLinks = isAuthenticated
    ? [
        { to: '/', label: 'Accueil', isActive: pathname === '/' },
        { to: '/annuaire', label: 'Annuaire', isActive: pathname === '/annuaire' },
        {
          to: '/tableau-de-bord',
          label: 'Tableau de bord',
          isActive: pathname === '/tableau-de-bord',
        },
        {
          to: '/addresses/mine',
          label: 'Mes adresses',
          isActive: pathname.startsWith('/addresses') && pathname !== '/addresses/new',
        },
      ]
    : [
        { to: '/', label: 'Accueil', isActive: pathname === '/' },
        { to: '/annuaire', label: 'Annuaire', isActive: pathname === '/annuaire' },
        { to: examplePath, label: 'Exemple', isActive: pathname === examplePath },
      ];

  return (
    <>
      {/* =====================================================================
       * 1. En-tête fixe unifié (Desktop & Mobile)
       * ===================================================================== */}
      <header className="sticky top-0 z-[var(--z-header)] w-full bg-canvas/95 backdrop-blur-md border-b border-border no-print">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
          {/* Marque */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group rounded-xl py-1 pr-2 min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            <span className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-brand text-ink-inverse flex items-center justify-center shadow-xs shrink-0 group-hover:bg-brand-hover transition-colors">
              <MapPin className="w-4 h-4 md:w-[18px] md:h-[18px]" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="font-extrabold text-base md:text-lg text-ink tracking-tight block leading-none">
                SamaAdresse
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-ink-muted mt-0.5 leading-none">
                Adressage au Sénégal
              </span>
            </span>
          </Link>

          {/* Navigation principale Desktop (>= 768 px) */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Navigation principale"
          >
            {desktopLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={link.isActive ? 'page' : undefined}
                className={cn(
                  'px-3.5 py-2 rounded-full text-sm font-semibold transition-colors min-h-[40px] inline-flex items-center whitespace-nowrap',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
                  link.isActive
                    ? 'bg-surface-hover text-ink'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions Desktop (>= 768 px) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {showOfflinePill && (
              <OfflineStatusIndicator
                isOnline={isOnline}
                pendingCount={effectivePendingDrafts}
                isSyncing={effectiveIsSyncing}
                compact={true}
                onSyncClick={
                  isOnline && effectivePendingDrafts > 0
                    ? () => {
                        syncManager.syncNow();
                      }
                    : undefined
                }
              />
            )}

            <Link
              to="/addresses/new"
              aria-current={pathname === '/addresses/new' ? 'page' : undefined}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[42px] whitespace-nowrap shadow-xs',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
                pathname === '/addresses/new'
                  ? 'bg-brand-active text-ink-inverse'
                  : 'bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse'
              )}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span>Créer une adresse</span>
            </Link>

            {isAuthenticated ? (
              <Suspense
                fallback={
                  <span className="inline-block w-[74px] h-[44px] rounded-full bg-surface border border-border animate-pulse" />
                }
              >
                <UserProfileMenu
                  user={user}
                  isAuthenticated={true}
                  isOnline={isOnline}
                  onLogout={handleLogoutRequest}
                />
              </Suspense>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-sm font-semibold transition-colors min-h-[42px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
              >
                <LogIn className="w-4 h-4 text-ink-secondary" aria-hidden="true" />
                <span>Se connecter</span>
              </Link>
            )}
          </div>

          {/* Actions Mobile (< 768 px) — compactes, sans duplication avec la barre basse */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {showOfflinePill && (
              <OfflineStatusIndicator
                isOnline={isOnline}
                pendingCount={effectivePendingDrafts}
                isSyncing={effectiveIsSyncing}
                compact={true}
              />
            )}

            {isAuthenticated ? (
              <Suspense
                fallback={
                  <span className="inline-block w-[74px] h-[44px] rounded-full bg-surface border border-border animate-pulse" />
                }
              >
                <UserProfileMenu
                  user={user}
                  isAuthenticated={true}
                  isOnline={isOnline}
                  onLogout={handleLogoutRequest}
                />
              </Suspense>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-xs font-semibold min-h-[38px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-institution"
              >
                <LogIn className="w-3.5 h-3.5 text-ink-secondary" aria-hidden="true" />
                <span>Se connecter</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
       * 2. Barre inférieure mobile (< 768 px) — 4 destinations max, zéro doublon
       * ===================================================================== */}
      <nav
        className="order-last sticky bottom-0 left-0 right-0 z-[var(--z-header)] bg-canvas/95 backdrop-blur-md border-t border-border px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] md:hidden no-print"
        aria-label="Navigation mobile"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-center gap-1 text-center">
          <Link
            to="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center py-1 rounded-xl min-h-[44px] transition-colors',
              pathname === '/'
                ? 'text-brand font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            )}
          >
            <Home className="w-5 h-5 mb-0.5" aria-hidden="true" />
            <span className="text-[11px] leading-none">Accueil</span>
          </Link>

          <Link
            to="/annuaire"
            aria-current={pathname === '/annuaire' ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center py-1 rounded-xl min-h-[44px] transition-colors',
              pathname === '/annuaire'
                ? 'text-brand font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            )}
          >
            <Compass className="w-5 h-5 mb-0.5" aria-hidden="true" />
            <span className="text-[11px] leading-none">Annuaire</span>
          </Link>

          <Link
            to="/addresses/new"
            aria-current={pathname === '/addresses/new' ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center py-1 rounded-xl min-h-[44px] transition-colors',
              pathname === '/addresses/new'
                ? 'text-brand font-bold'
                : 'text-brand hover:text-brand-hover font-semibold'
            )}
          >
            <span className="w-7 h-7 -mt-0.5 mb-0.5 rounded-full bg-brand text-ink-inverse flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </span>
            <span className="text-[11px] leading-none">Créer</span>
          </Link>

          {isAuthenticated ? (
            <Link
              to="/addresses/mine"
              aria-current={
                pathname.startsWith('/addresses') && pathname !== '/addresses/new'
                  ? 'page'
                  : undefined
              }
              className={cn(
                'flex flex-col items-center justify-center py-1 rounded-xl min-h-[44px] transition-colors',
                pathname.startsWith('/addresses') && pathname !== '/addresses/new'
                  ? 'text-brand font-bold'
                  : 'text-ink-muted hover:text-ink font-medium'
              )}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-none">Adresses</span>
            </Link>
          ) : (
            <Link
              to={examplePath}
              aria-current={pathname === examplePath ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center py-1 rounded-xl min-h-[44px] transition-colors',
                pathname === examplePath
                  ? 'text-brand font-bold'
                  : 'text-ink-muted hover:text-ink font-medium'
              )}
            >
              <Eye className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-none">Exemple</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Modale de garde-fou si déconnexion avec brouillons en attente */}
      {showLogoutModal && (
        <Suspense fallback={null}>
          <ConfirmDialog
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={confirmLogout}
            title="Adresses en attente d'envoi"
            description={
              pendingDrafts === 1
                ? "1 adresse enregistrée sur cet appareil n'est pas encore transmise au serveur. Elle sera conservée localement jusqu'à votre prochaine reconnexion."
                : `${pendingDrafts} adresses enregistrées sur cet appareil ne sont pas encore transmises au serveur. Elles seront conservées localement jusqu'à votre prochaine reconnexion.`
            }
            confirmLabel="Confirmer la déconnexion"
            cancelLabel="Annuler"
            variant="warning"
          />
        </Suspense>
      )}
    </>
  );
};
