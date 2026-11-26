import React, { useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import type { AddressResponse } from '../api/addressApi';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { ConnectedLayout } from '../components/ConnectedLayout';
import { ConfirmDialog, EmptyState, ErrorState } from '../components/ui';
import { useMyAddresses } from '../features/my-addresses/useMyAddresses';
import { OfflineDraftsQueue } from '../features/my-addresses/OfflineDraftsQueue';
import { MyAddressCard } from '../features/my-addresses/MyAddressCard';
import { MyAddressesTable } from '../features/my-addresses/MyAddressesTable';
import { cn } from '../utils/cn';
import {
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter,
} from 'lucide-react';

type StatusFilterValue = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'PENDING';
type SortByValue = 'RECENT' | 'OLD' | 'CODE_ASC' | 'CODE_DESC';

function parseStatusFromUrl(params: URLSearchParams): StatusFilterValue {
  if (params.get('filter') === 'pending') return 'PENDING';
  const s = params.get('status')?.toUpperCase();
  if (s === 'ACTIVE' || s === 'SUSPENDED' || s === 'ARCHIVED') return s;
  return 'ALL';
}

export const MyAddressesPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const {
    addresses,
    drafts,
    loading,
    errorMsg,
    isSessionExpired,
    isSyncing,
    codeChangedNotification,
    setCodeChangedNotification,
    recentlyArchived,
    setRecentlyArchived,
    archiving,
    restoringId,
    togglingVisibilityId,
    uploadingAddressId,
    reload,
    syncNow,
    confirmArchive,
    restore,
    toggleVisibility,
    uploadPhoto,
  } = useMyAddresses({ isOnline, showToast });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quartierFilter, setQuartierFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortByValue>('RECENT');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const [archiveTarget, setArchiveTarget] = useState<AddressResponse | null>(null);
  const [visibilityTarget, setVisibilityTarget] = useState<AddressResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetPhotoAddressId, setTargetPhotoAddressId] = useState<string | null>(null);

  // Statut dérivé directement de l'URL (?status=ACTIVE|SUSPENDED|ARCHIVED, ?filter=pending)
  const statusFilter = parseStatusFromUrl(searchParams);

  const setStatusFilter = (next: StatusFilterValue) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    nextParams.delete('filter');
    if (next === 'PENDING') {
      nextParams.set('filter', 'pending');
    } else if (next !== 'ALL') {
      nextParams.set('status', next);
    }
    setSearchParams(nextParams);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    const ok = await confirmArchive(archiveTarget);
    if (ok) {
      setArchiveTarget(null);
    }
  };

  const handleConfirmVisibilityToggle = async () => {
    if (!visibilityTarget) return;
    const ok = await toggleVisibility(visibilityTarget);
    if (ok) {
      setVisibilityTarget(null);
    }
  };

  const handleDownloadQrCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/api/addresses/${encodeURIComponent(code)}/qrcode`;
    link.download = `samaadresse-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Téléchargement du QR Code ${code} démarré.`, 'success');
  };

  const handleOpenPhotoPicker = (addressId: string) => {
    setTargetPhotoAddressId(addressId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPhotoAddressId) return;
    const ok = await uploadPhoto(targetPhotoAddressId, file);
    if (ok) {
      setFailedPhotos((prev) => {
        const next = { ...prev };
        delete next[targetPhotoAddressId];
        return next;
      });
    }
    setTargetPhotoAddressId(null);
  };

  const availableQuartiers = useMemo(() => {
    const set = new Set<string>();
    addresses.forEach((a) => {
      if (a.quartier) set.add(a.quartier);
    });
    return Array.from(set).sort();
  }, [addresses]);

  const filteredAddresses = useMemo(() => {
    let result = [...addresses];

    if (statusFilter === 'ACTIVE') {
      result = result.filter((a) => a.status === 'ACTIVE');
    } else if (statusFilter === 'SUSPENDED') {
      result = result.filter((a) => a.status === 'SUSPENDED');
    } else if (statusFilter === 'ARCHIVED') {
      result = result.filter((a) => a.status === 'ARCHIVED');
    } else if (statusFilter === 'PENDING') {
      result = [];
    }

    if (quartierFilter !== 'ALL') {
      result = result.filter((a) => a.quartier?.toUpperCase() === quartierFilter.toUpperCase());
    }

    if (typeFilter !== 'ALL') {
      result = result.filter((a) => a.locationType === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.quartier?.toLowerCase().includes(q)
      );
    }

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
      return b.code.localeCompare(a.code);
    });

    return result;
  }, [addresses, statusFilter, quartierFilter, typeFilter, searchQuery, sortBy]);

  const activeCount = useMemo(
    () => addresses.filter((a) => a.status === 'ACTIVE').length,
    [addresses]
  );
  const archivedCount = useMemo(
    () => addresses.filter((a) => a.status === 'ARCHIVED').length,
    [addresses]
  );
  const suspendedCount = useMemo(
    () => addresses.filter((a) => a.status === 'SUSPENDED').length,
    [addresses]
  );

  const resetFilters = () => {
    setSearchQuery('');
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

  const renderCards = (testId?: string, extraClass?: string) => (
    <div
      data-testid={testId}
      className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', extraClass)}
    >
      {filteredAddresses.map((address) => (
        <MyAddressCard
          key={address.id}
          address={address}
          isOnline={isOnline}
          photoFailed={Boolean(failedPhotos[address.id])}
          isUploadingPhoto={uploadingAddressId === address.id}
          isShareOpen={shareOpenId === address.id}
          isMenuOpen={openMenuId === address.id}
          isRestoring={restoringId === address.id}
          isTogglingVisibility={togglingVisibilityId === address.id}
          onPhotoError={(id) => setFailedPhotos((prev) => ({ ...prev, [id]: true }))}
          onToggleShare={(id) => setShareOpenId((prev) => (prev === id ? null : id))}
          onToggleMenu={setOpenMenuId}
          onDownloadQrCode={handleDownloadQrCode}
          onOpenPhotoPicker={handleOpenPhotoPicker}
          onEdit={(id) => navigate(`/addresses/${id}/edit`)}
          onRequestArchive={setArchiveTarget}
          onRestore={restore}
          onRequestVisibilityToggle={setVisibilityTarget}
        />
      ))}
    </div>
  );

  return (
    <ConnectedLayout
      title="Mes adresses"
      subtitle="Recherchez, filtrez, partagez et gérez vos plaques géolocalisées."
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
        onChange={handlePhotoChange}
        className="hidden"
        aria-label="Choisir une photo de façade"
      />

      {/* Notification de code réassigné lors d'une synchronisation */}
      {codeChangedNotification && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-info-soft border border-info-border text-info text-xs sm:text-sm font-medium flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{codeChangedNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setCodeChangedNotification(null)}
            className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-info-border text-xs font-semibold text-info hover:bg-surface transition-colors cursor-pointer shrink-0"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Notification d'adresse récemment archivée avec restauration rapide */}
      {recentlyArchived && (
        <div
          role="status"
          className="p-3.5 sm:p-4 rounded-2xl bg-surface-elevated border border-border shadow-xs flex items-center justify-between gap-3 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2 text-ink font-medium min-w-0">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
            <span className="truncate">
              Adresse archivée (
              <span className="font-mono font-bold">{recentlyArchived.code}</span>)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => restore(recentlyArchived.id)}
              disabled={restoringId === recentlyArchived.id || !isOnline}
              className="px-3 py-1.5 rounded-xl border border-institution-border bg-institution-soft hover:bg-surface text-institution text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setRecentlyArchived(null)}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* File d'attente hors ligne IndexedDB */}
      {(statusFilter === 'ALL' || statusFilter === 'PENDING') && (
        <OfflineDraftsQueue
          drafts={drafts}
          isOnline={isOnline}
          isSyncing={isSyncing}
          onSyncNow={syncNow}
        />
      )}

      {/* Onglets d'état (Actives / Archivées / Suspendues) */}
      <div
        role="tablist"
        aria-label="Filtrer par état des adresses"
        className="flex items-center gap-1 border-b border-border overflow-x-auto sa-no-scrollbar"
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'ALL' || statusFilter === 'ACTIVE'}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={cn(
            'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer -mb-px whitespace-nowrap min-h-[42px]',
            statusFilter === 'ALL' || statusFilter === 'ACTIVE'
              ? 'border-brand text-ink'
              : 'border-transparent text-ink-muted hover:text-ink'
          )}
        >
          Actives ({activeCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'ARCHIVED'}
          onClick={() => setStatusFilter('ARCHIVED')}
          className={cn(
            'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer -mb-px whitespace-nowrap min-h-[42px]',
            statusFilter === 'ARCHIVED'
              ? 'border-brand text-ink'
              : 'border-transparent text-ink-muted hover:text-ink'
          )}
        >
          Archivées ({archivedCount})
        </button>
        {suspendedCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'SUSPENDED'}
            onClick={() => setStatusFilter('SUSPENDED')}
            className={cn(
              'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer -mb-px whitespace-nowrap min-h-[42px]',
              statusFilter === 'SUSPENDED'
                ? 'border-danger text-danger'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            Suspendues ({suspendedCount})
          </button>
        )}
      </div>

      {/* Barre de recherche, filtres, tri et bascule Grille / Liste */}
      <section
        aria-label="Filtres et recherche des adresses"
        className="p-4 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-3"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par code (ex: ZIG-KBG, 4271), description…"
              className="w-full pl-10 pr-3.5 py-2 min-h-[40px] text-xs sm:text-sm rounded-xl border border-border-strong bg-canvas text-ink placeholder:text-ink-subtle focus:outline-none focus:border-institution focus:ring-2 focus:ring-institution-soft transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrer par statut"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterValue)}
              className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl border border-border-strong bg-canvas text-ink focus:outline-none focus:border-institution cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actives</option>
              <option value="SUSPENDED">Suspendues</option>
              <option value="ARCHIVED">Archivées</option>
              <option value="PENDING">En attente hors ligne</option>
            </select>

            {availableQuartiers.length > 0 && (
              <select
                aria-label="Filtrer par quartier"
                value={quartierFilter}
                onChange={(e) => setQuartierFilter(e.target.value)}
                className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl border border-border-strong bg-canvas text-ink focus:outline-none focus:border-institution cursor-pointer"
              >
                <option value="ALL">Tous quartiers</option>
                {availableQuartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Filtrer par type de lieu"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl border border-border-strong bg-canvas text-ink focus:outline-none focus:border-institution cursor-pointer"
            >
              <option value="ALL">Tous types</option>
              <option value="MAISON">Maison</option>
              <option value="COMMERCE">Commerce</option>
              <option value="INSTITUTION">Institution</option>
            </select>

            <select
              aria-label="Trier la liste"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortByValue)}
              className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-xl border border-border-strong bg-canvas text-ink focus:outline-none focus:border-institution cursor-pointer"
            >
              <option value="RECENT">Plus récentes</option>
              <option value="OLD">Plus anciennes</option>
              <option value="CODE_ASC">Code (A → Z)</option>
              <option value="CODE_DESC">Code (Z → A)</option>
            </select>

            {/* Bascule Grille / Liste visible sur desktop (>= 1024 px) */}
            <div className="hidden lg:inline-flex items-center gap-1 border border-border-strong rounded-xl p-1 bg-surface">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Vue grille"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-ink text-ink-inverse shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <LayoutGrid className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Vue liste"
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-ink text-ink-inverse shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <ListIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Compteur de résultats & réinitialisation */}
        <div className="flex items-center justify-between gap-2 text-xs text-ink-muted pt-2.5 border-t border-border min-h-[28px] flex-wrap">
          <span aria-live="polite">
            {loading ? (
              <span className="inline-block w-32 h-4 bg-surface-hover rounded animate-pulse align-middle" />
            ) : statusFilter === 'PENDING' ? (
              `${drafts.length} ${drafts.length > 1 ? 'adresses' : 'adresse'} en attente hors ligne`
            ) : (
              `Affichage de ${filteredAddresses.length} sur ${addresses.length} ${
                addresses.length > 1 ? 'adresses' : 'adresse'
              }`
            )}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-brand hover:text-brand-hover font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </section>

      {/* États : Chargement, Erreur, Vide, Résultats */}
      {loading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[560px]"
          aria-busy="true"
          aria-label="Chargement des adresses"
        >
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-border bg-surface-elevated p-4 min-h-[188px] animate-pulse space-y-3"
            >
              <div className="h-6 bg-surface-hover rounded w-1/3" />
              <div className="h-14 bg-surface rounded-xl" />
              <div className="h-4 bg-surface-hover rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <ErrorState
          errorCode={isSessionExpired ? 401 : undefined}
          title={isSessionExpired ? 'Session expirée' : 'Impossible de charger vos adresses'}
          description={errorMsg}
          onRetry={
            isSessionExpired
              ? () => navigate('/login', { state: { from: location, sessionExpired: true } })
              : reload
          }
          retryLabel={isSessionExpired ? 'Se reconnecter' : 'Réessayer'}
          homeTo="/tableau-de-bord"
          homeLabel="Tableau de bord"
        />
      ) : addresses.length === 0 && drafts.length === 0 ? (
        <EmptyState
          illustration="/images/etat-vide-144w.webp"
          illustrationSrcSet="/images/etat-vide-144w.webp 144w, /images/etat-vide-320w.webp 320w, /images/etat-vide-480w.webp 480w"
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
      ) : statusFilter === 'PENDING' ? (
        drafts.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Aucune adresse en attente hors ligne"
            description="Toutes vos adresses locales ont déjà été synchronisées avec le serveur."
            action={{
              label: 'Voir toutes mes adresses',
              onClick: resetFilters,
              icon: RefreshCw,
            }}
          />
        ) : null
      ) : viewMode === 'grid' ? (
        renderCards('addresses-grid-view')
      ) : (
        <>
          <MyAddressesTable
            addresses={filteredAddresses}
            isOnline={isOnline}
            restoringId={restoringId}
            togglingVisibilityId={togglingVisibilityId}
            onRequestArchive={setArchiveTarget}
            onRestore={restore}
            onRequestVisibilityToggle={setVisibilityTarget}
          />
          {/* Repli cartes adaptées sur mobile / tablette (< 1024 px) */}
          {renderCards(undefined, 'lg:hidden')}
        </>
      )}

      {/* Modale de confirmation d'archivage */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        isLoading={archiving}
        title={`Archiver l'adresse ${archiveTarget?.code || ''} ?`}
        description="La fiche publique et le QR code cesseront d'être consultables (HTTP 410). L'adresse ne sera plus visible dans l'annuaire public, mais vous pourrez la restaurer à tout moment."
        confirmLabel="Archiver l'adresse"
        cancelLabel="Annuler"
        variant="warning"
      />

      {/* Modale de confirmation de visibilité dans l'annuaire public */}
      <ConfirmDialog
        isOpen={Boolean(visibilityTarget)}
        onClose={() => setVisibilityTarget(null)}
        onConfirm={handleConfirmVisibilityToggle}
        isLoading={Boolean(visibilityTarget && togglingVisibilityId === visibilityTarget.id)}
        title={
          visibilityTarget?.listed
            ? `Retirer ${visibilityTarget.code} de l'annuaire public ?`
            : `Publier ${visibilityTarget?.code || ''} dans l'annuaire public ?`
        }
        description={
          visibilityTarget?.listed
            ? "Cette adresse ne sera plus trouvée via la recherche de l'annuaire public. Elle restera accessible aux personnes disposant de son code ou QR Code."
            : "Cette adresse deviendra consultable dans l'annuaire public SamaAdresse. Votre e-mail et votre numéro de téléphone restent strictement privés."
        }
        confirmLabel={
          visibilityTarget?.listed ? "Retirer de l'annuaire" : "Publier dans l'annuaire"
        }
        cancelLabel="Annuler"
        variant="info"
      />
    </ConnectedLayout>
  );
};
