import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  getMyAddresses,
  uploadAddressPhoto,
  archiveAddress,
  restoreAddress,
} from '../api/addressApi';
import type { AddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressPlate } from '../components/AddressPlate';
import { ShareAddress } from '../components/ShareAddress';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { syncManager } from '../utils/syncManager';
import { getDrafts } from '../utils/offlineDb';
import type { OfflineDraft } from '../utils/offlineDb';
import { ConnectedLayout } from '../components/ConnectedLayout';
import {
  ConfirmDialog,
  StatusBadge,
  EmptyState,
} from '../components/ui';
import { getLocationTypeLabel } from '../utils/locationTypes';
import {
  Plus,
  Loader2,
  ExternalLink,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  QrCode,
  Share2,
  RefreshCw,
  MoreVertical,
  Pencil,
  Archive,
  RotateCcw,
  ShieldAlert,
  X,
  CheckCircle2,
  WifiOff,
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter,
} from 'lucide-react';

export const MyAddressesPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [codeChangedNotification, setCodeChangedNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingAddressId, setUploadingAddressId] = useState<string | null>(null);
  const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});

  // Filtres et Recherche
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [quartierFilter, setQuartierFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'OLD' | 'CODE_ASC' | 'CODE_DESC'>('RECENT');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Menu Actions par adresse
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Modale de confirmation d'archivage
  const [archiveTarget, setArchiveTarget] = useState<AddressResponse | null>(null);
  const [archiving, setArchiving] = useState<boolean>(false);

  // Notification d'archivage récent
  const [recentlyArchived, setRecentlyArchived] = useState<AddressResponse | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetAddressId, setTargetAddressId] = useState<string | null>(null);

  // Initialisation des filtres depuis les searchParams (?status=ACTIVE|SUSPENDED|ARCHIVED, ?filter=pending)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const filterParam = searchParams.get('filter');

    if (filterParam === 'pending') {
      setStatusFilter('PENDING');
    } else if (statusParam && ['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(statusParam.toUpperCase())) {
      setStatusFilter(statusParam.toUpperCase());
    }
  }, [searchParams]);

  const fetchAddresses = async (silent = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMyAddresses();
      setAddresses(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Impossible de charger vos adresses.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async () => {
    try {
      const list = await getDrafts();
      setDrafts(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAddresses(false);
    loadDrafts();

    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'SYNC_START') {
        setIsSyncing(true);
      } else if (event.type === 'SYNC_PROGRESS') {
        loadDrafts();
      } else if (event.type === 'SYNC_SUCCESS') {
        if (event.draftId) {
          setDrafts((prev) => prev.filter((d) => d.id !== event.draftId));
        } else {
          loadDrafts();
        }
        if (event.address) {
          setAddresses((prev) => {
            if (prev.some((a) => a.id === event.address!.id || a.code === event.address!.code)) {
              return prev;
            }
            return [event.address!, ...prev];
          });
          showToast(`Adresse ${event.address.code} synchronisée !`, 'success');
        }
      } else if (event.type === 'CODE_CHANGED') {
        if (event.message) {
          setCodeChangedNotification(event.message);
        }
      } else if (event.type === 'SYNC_COMPLETE') {
        setIsSyncing(false);
        loadDrafts();
        fetchAddresses(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSyncNow = async () => {
    await syncManager.syncNow();
    await loadDrafts();
    await fetchAddresses(true);
  };

  // Fermer le menu Actions au clic extérieur ou Échap
  useEffect(() => {
    if (!openMenuId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const updated = await archiveAddress(archiveTarget.id);
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setRecentlyArchived(updated);
      setArchiveTarget(null);
      showToast(`Adresse ${updated.code} archivée.`, 'info');
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'archiver cette adresse.", 'error');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (addressId: string) => {
    setRestoringId(addressId);
    try {
      const updated = await restoreAddress(addressId);
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (recentlyArchived?.id === addressId) {
        setRecentlyArchived(null);
      }
      showToast(`Adresse ${updated.code} restaurée avec succès.`, 'success');
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de restaurer cette adresse.', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownloadQrCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/api/addresses/${code}/qrcode`;
    link.download = `samaadresse-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Téléchargement du QR Code ${code} démarré`, 'success');
  };

  const handleOpenPhotoPicker = (addressId: string) => {
    setTargetAddressId(addressId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAddressId) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Format non supporté. Choisissez une image JPEG, PNG ou WebP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Taille d'image trop grande (max 5 Mo).", 'error');
      return;
    }

    setUploadingAddressId(targetAddressId);
    try {
      const updatedAddress = await uploadAddressPhoto(targetAddressId, file);
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === updatedAddress.id ? updatedAddress : addr))
      );
      setFailedPhotos((prev) => {
        const next = { ...prev };
        delete next[targetAddressId];
        return next;
      });
      showToast('Photo de façade mise à jour avec succès !', 'success');
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : "Erreur lors de l'upload de la photo.", 'error');
    } finally {
      setUploadingAddressId(null);
      setTargetAddressId(null);
    }
  };

  // Liste unique des quartiers présents pour le filtre
  const availableQuartiers = useMemo(() => {
    const set = new Set<string>();
    addresses.forEach((a) => {
      if (a.quartier) set.add(a.quartier);
    });
    return Array.from(set).sort();
  }, [addresses]);

  // Filtrage combiné : Recherche, Statut, Quartier, Type
  const filteredAddresses = useMemo(() => {
    let result = [...addresses];

    // Filtre statut
    if (statusFilter === 'ACTIVE') {
      result = result.filter((a) => a.status === 'ACTIVE');
    } else if (statusFilter === 'SUSPENDED') {
      result = result.filter((a) => a.status === 'SUSPENDED');
    } else if (statusFilter === 'ARCHIVED') {
      result = result.filter((a) => a.status === 'ARCHIVED');
    } else if (statusFilter === 'PENDING') {
      // Pour PENDING, on ne renvoie rien des adresses serveur, les brouillons s'affichent séparément
      result = [];
    }

    // Filtre quartier
    if (quartierFilter !== 'ALL') {
      result = result.filter((a) => a.quartier?.toUpperCase() === quartierFilter.toUpperCase());
    }

    // Filtre type
    if (typeFilter !== 'ALL') {
      result = result.filter((a) => a.locationType === typeFilter);
    }

    // Recherche par code ou description
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.quartier?.toLowerCase().includes(q)
      );
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === 'RECENT') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'OLD') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'CODE_ASC') {
        return a.code.localeCompare(b.code);
      }
      if (sortBy === 'CODE_DESC') {
        return b.code.localeCompare(a.code);
      }
      return 0;
    });

    return result;
  }, [addresses, statusFilter, quartierFilter, typeFilter, searchQuery, sortBy]);

  const activeCount = useMemo(() => addresses.filter((a) => a.status === 'ACTIVE').length, [addresses]);
  const archivedCount = useMemo(() => addresses.filter((a) => a.status === 'ARCHIVED').length, [addresses]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setQuartierFilter('ALL');
    setTypeFilter('ALL');
    setSortBy('RECENT');
    setSearchParams({});
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    quartierFilter !== 'ALL' ||
    typeFilter !== 'ALL';

  return (
    <ConnectedLayout
      title="Mes adresses"
      subtitle="Recherchez, filtrez et gérez vos plaques géolocalisées."
      action={{
        label: 'Nouvelle adresse',
        to: '/addresses/new',
        icon: Plus,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Notification de code réassigné */}
      {codeChangedNotification && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#1D528F]/10 border border-[#1D528F]/30 text-[#1D528F] text-xs sm:text-sm font-medium flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>{codeChangedNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setCodeChangedNotification(null)}
            className="px-3 py-1.5 rounded-lg bg-[#FBF7EF] border border-[#1D528F]/30 text-xs font-bold text-[#1D528F] hover:bg-[#1D528F]/10 transition touch-target cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Notification d'adresse récemment archivée avec bouton Annuler */}
      {recentlyArchived && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-sm flex items-center justify-between gap-3 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2 text-[#231A15] font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2A6B44] shrink-0" />
            <span>
              Adresse archivée (<span className="font-mono font-bold">{recentlyArchived.code}</span>)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleRestore(recentlyArchived.id)}
              disabled={restoringId === recentlyArchived.id}
              className="px-3 py-1.5 rounded-lg border border-[#1D528F] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs font-bold transition cursor-pointer touch-target"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setRecentlyArchived(null)}
              className="p-1 text-[#5C4D44] hover:text-[#231A15] cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Section En attente d'envoi hors ligne (si présente ou si filtre PENDING actif) */}
      {(drafts.length > 0 && (statusFilter === 'ALL' || statusFilter === 'PENDING')) && (
        <section
          aria-labelledby="drafts-heading"
          className="p-4 rounded-xl bg-[#FBF7EF] border border-[#8A3112]/40 shadow-sm space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#766B5B]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#8A3112]" />
              <h2 id="drafts-heading" className="text-sm font-bold text-[#231A15]">
                File d'attente hors ligne ({drafts.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#231A15] hover:bg-[#3D2E24] text-[#FBF7EF] text-xs font-bold transition disabled:opacity-50 min-h-[36px] cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synchronisation...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Envoyer maintenant</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {drafts.map((draft) => {
              const displayCode = draft.reservedCode || `${draft.zone}-${draft.quartier}-????`;
              const formattedDate = new Date(draft.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={draft.id}
                  className="p-3 bg-[#F2ECE1] rounded-lg border border-[#766B5B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-mono text-xs font-bold text-[#231A15] whitespace-nowrap">
                        {displayCode}
                      </span>
                      <span className="text-[#5C4D44] truncate">
                        • {draft.description || 'Sans description'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C4D44]">
                      Enregistrée le {formattedDate} ({draft.quartier})
                    </p>
                    {draft.lastError && (
                      <p className="text-[11px] text-[#8A3112]">{draft.lastError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={draft.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Onglets d'état d'adresses (Actives / Archivées) */}
      <div
        role="tablist"
        aria-label="Filtrer par état des adresses"
        className="flex items-center gap-2 border-b border-[#766B5B]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'ALL' || statusFilter === 'ACTIVE'}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer -mb-px ${
            statusFilter === 'ALL' || statusFilter === 'ACTIVE'
              ? 'border-[#B84A24] text-[#231A15]'
              : 'border-transparent text-[#5C4D44] hover:text-[#231A15]'
          }`}
        >
          Actives ({activeCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'ARCHIVED'}
          onClick={() => setStatusFilter('ARCHIVED')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer -mb-px ${
            statusFilter === 'ARCHIVED'
              ? 'border-[#B84A24] text-[#231A15]'
              : 'border-transparent text-[#5C4D44] hover:text-[#231A15]'
          }`}
        >
          Archivées ({archivedCount})
        </button>
      </div>

      {/* =========================================================================
       * Barre de filtres, recherche et tri
       * ========================================================================= */}
      <section
        aria-label="Filtres et recherche des adresses"
        className="p-4 rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-3"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Champ de recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C4D44]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par code (ex: ZIG-KBG, 4271), description..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] placeholder-[#5C4D44] focus:outline-none focus:border-[#12304F] focus:ring-1 focus:ring-[#12304F] transition"
            />
          </div>

          {/* Filtres dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre statut */}
            <select
              aria-label="Filtrer par statut"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] focus:outline-none focus:border-[#12304F]"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actives</option>
              <option value="SUSPENDED">Suspendues</option>
              <option value="ARCHIVED">Archivées</option>
              <option value="PENDING">En attente hors ligne</option>
            </select>

            {/* Filtre quartier */}
            {availableQuartiers.length > 0 && (
              <select
                aria-label="Filtrer par quartier"
                value={quartierFilter}
                onChange={(e) => setQuartierFilter(e.target.value)}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] focus:outline-none focus:border-[#12304F]"
              >
                <option value="ALL">Tous quartiers</option>
                {availableQuartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            )}

            {/* Filtre type */}
            <select
              aria-label="Filtrer par type de lieu"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] focus:outline-none focus:border-[#12304F]"
            >
              <option value="ALL">Tous types</option>
              <option value="MAISON">Maison</option>
              <option value="COMMERCE">Commerce</option>
              <option value="INSTITUTION">Institution</option>
            </select>

            {/* Tri */}
            <select
              aria-label="Trier la liste"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] focus:outline-none focus:border-[#12304F]"
            >
              <option value="RECENT">Plus récentes</option>
              <option value="OLD">Plus anciennes</option>
              <option value="CODE_ASC">Code (A → Z)</option>
              <option value="CODE_DESC">Code (Z → A)</option>
            </select>

            {/* Bascule Grille / Liste visible en >= 1024 px */}
            <div className="hidden lg:flex items-center gap-1 border border-[#766B5B] rounded-lg p-0.5 bg-[#F2ECE1]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Vue grille"
                aria-pressed={viewMode === 'grid'}
                className={`p-1.5 rounded text-xs transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#12304F] text-[#FBF7EF] shadow-sm'
                    : 'text-[#5C4D44] hover:text-[#231A15]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Vue liste"
                aria-pressed={viewMode === 'list'}
                className={`p-1.5 rounded text-xs transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#12304F] text-[#FBF7EF] shadow-sm'
                    : 'text-[#5C4D44] hover:text-[#231A15]'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ligne d'état des filtres et compteur de résultats (hauteur réservée min-h-[20px] pour CLS < 0,1) */}
        <div className="flex items-center justify-between text-xs text-[#5C4D44] pt-2 border-t border-[#766B5B]/20 min-h-[24px]">
          <span>
            {loading ? (
              <span className="inline-block w-28 h-4 bg-[#E6DDD0] rounded animate-pulse align-middle" />
            ) : statusFilter === 'PENDING' ? (
              `${drafts.length} adresse${drafts.length > 1 ? 's' : ''} en attente hors ligne`
            ) : (
              `Affichage de ${filteredAddresses.length} sur ${addresses.length} adresse${
                addresses.length > 1 ? 's' : ''
              }`
            )}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#8A3112] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
       * Liste des Adresses : Chargement, Erreur, Vide ou Résultats
       * ========================================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[750px]" aria-label="Chargement des adresses">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm p-4 min-h-[196px] animate-pulse space-y-3"
            >
              <div className="h-6 bg-[#E6DDD0] rounded w-1/3" />
              <div className="h-16 bg-[#F2ECE1] rounded" />
              <div className="h-4 bg-[#E6DDD0] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-xl bg-[#FBF7EF] border border-[#8A3112]/40 text-[#8A3112] text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#8A3112] shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAddresses(false)}
            className="px-4 py-2 rounded-lg bg-[#8A3112] hover:bg-[#9A3816] text-[#FBF7EF] text-xs font-bold transition cursor-pointer touch-target shrink-0"
          >
            Réessayer
          </button>
        </div>
      ) : addresses.length === 0 && drafts.length === 0 ? (
        <EmptyState
          illustration="/images/etat-vide-144w.webp"
          illustrationSrcSet="/images/etat-vide-144w.webp 144w, /images/etat-vide-288w.webp 288w, /images/etat-vide-480w.webp 480w"
          illustrationSizes="(max-width: 640px) 112px, 144px"
          title="Vous n'avez pas encore d'adresse enregistrée"
          description="Créez votre première adresse en renseignant votre position GPS devant votre bâtiment."
          action={{
            label: 'Créer ma première adresse',
            to: '/addresses/new',
            icon: Plus,
          }}
        />
      ) : filteredAddresses.length === 0 && statusFilter !== 'PENDING' ? (
        <EmptyState
          icon={Filter}
          title="Aucun résultat pour cette recherche"
          description="Aucune adresse ne correspond à vos filtres actuels. Modifiez ou réinitialisez vos critères."
          action={{
            label: 'Effacer les filtres',
            onClick: resetFilters,
            icon: RefreshCw,
          }}
        />
      ) : viewMode === 'grid' || window.innerWidth < 1024 ? (
        /* VUE GRILLE (Cartes denses avec AddressPlate) */
        <div data-testid="addresses-grid-view" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAddresses.map((address) => {
            const hasPhoto = !!address.photoUrl && !failedPhotos[address.id];
            const photoSrc = address.photoUrl?.startsWith('http')
              ? address.photoUrl
              : `${import.meta.env.VITE_API_BASE_URL || ''}${address.photoUrl}`;
            const isArchived = address.status === 'ARCHIVED';
            const isSuspended = address.status === 'SUSPENDED';

            return (
              <div
                key={address.id}
                className="rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-[0_2px_0_rgba(35,26,21,0.06)] p-3 sm:p-4 flex flex-col justify-between gap-3 relative min-h-[196px]"
              >
                {/* Alerte suspension */}
                {isSuspended && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#FBF7EF] border border-[#8A3112]/40 text-[#8A3112] text-[11px] font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Suspendue par la modération{address.moderationNotice ? ` (${address.moderationNotice})` : ''}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 items-start">
                  {/* Vignette Photo */}
                  <div className="w-16 h-16 min-w-16 min-h-16 rounded-lg bg-[#F2ECE1] border border-[#766B5B] overflow-hidden relative shrink-0 flex items-center justify-center">
                    {hasPhoto ? (
                      <img
                        src={photoSrc}
                        alt={`Façade ${address.code}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setFailedPhotos((prev) => ({ ...prev, [address.id]: true }))}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#5C4D44]" />
                    )}

                    {uploadingAddressId === address.id && (
                      <div className="absolute inset-0 bg-[#231A15]/60 flex items-center justify-center text-[#FBF7EF]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Plaque et description */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <AddressPlate
                          code={address.code}
                          zone={address.zone}
                          type={address.locationType}
                          size="sm"
                          showCopy={false}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <p
                      className="text-xs text-[#231A15] font-medium line-clamp-2 leading-tight"
                      title={address.description}
                    >
                      {address.description || 'Sans description'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <StatusBadge status={address.status} size="sm" />
                      <span className="text-[#5C4D44] text-[11px] font-mono">
                        {new Date(address.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {address.listed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#1D528F]/10 text-[#1D528F] border border-[#1D528F]/30">
                          Dans l'annuaire
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions barre */}
                <div className="pt-2 border-t border-[#766B5B]/30 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {!isArchived && !isSuspended && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShareOpenId(shareOpenId === address.id ? null : address.id)}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline min-h-[36px] px-1.5 cursor-pointer touch-target"
                          aria-expanded={shareOpenId === address.id}
                        >
                          <Share2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{shareOpenId === address.id ? 'Fermer' : 'Partager'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadQrCode(address.code, e)}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline min-h-[36px] px-1.5 cursor-pointer touch-target"
                        >
                          <QrCode className="w-3.5 h-3.5 shrink-0" />
                          <span>QR</span>
                        </button>

                        <Link
                          to={`/a/${address.code}`}
                          title="Ouvrir la fiche publique"
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline min-h-[36px] px-1.5 touch-target"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>Fiche</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleOpenPhotoPicker(address.id)}
                          disabled={uploadingAddressId === address.id}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline min-h-[36px] px-1.5 cursor-pointer touch-target disabled:opacity-50"
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0" />
                          <span>{hasPhoto ? 'Photo' : '+Photo'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Menu Plus d'actions */}
                  {!isSuspended && (
                    <div
                      className="relative shrink-0 ml-auto"
                      ref={openMenuId === address.id ? menuContainerRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === address.id ? null : address.id)}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === address.id}
                        aria-label={`Actions pour ${address.code}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] min-h-[36px] min-w-[36px] cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4 text-[#5C4D44]" />
                      </button>

                      {openMenuId === address.id && (
                        <div
                          role="menu"
                          aria-label={`Options pour ${address.code}`}
                          className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-lg py-1 z-30"
                        >
                          {!isArchived ? (
                            <>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/addresses/${address.id}/edit`);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#231A15] hover:bg-[#F2ECE1] flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#1D528F]" />
                                <span>Modifier</span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setArchiveTarget(address);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#8A3112] hover:bg-[#F2ECE1] flex items-center gap-2 cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archiver</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              disabled={restoringId === address.id}
                              onClick={() => {
                                setOpenMenuId(null);
                                handleRestore(address.id);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#1D528F] hover:bg-[#F2ECE1] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurer</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bloc de partage */}
                {shareOpenId === address.id && !isArchived && (
                  <div className="pt-2 border-t border-[#766B5B]/30">
                    <ShareAddress code={address.code} description={address.description} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VUE LISTE (Desktop >= 1024 px : Tableau dense) */
        <div data-testid="addresses-list-view" className="rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F2ECE1] border-b border-[#766B5B] text-[#231A15] font-bold">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Quartier & Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#766B5B]/20">
              {filteredAddresses.map((address) => {
                const isArchived = address.status === 'ARCHIVED';
                const isSuspended = address.status === 'SUSPENDED';

                return (
                  <tr key={address.id} className="hover:bg-[#F2ECE1]/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#231A15]">
                      <Link to={`/a/${address.code}`} className="hover:underline text-[#12304F]">
                        {address.code}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={address.status} size="sm" />
                        {isSuspended && (
                          <span className="text-[11px] font-bold text-[#8A3112]">
                            Suspendue par la modération
                          </span>
                        )}
                        {address.listed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#1D528F]/10 text-[#1D528F] border border-[#1D528F]/30">
                            Dans l'annuaire
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5C4D44]">
                      <span className="font-semibold text-[#231A15]">{address.quartier}</span> —{' '}
                      {getLocationTypeLabel(address.locationType)}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[#5C4D44]" title={address.description}>
                      {address.description || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#5C4D44]">
                      {new Date(address.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/a/${address.code}`}
                        title="Ouvrir la fiche publique"
                        className="font-bold text-[#1D528F] hover:underline"
                      >
                        Voir
                      </Link>
                      {!isArchived && !isSuspended && (
                        <Link
                          to={`/addresses/${address.id}/edit`}
                          className="font-semibold text-[#5C4D44] hover:text-[#231A15]"
                        >
                          Modifier
                        </Link>
                      )}
                      {!isArchived && !isSuspended && (
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(address)}
                          className="font-semibold text-[#8A3112] hover:underline cursor-pointer"
                        >
                          Archiver
                        </button>
                      )}
                      {isArchived && (
                        <button
                          type="button"
                          onClick={() => handleRestore(address.id)}
                          className="font-semibold text-[#1D528F] hover:underline cursor-pointer"
                        >
                          Restaurer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale de confirmation d'archivage avec ConfirmDialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        isLoading={archiving}
        title={`Archiver l'adresse ${archiveTarget?.code || ''} ?`}
        description="La fiche publique et le QR code cesseront d'être consultables. L'adresse ne sera plus visible dans l'annuaire public, mais vous pourrez la restaurer à tout moment."
        confirmLabel="Archiver l'adresse"
        cancelLabel="Annuler"
        variant="warning"
      />
    </ConnectedLayout>
  );
};
