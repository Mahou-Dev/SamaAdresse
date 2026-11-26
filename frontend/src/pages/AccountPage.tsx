import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { usePwaInstall } from '../utils/usePwaInstall';
import {
  getDrafts,
  getDraftsCount,
  getReservedCodes,
  clearAllOfflineData,
} from '../utils/offlineDb';
import type { OfflineDraft } from '../utils/offlineDb';
import { syncManager } from '../utils/syncManager';
import { ConnectedLayout } from '../components/ConnectedLayout';
import {
  Card,
  Tabs,
  TabPanel,
  ConfirmDialog,
  StatusBadge,
  Avatar,
  Badge,
} from '../components/ui';
import {
  User as UserIcon,
  Mail,
  Phone,
  LogOut,
  Download,
  CheckCircle2,
  Smartphone,
  Database,
  Trash2,
  RefreshCw,
  Sliders,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info,
  ShieldCheck,
  Calendar,
  WifiOff,
  Check,
} from 'lucide-react';

const VALID_TABS = ['profil', 'offline', 'preferences', 'aide'] as const;
type AccountTabId = (typeof VALID_TABS)[number];

export const AccountPage: React.FC = () => {
  const { user, isOfflineAuth, logout } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { canInstall, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Onglet dérivé directement de l'URL (?tab=...) pour éviter tout effet de synchronisation redondant
  const rawTab = searchParams.get('tab');
  const activeTab: AccountTabId = VALID_TABS.includes(rawTab as AccountTabId)
    ? (rawTab as AccountTabId)
    : 'profil';

  const handleTabChange = (tabId: string) => {
    setSearchParams(tabId === 'profil' ? {} : { tab: tabId });
  };

  // Données hors ligne IndexedDB
  const [activeReservedCount, setActiveReservedCount] = useState<number>(0);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [isRefreshingCodes, setIsRefreshingCodes] = useState<boolean>(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState<boolean>(false);
  const [clearingCache, setClearingCache] = useState<boolean>(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);
  const refreshingRef = useRef<boolean>(false);

  // Préférences locales (valeurs par défaut pour la création d'adresse sur cet appareil)
  const readBoolPref = (key: string) => {
    try {
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  };

  const [savedPrefs, setSavedPrefs] = useState(() => ({
    listed: readBoolPref('sa_pref_default_listed'),
    showOwner: readBoolPref('sa_pref_default_show_owner'),
  }));
  const [prefDefaultListed, setPrefDefaultListed] = useState<boolean>(savedPrefs.listed);
  const [prefDefaultShowOwner, setPrefDefaultShowOwner] = useState<boolean>(savedPrefs.showOwner);

  const prefsDirty =
    prefDefaultListed !== savedPrefs.listed || prefDefaultShowOwner !== savedPrefs.showOwner;

  const refreshOfflineSnapshot = useCallback(async () => {
    try {
      const [codes, draftsList] = await Promise.all([getReservedCodes(), getDrafts()]);
      const now = Date.now();
      setActiveReservedCount(
        codes.filter((c) => c.status === 'RESERVED' && new Date(c.expiresAt).getTime() > now).length
      );
      setDrafts(draftsList);
    } catch {
      // IndexedDB indisponible
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getReservedCodes(), getDrafts()])
      .then(([codes, draftsList]) => {
        if (!cancelled) {
          const now = Date.now();
          setActiveReservedCount(
            codes.filter((c) => c.status === 'RESERVED' && new Date(c.expiresAt).getTime() > now)
              .length
          );
          setDrafts(draftsList);
        }
      })
      .catch(() => {
        // ignorer
      });

    const unsubscribe = syncManager.subscribe((event) => {
      if (
        event.type === 'SYNC_COMPLETE' ||
        event.type === 'SYNC_SUCCESS' ||
        event.type === 'SYNC_ERROR'
      ) {
        void refreshOfflineSnapshot();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [refreshOfflineSnapshot]);

  const handleRefreshCodes = async () => {
    if (refreshingRef.current || !isOnline) return;
    refreshingRef.current = true;
    setIsRefreshingCodes(true);
    try {
      await syncManager.refreshReservedCodes();
      await refreshOfflineSnapshot();
      showToast('Stock de codes réservés actualisé.', 'success');
    } catch {
      showToast('Impossible de réapprovisionner les codes réservés.', 'error');
    } finally {
      refreshingRef.current = false;
      setIsRefreshingCodes(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await clearAllOfflineData();
      await refreshOfflineSnapshot();
      setShowClearCacheModal(false);
      showToast('Cache hors ligne vidé avec succès.', 'info');
    } catch {
      showToast('Erreur lors du vidage du cache local.', 'error');
    } finally {
      setClearingCache(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveShowOwner = prefDefaultListed ? prefDefaultShowOwner : false;
    try {
      localStorage.setItem('sa_pref_default_listed', String(prefDefaultListed));
      localStorage.setItem('sa_pref_default_show_owner', String(effectiveShowOwner));
      setPrefDefaultShowOwner(effectiveShowOwner);
      setSavedPrefs({ listed: prefDefaultListed, showOwner: effectiveShowOwner });
      showToast('Préférences enregistrées avec succès.', 'success');
    } catch {
      showToast("Impossible d'enregistrer les préférences.", 'error');
    }
  };

  const confirmLogout = async () => {
    setShowLogoutConfirmModal(false);
    await logout();
    showToast('Déconnexion effectuée avec succès.', 'info');
    navigate('/');
  };

  const handleLogoutClick = async () => {
    try {
      const count = await getDraftsCount();
      if (count > 0) {
        setPendingDraftsCount(count);
        setShowLogoutConfirmModal(true);
        return;
      }
    } catch {
      // ignorer
    }
    await confirmLogout();
  };

  const handleInstallClick = async () => {
    const success = await triggerInstall();
    if (success) {
      showToast("Application en cours d'installation.", 'success');
    }
  };

  const memberSince =
    user?.createdAt && !Number.isNaN(Date.parse(user.createdAt))
      ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

  const demoCode = import.meta.env.VITE_DEMO_CODE || 'ZIG-KBG-4271';

  return (
    <ConnectedLayout
      title="Mon compte — Espace personnel"
      subtitle="Consultez votre profil, la sécurité de votre session, vos paramètres hors ligne et l'aide."
    >
      {/* Navigation par onglets WAI-ARIA Clarté */}
      <Tabs
        variant="underline"
        tabs={[
          { id: 'profil', label: 'Profil', icon: UserIcon },
          {
            id: 'offline',
            label: 'Application & hors ligne',
            icon: Database,
            count: drafts.length || undefined,
          },
          { id: 'preferences', label: 'Préférences', icon: Sliders },
          { id: 'aide', label: 'Aide & guide', icon: HelpCircle },
        ]}
        activeTab={activeTab}
        onChange={handleTabChange}
        ariaLabel="Onglets de gestion du compte"
      />

      {/* =====================================================================
       * 1. Onglet Profil & Sécurité de session
       * ===================================================================== */}
      <TabPanel id="profil" activeTab={activeTab}>
        <div className="space-y-6">
          <Card padding="md" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar
                  name={user?.fullName || 'Utilisateur'}
                  size="lg"
                  tone={user?.role === 'ADMIN' ? 'brand' : 'institution'}
                  status={isOnline ? 'online' : 'offline'}
                />
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg sm:text-xl font-extrabold text-ink truncate">
                    {user?.fullName || 'Utilisateur'}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      status={user?.enabled === false ? 'SUSPENDED' : 'ACTIVE'}
                      label={user?.enabled === false ? 'Compte désactivé' : 'Compte actif'}
                      size="sm"
                    />
                    <Badge variant={user?.role === 'ADMIN' ? 'brand' : 'institution'} size="sm">
                      {user?.role === 'ADMIN' ? 'Administrateur' : 'Propriétaire'}
                    </Badge>
                  </div>
                </div>
              </div>

              {memberSince && (
                <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-ink-subtle" aria-hidden="true" />
                  <span>Membre depuis le {memberSince}</span>
                </div>
              )}
            </div>

            {/* Coordonnées du compte issues de l'API */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
                <span className="text-xs text-ink-muted flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-institution" aria-hidden="true" />
                  <span>Adresse e-mail</span>
                </span>
                <p className="text-sm font-semibold text-ink break-all">
                  {user?.email || (isOfflineAuth ? 'Disponible dès reconnexion' : 'Non renseignée')}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
                <span className="text-xs text-ink-muted flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-institution" aria-hidden="true" />
                  <span>Numéro de téléphone</span>
                </span>
                <p className="text-sm font-semibold text-ink font-mono">
                  {user?.phoneNumber ||
                    (isOfflineAuth ? 'Disponible dès reconnexion' : 'Non renseigné')}
                </p>
              </div>
            </div>

            {/* Transparence honnête : profil lecture seule */}
            <div className="p-3.5 rounded-xl bg-info-soft border border-info-border flex items-start gap-2.5 text-xs text-info leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Vos informations d'identité sont affichées en lecture seule depuis votre profil serveur. Aucune modification de profil n'est proposée sans prise en charge backend dédiée.
              </span>
            </div>
          </Card>

          {/* Carte Sécurité & Session */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <ShieldCheck className="w-4 h-4 text-success" aria-hidden="true" />
              <h3 className="text-sm sm:text-base font-bold text-ink">
                Sécurité et session active
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
                <span className="text-ink-muted font-medium block">État de la session</span>
                {isOfflineAuth || !isOnline ? (
                  <p className="font-semibold text-warning flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Session locale hors ligne (mode lecture & capture locale)</span>
                  </p>
                ) : (
                  <p className="font-semibold text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Session authentifiée active</span>
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
                <span className="text-ink-muted font-medium block">Protection des jetons</span>
                <p className="text-ink-secondary leading-relaxed">
                  Jeton d'accès conservé en mémoire uniquement et renouvelé automatiquement par cookie sécurisé HttpOnly.
                </p>
              </div>
            </div>

            {/* Raccourci PWA & hors ligne */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-institution shrink-0" aria-hidden="true" />
                <span className="font-semibold text-ink">
                  Installer l'application et gérer le mode hors ligne
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('offline')}
                className="font-semibold text-institution hover:text-institution-hover inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Gérer la PWA & hors ligne</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">
                La déconnexion révoque votre session sur le serveur et ferme les autres onglets ouverts.
              </p>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-danger-border bg-surface-elevated hover:bg-danger-soft text-danger text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[44px] shrink-0"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* =====================================================================
       * 2. Onglet Application & Hors ligne (PWA, codes réservés, IndexedDB)
       * ===================================================================== */}
      <TabPanel id="offline" activeTab={activeTab}>
        <div className="space-y-6">
          <Card padding="md" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-institution" aria-hidden="true" />
                  <h3 className="text-sm sm:text-base font-bold text-ink">
                    Installation de l'application (PWA)
                  </h3>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Installez SamaAdresse sur votre appareil pour y accéder rapidement et retrouver vos fiches sans réseau.
                </p>
              </div>

              {isInstalled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-soft text-success text-xs font-semibold border border-success-border shrink-0 self-start">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Installée</span>
                </span>
              ) : canInstall ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[42px] shrink-0"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Installer</span>
                </button>
              ) : null}
            </div>

            {!isInstalled && !canInstall && (
              <div className="text-xs text-ink-secondary bg-surface p-3.5 rounded-xl border border-border leading-relaxed">
                {isIos ? (
                  <p>
                    Pour installer l'application sur iPhone ou iPad : appuyez sur le bouton{' '}
                    <strong className="text-ink">Partager</strong> dans Safari, puis sélectionnez{' '}
                    <strong className="text-ink">« Sur l'écran d'accueil »</strong>.
                  </p>
                ) : (
                  <p>
                    Vous pouvez installer SamaAdresse directement depuis le menu de votre navigateur (« Installer l'application » ou « Ajouter à l'écran d'accueil »).
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card padding="md" className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-ink pb-3 border-b border-border">
              Stock local et synchronisation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink-muted">
                    Codes réservés restants
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-ink tabular-nums">
                    {activeReservedCount}
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Permettent d'attribuer immédiatement un code définitif lors d'une création sur le terrain sans connexion.
                </p>
                {isOnline && (
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isRefreshingCodes}
                      onClick={handleRefreshCodes}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface-hover text-ink text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 min-h-[38px]"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRefreshingCodes ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isRefreshingCodes ? 'Chargement…' : 'Recharger le stock'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink-muted">
                    Adresses en attente d'envoi
                  </span>
                  <span className="font-mono text-2xl font-extrabold text-ink tabular-nums">
                    {drafts.length}
                  </span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {drafts.length === 0
                    ? "Aucune adresse en file d'attente locale."
                    : `${drafts.length} ${drafts.length > 1 ? 'adresses enregistrées' : 'adresse enregistrée'} localement à transmettre au serveur.`}
                </p>
                {drafts.length > 0 && (
                  <div className="pt-1">
                    <Link
                      to="/addresses/mine?filter=pending"
                      className="text-xs font-semibold text-institution hover:text-institution-hover inline-flex items-center gap-1"
                    >
                      <span>Voir la file d'attente</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Zone sensible : vider le cache local */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-ink block">
                  Nettoyage du cache local
                </span>
                <span className="text-xs text-ink-muted block">
                  Supprime les codes réservés locaux et réinitialise la file d'attente IndexedDB sur cet appareil.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearCacheModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-danger-border bg-surface-elevated hover:bg-danger-soft text-danger text-xs font-semibold transition-colors cursor-pointer min-h-[42px] shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vider le cache hors ligne</span>
              </button>
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* =====================================================================
       * 3. Onglet Préférences locales de création
       * ===================================================================== */}
      <TabPanel id="preferences" activeTab={activeTab}>
        <Card padding="md" className="space-y-5">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border flex-wrap">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-ink">
                Préférences de création d'adresses
              </h3>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Définissez les options de visibilité pré-sélectionnées lors de chaque nouvelle création d'adresse sur cet appareil.
              </p>
            </div>
            {prefsDirty && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-soft border border-brand-border text-brand-hover text-xs font-semibold">
                Non enregistré
              </span>
            )}
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:border-border-strong cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={prefDefaultListed}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPrefDefaultListed(checked);
                    if (!checked) setPrefDefaultShowOwner(false);
                  }}
                  className="mt-0.5 w-4 h-4 rounded accent-[var(--color-brand)] cursor-pointer shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-ink block">
                    Figurer dans l'annuaire public par défaut
                  </span>
                  <span className="text-xs text-ink-muted block leading-relaxed">
                    Si coché, vos nouvelles adresses seront référencées dans l'annuaire public dès leur création.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border border-border bg-surface transition-colors ${
                  prefDefaultListed
                    ? 'hover:border-border-strong cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  checked={prefDefaultListed && prefDefaultShowOwner}
                  disabled={!prefDefaultListed}
                  onChange={(e) => setPrefDefaultShowOwner(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[var(--color-brand)] cursor-pointer disabled:cursor-not-allowed shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-semibold text-ink block">
                    Afficher mon nom comme propriétaire par défaut
                  </span>
                  <span className="text-xs text-ink-muted block leading-relaxed">
                    Visible uniquement lorsque l'adresse figure dans l'annuaire public.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Enregistrer les préférences</span>
              </button>
            </div>
          </form>
        </Card>
      </TabPanel>

      {/* =====================================================================
       * 4. Onglet Aide & guide pratique
       * ===================================================================== */}
      <TabPanel id="aide" activeTab={activeTab}>
        <Card padding="md" className="space-y-5">
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm sm:text-base font-bold text-ink">
              Foire aux questions & guide pratique
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Réponses vérifiées et transparentes sur le fonctionnement réel de SamaAdresse.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-institution text-ink-inverse inline-flex items-center justify-center text-[11px] font-bold shrink-0">
                  1
                </span>
                <span>Comment fonctionne mon code d'adresse ?</span>
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed pl-7">
                Chaque code (par exemple{' '}
                <span className="font-mono font-bold text-ink">ZIG-KBG-4271</span>) associe la zone (<span className="font-mono">ZIG</span> pour Ziguinchor), le quartier (<span className="font-mono">KBG</span> pour Boucotte - Kangourou) et un identifiant unique à 4 chiffres. Ce code est immuable et permet de situer précisément votre porte d'entrée même sans nom de rue.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-institution text-ink-inverse inline-flex items-center justify-center text-[11px] font-bold shrink-0">
                  2
                </span>
                <span>Puis-je utiliser SamaAdresse sans connexion Internet ?</span>
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed pl-7">
                Oui. Installée comme application (PWA), SamaAdresse fonctionne hors ligne. Sans réseau, l'application utilise vos codes pré-réservés (ou un code temporaire) pour enregistrer vos adresses localement dans IndexedDB et les transmettre automatiquement dès votre reconnexion.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-institution text-ink-inverse inline-flex items-center justify-center text-[11px] font-bold shrink-0">
                  3
                </span>
                <span>Qui peut consulter mon adresse et mes coordonnées ?</span>
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed pl-7">
                Par défaut, votre adresse n'est <strong className="text-ink">pas répertoriée</strong> dans l'annuaire public : seuls les visiteurs à qui vous partagez votre code court ou QR Code peuvent consulter la fiche. Votre adresse e-mail et votre numéro de téléphone ne sont jamais publiés sur la fiche publique.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-institution-soft border border-institution-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-ink block">
                Fiche publique de démonstration
              </span>
              <span className="text-xs text-ink-secondary block">
                Consultez un exemple d'adresse réelle avec plaque numérique et itinéraire interactif.
              </span>
            </div>
            <Link
              to={`/a/${demoCode}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-institution hover:bg-institution-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs min-h-[42px] shrink-0"
            >
              <span>Voir la fiche {demoCode}</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </TabPanel>

      {/* Modale de confirmation : vider le cache hors ligne */}
      <ConfirmDialog
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onConfirm={handleClearCache}
        isLoading={clearingCache}
        title="Vider le cache hors ligne ?"
        description={
          drafts.length > 0
            ? `Attention : ${drafts.length} ${drafts.length > 1 ? 'adresses en attente de synchronisation' : 'adresse en attente de synchronisation'} et vos codes pré-réservés seront définitivement supprimés de cet appareil.`
            : "Cette action effacera les codes d'adresse pré-réservés et réinitialisera le stockage hors ligne IndexedDB sur cet appareil."
        }
        confirmLabel="Vider le cache"
        cancelLabel="Annuler"
        variant="danger"
      />

      {/* Modale de confirmation : déconnexion si brouillons hors ligne en attente */}
      <ConfirmDialog
        isOpen={showLogoutConfirmModal}
        onClose={() => setShowLogoutConfirmModal(false)}
        onConfirm={confirmLogout}
        title="Adresses en attente d'envoi"
        description={
          pendingDraftsCount === 1
            ? "1 adresse enregistrée sur cet appareil n'est pas encore envoyée au serveur. Elle sera conservée localement et rattachée à ce compte lors de votre prochaine reconnexion."
            : `${pendingDraftsCount} adresses enregistrées sur cet appareil ne sont pas encore envoyées au serveur. Elles seront conservées localement et rattachées à ce compte lors de votre prochaine reconnexion.`
        }
        confirmLabel="Confirmer la déconnexion"
        cancelLabel="Annuler"
        variant="warning"
      />
    </ConnectedLayout>
  );
};
