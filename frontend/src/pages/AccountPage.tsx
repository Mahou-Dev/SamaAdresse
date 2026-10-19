import React, { useState, useEffect } from 'react';
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
import type { OfflineDraft, OfflineReservedCode } from '../utils/offlineDb';
import { syncManager } from '../utils/syncManager';
import { ConnectedLayout } from '../components/ConnectedLayout';
import {
  Card,
  Tabs,
  TabPanel,
  ConfirmDialog,
  StatusBadge,
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
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { canInstall, isInstalled, isIos, triggerInstall } = usePwaInstall();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Gestion des onglets
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    ['profil', 'offline', 'preferences', 'aide'].includes(tabFromUrl || '')
      ? tabFromUrl!
      : 'profil'
  );

  // Synchronisation avec l'URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['profil', 'offline', 'preferences', 'aide'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'profil' ? {} : { tab: tabId });
  };

  // État Hors ligne
  const [reservedCodes, setReservedCodes] = useState<OfflineReservedCode[]>([]);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [isRefreshingCodes, setIsRefreshingCodes] = useState<boolean>(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState<boolean>(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);

  // État Préférences
  const [prefDefaultListed, setPrefDefaultListed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sa_pref_default_listed') === 'true';
    } catch {
      return false;
    }
  });

  const [prefDefaultShowOwner, setPrefDefaultShowOwner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sa_pref_default_show_owner') === 'true';
    } catch {
      return false;
    }
  });

  const loadOfflineData = async () => {
    try {
      const [codes, draftsList] = await Promise.all([
        getReservedCodes(),
        getDrafts(),
      ]);
      setReservedCodes(codes);
      setDrafts(draftsList);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadOfflineData();
  }, []);

  const handleRefreshCodes = async () => {
    setIsRefreshingCodes(true);
    try {
      await syncManager.refreshReservedCodes();
      await loadOfflineData();
      showToast('Stock de codes réservés actualisé.', 'success');
    } catch {
      showToast('Impossible de réapprovisionner les codes.', 'error');
    } finally {
      setIsRefreshingCodes(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await clearAllOfflineData();
      await loadOfflineData();
      setShowClearCacheModal(false);
      showToast('Cache hors ligne vidé avec succès.', 'info');
    } catch {
      showToast('Erreur lors du vidage du cache.', 'error');
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('sa_pref_default_listed', String(prefDefaultListed));
      localStorage.setItem('sa_pref_default_show_owner', String(prefDefaultShowOwner));
      showToast('Préférences enregistrées avec succès.', 'success');
    } catch {
      showToast("Impossible d'enregistrer les préférences.", 'error');
    }
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
      showToast("Application en cours d'installation.", 'success');
    }
  };

  const activeReservedCount = reservedCodes.filter(
    (c) => c.status === 'RESERVED' && new Date(c.expiresAt) > new Date()
  ).length;

  const demoCode = import.meta.env.VITE_DEMO_CODE || 'ZIG-KBG-4271';

  return (
    <ConnectedLayout
      title="Mon compte — Espace personnel"
      subtitle="Gérez votre profil, vos paramètres hors ligne, vos préférences et consultez l'aide."
    >
      {/* Navigation par Onglets conforme WAI-ARIA */}
      <div className="pb-2">
        <Tabs
          tabs={[
            { id: 'profil', label: 'Profil', icon: UserIcon },
            { id: 'offline', label: 'Application & hors ligne', icon: Database, count: drafts.length || undefined },
            { id: 'preferences', label: 'Préférences', icon: Sliders },
            { id: 'aide', label: 'Aide & guide', icon: HelpCircle },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
          ariaLabel="Onglets de gestion du compte"
        />
      </div>

      {/* =========================================================================
       * 1. Onglet Profil (Lecture seule sobre)
       * ========================================================================= */}
      <TabPanel id="profil" activeTab={activeTab}>
        <div className="space-y-6">
          <Card padding="md" className="space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#766B5B]/30">
              <div className="w-12 h-12 rounded-full bg-[#12304F] text-[#FBF7EF] flex items-center justify-center text-lg font-bold shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#231A15]">
                  {user?.fullName || 'Utilisateur'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status="ACTIVE" label="Compte actif" size="sm" />
                  <span className="text-xs text-[#5C4D44] font-medium">
                    Rôle : {user?.role === 'ADMIN' ? 'Administrateur' : 'Propriétaire'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#F2ECE1] border border-[#766B5B] space-y-1">
                <span className="text-[#5C4D44] text-[11px] flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#12304F]" />
                  <span>Adresse e-mail</span>
                </span>
                <p className="font-semibold text-[#231A15] break-all">
                  {user?.email || 'Non renseignée'}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F2ECE1] border border-[#766B5B] space-y-1">
                <span className="text-[#5C4D44] text-[11px] flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#12304F]" />
                  <span>Numéro de téléphone</span>
                </span>
                <p className="font-semibold text-[#231A15] font-mono">
                  {user?.phoneNumber || 'Non renseigné'}
                </p>
              </div>
            </div>

            {/* Note informative vraie sur la modification du profil */}
            <div className="p-3.5 rounded-lg bg-[#F2ECE1]/60 border border-[#766B5B]/40 flex items-start gap-2.5 text-xs text-[#5C4D44]">
              <Info className="w-4 h-4 text-[#12304F] shrink-0 mt-0.5" />
              <span>
                Ces informations sont en lecture seule. La mise à jour directe de votre nom, adresse e-mail ou téléphone sera proposée dans une prochaine version.
              </span>
            </div>

            {/* Raccourci vers l'installation PWA */}
            <div className="p-3.5 rounded-lg bg-[#F2ECE1] border border-[#766B5B] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#12304F] shrink-0" />
                <span className="font-bold text-[#231A15]">Installer l'application</span>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('offline')}
                className="font-bold text-[#1D528F] hover:underline cursor-pointer"
              >
                Gérer la PWA & hors ligne →
              </button>
            </div>

            <div className="pt-2 border-t border-[#766B5B]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#DC2626]/40 bg-[#FBF7EF] hover:bg-[#FEF2F2] text-[#991B1B] text-xs font-bold transition shadow-sm cursor-pointer touch-target"
              >
                <LogOut className="w-4 h-4 text-[#991B1B]" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* =========================================================================
       * 2. Onglet Application et Hors ligne
       * ========================================================================= */}
      <TabPanel id="offline" activeTab={activeTab}>
        <div className="space-y-6">
          {/* Section PWA : Installation */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#766B5B]/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#12304F]" />
                  <h3 className="text-sm sm:text-base font-bold text-[#231A15]">
                    Installation de l'application (PWA)
                  </h3>
                </div>
                <p className="text-xs text-[#5C4D44]">
                  Installez SamaAdresse sur votre appareil pour y accéder sans navigateur et retrouver vos fiches hors ligne.
                </p>
              </div>

              {isInstalled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A6B44]/10 text-[#2A6B44] text-xs font-semibold border border-[#2A6B44]/20 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Installée</span>
                </span>
              ) : canInstall ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-white text-xs font-bold transition shadow-sm cursor-pointer touch-target shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Installer</span>
                </button>
              ) : null}
            </div>

            {!isInstalled && !canInstall && (
              <div className="text-xs text-[#5C4D44] bg-[#F2ECE1] p-3 rounded-lg border border-[#766B5B]">
                {isIos ? (
                  <p>
                    Pour installer l'application sur iPhone ou iPad : appuyez sur le bouton <strong>Partager</strong> dans Safari, puis sélectionnez <strong>« Sur l'écran d'accueil »</strong>.
                  </p>
                ) : (
                  <p>
                    Vous pouvez installer SamaAdresse directement depuis le menu de votre navigateur (« Installer l'application » ou « Ajouter à l'écran d'accueil »).
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Section Codes réservés & File d'attente */}
          <Card padding="md" className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-[#231A15] pb-2 border-b border-[#766B5B]/30">
              Stock local et synchronisation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tuile codes réservés */}
              <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5C4D44]">Codes réservés restants</span>
                  <span className="font-mono text-xl font-extrabold text-[#231A15]">
                    {activeReservedCount}
                  </span>
                </div>
                <p className="text-[11px] text-[#5C4D44] leading-relaxed">
                  Permettent d'attribuer immédiatement un code définitif lors d'une capture sur le terrain sans réseau.
                </p>
                {isOnline && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isRefreshingCodes}
                      onClick={handleRefreshCodes}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCodes ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingCodes ? 'Chargement...' : 'Recharger le stock'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tuile adresses en attente */}
              <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#5C4D44]">Adresses en attente d'envoi</span>
                  <span className="font-mono text-xl font-extrabold text-[#231A15]">
                    {drafts.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#5C4D44] leading-relaxed">
                  {drafts.length === 0
                    ? 'Aucune adresse en file d’attente locale.'
                    : `${drafts.length} adresse${drafts.length > 1 ? 's' : ''} enregistrée${drafts.length > 1 ? 's' : ''} localement à transmettre au serveur.`}
                </p>
                {drafts.length > 0 && (
                  <div className="pt-2">
                    <Link
                      to="/addresses/mine?filter=pending"
                      className="text-xs font-bold text-[#12304F] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Voir la file d'attente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Zone de danger : Vider le cache hors ligne */}
            <div className="pt-3 border-t border-[#766B5B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#231A15] block">
                  Nettoyage du cache local
                </span>
                <span className="text-xs text-[#5C4D44] block">
                  Supprime les codes réservés locaux et réinitialise la file d'attente IndexedDB.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearCacheModal(true)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-[#DC2626]/40 bg-[#FBF7EF] hover:bg-[#FEF2F2] text-[#991B1B] text-xs font-bold transition cursor-pointer touch-target shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider le cache hors ligne</span>
              </button>
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* =========================================================================
       * 3. Onglet Préférences (Valeurs par défaut assistant création)
       * ========================================================================= */}
      <TabPanel id="preferences" activeTab={activeTab}>
        <Card padding="md" className="space-y-5">
          <div className="pb-3 border-b border-[#766B5B]/30">
            <h3 className="text-sm sm:text-base font-bold text-[#231A15]">
              Préférences de création d'adresses
            </h3>
            <p className="text-xs text-[#5C4D44] mt-0.5">
              Définissez les options de visibilité qui seront pré-cochées lors de chaque nouvelle création d'adresse sur cet appareil.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="space-y-3">
              {/* Option 1 : Figurer dans l'annuaire par défaut */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#766B5B] bg-[#F2ECE1] cursor-pointer hover:bg-[#F2ECE1]/70 transition">
                <input
                  type="checkbox"
                  checked={prefDefaultListed}
                  onChange={(e) => setPrefDefaultListed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#B84A24] focus:ring-[#B84A24] border-[#766B5B] shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#231A15] block">
                    Figurer dans l'annuaire public par défaut
                  </span>
                  <span className="text-xs text-[#5C4D44] block">
                    Si coché, vos nouvelles adresses seront immédiatement référencées dans l'annuaire public de recherche.
                  </span>
                </div>
              </label>

              {/* Option 2 : Afficher le nom de propriétaire par défaut */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#766B5B] bg-[#F2ECE1] cursor-pointer hover:bg-[#F2ECE1]/70 transition">
                <input
                  type="checkbox"
                  checked={prefDefaultShowOwner}
                  onChange={(e) => setPrefDefaultShowOwner(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#B84A24] focus:ring-[#B84A24] border-[#766B5B] shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#231A15] block">
                    Afficher mon nom comme propriétaire par défaut
                  </span>
                  <span className="text-xs text-[#5C4D44] block">
                    Si coché, votre nom complet sera visible sur la fiche d'annuaire de vos nouvelles adresses.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-[#766B5B]/30 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-white text-xs font-bold transition shadow-sm cursor-pointer touch-target"
              >
                <span>Enregistrer les préférences</span>
              </button>
            </div>
          </form>
        </Card>
      </TabPanel>

      {/* =========================================================================
       * 4. Onglet Aide & guide (3 réponses courtes et vraies + lien démo)
       * ========================================================================= */}
      <TabPanel id="aide" activeTab={activeTab}>
        <div className="space-y-6">
          <Card padding="md" className="space-y-5">
            <div className="pb-3 border-b border-[#766B5B]/30">
              <h3 className="text-sm sm:text-base font-bold text-[#231A15]">
                Foire aux questions & guide pratique
              </h3>
              <p className="text-xs text-[#5C4D44] mt-0.5">
                Des réponses courtes, vérifiées et transparentes sur le fonctionnement de SamaAdresse.
              </p>
            </div>

            <div className="space-y-4">
              {/* Question 1 */}
              <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-[#231A15] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#12304F] text-[#FBF7EF] inline-flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <span>Comment fonctionne mon code d'adresse ?</span>
                </h4>
                <p className="text-xs text-[#5C4D44] leading-relaxed pl-7">
                  Chaque code (par exemple <span className="font-mono font-bold text-[#231A15]">ZIG-KBG-4271</span>) est composé du code de la ville (<span className="font-mono">ZIG</span> pour Ziguinchor), du trigramme du quartier (<span className="font-mono">KBG</span> pour Kandé Baneto Gare) et d'un numéro unique à 4 chiffres. Ce code est immuable et permet de situer précisément votre porte d'entrée même sans nom de rue.
                </p>
              </div>

              {/* Question 2 */}
              <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-[#231A15] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#12304F] text-[#FBF7EF] inline-flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <span>Puis-je utiliser SamaAdresse sans connexion Internet ?</span>
                </h4>
                <p className="text-xs text-[#5C4D44] leading-relaxed pl-7">
                  Oui. Installée comme application (PWA), SamaAdresse fonctionne complètement hors ligne. Lorsque vous êtes sur le terrain sans réseau, l'application utilise les codes pré-réservés de votre appareil pour vous attribuer immédiatement une plaque. Vos adresses sont conservées en mémoire locale et transmises automatiquement dès que votre connexion est rétablie.
                </p>
              </div>

              {/* Question 3 */}
              <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-[#231A15] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#12304F] text-[#FBF7EF] inline-flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <span>Qui peut consulter mon adresse et mes coordonnées ?</span>
                </h4>
                <p className="text-xs text-[#5C4D44] leading-relaxed pl-7">
                  Par défaut, votre adresse n'est <strong>pas répertoriée</strong> dans l'annuaire public : seuls les visiteurs à qui vous communiquez directement votre code court ou votre QR Code peuvent afficher votre fiche. Si vous activez la publication dans l'annuaire, vous pouvez choisir de masquer votre nom complet de propriétaire.
                </p>
              </div>
            </div>

            {/* Fiche de démonstration publique */}
            <div className="p-4 rounded-xl bg-[#12304F]/5 border border-[#12304F]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#231A15] block">
                  Fiche publique de démonstration
                </span>
                <span className="text-xs text-[#5C4D44] block">
                  Consultez un exemple d'adresse réelle avec plaque et itinéraire interactif.
                </span>
              </div>
              <Link
                to={`/a/${demoCode}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#12304F] hover:bg-[#0C233B] text-white text-xs font-bold transition shadow-sm cursor-pointer touch-target shrink-0"
              >
                <span>Voir la fiche {demoCode}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* Modale de confirmation pour vider le cache hors ligne */}
      <ConfirmDialog
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onConfirm={handleClearCache}
        title="Vider le cache hors ligne ?"
        description="Cette action effacera les codes d'adresse pré-réservés et toutes les adresses en attente de synchronisation sur cet appareil. Cette opération est irréversible."
        confirmLabel="Vider le cache"
        cancelLabel="Annuler"
        variant="danger"
      />

      {/* Modale de confirmation déconnexion si adresses en attente */}
      <ConfirmDialog
        isOpen={showLogoutConfirmModal}
        onClose={() => setShowLogoutConfirmModal(false)}
        onConfirm={confirmLogout}
        title="Adresses en attente d'envoi"
        description={
          pendingDraftsCount === 1
            ? "1 adresse enregistrée sur cet appareil n'est pas encore envoyée au serveur. Elle sera conservée mais rattachée à ce compte lors de votre prochaine reconnexion."
            : `${pendingDraftsCount} adresses enregistrées sur cet appareil ne sont pas encore envoyées au serveur. Elles seront conservées mais rattachées à ce compte lors de votre prochaine reconnexion.`
        }
        confirmLabel="Confirmer la déconnexion"
        cancelLabel="Annuler"
        variant="warning"
      />
    </ConnectedLayout>
  );
};
