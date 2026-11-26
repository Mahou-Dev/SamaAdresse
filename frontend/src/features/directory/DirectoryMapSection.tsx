import React, { lazy, Suspense, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  WifiOff,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  X,
  RotateCcw,
  Navigation,
  LayoutGrid,
} from 'lucide-react';
import type { DirectoryItemResponse } from '../../api/addressApi';
import { AddressCard } from '../../components/shared/AddressCard';
import { AddressCode } from '../../components/shared/AddressCode';
import { LocationBadge } from '../../components/shared/LocationBadge';
import { NeighborhoodTag } from '../../components/shared/NeighborhoodTag';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { useDirectoryCoordinates } from './useDirectoryCoordinates';

// Chargement strictement différé de Leaflet uniquement lorsque la vue Carte est ouverte
const DirectoryMapCanvas = lazy(() => import('./DirectoryMapCanvas'));

export interface DirectoryMapSectionProps {
  items: DirectoryItemResponse[];
  loading: boolean;
  loadingMore: boolean;
  hasSearched: boolean;
  hasActiveFilters: boolean;
  isOffline: boolean;
  visitedCodes: string[];
  totalElements: number;
  canLoadMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onResetFilters: () => void;
  onSwitchToGrid: () => void;
}

export const DirectoryMapSection: React.FC<DirectoryMapSectionProps> = ({
  items,
  loading,
  loadingMore,
  hasSearched,
  hasActiveFilters,
  isOffline,
  visitedCodes,
  totalElements,
  canLoadMore,
  error,
  onLoadMore,
  onResetFilters,
  onSwitchToGrid,
}) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const {
    mappedItems,
    unmappedItems,
    isLoadingCoords,
    resolvedCount,
    totalCount,
    rateLimitedCoords,
  } = useDirectoryCoordinates(items, !isOffline);

  const selectedEntry =
    selectedCode ? mappedItems.find((m) => m.item.code === selectedCode) ?? null : null;

  const handleMarkerSelect = useCallback((code: string | null) => {
    setSelectedCode(code);
    if (!code || !listContainerRef.current) return;
    const cardEl = listContainerRef.current.querySelector<HTMLElement>(
      `[data-address-code="${CSS.escape(code)}"]`
    );
    if (cardEl && typeof cardEl.scrollIntoView === 'function') {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  // 1. Repli hors ligne explicite
  if (isOffline) {
    return (
      <div
        data-testid="directory-map-offline"
        className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-warning-soft border border-warning-border text-warning flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-ink">
              Carte interactive indisponible hors ligne
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Le fond de carte et la recherche publique nécessitent une connexion Internet. Vous pouvez toujours consulter les fiches déjà visitées ci-dessous.
            </p>
          </div>
        </div>

        {visitedCodes.length > 0 && (
          <div className="pt-4 border-t border-border space-y-2.5">
            <p className="text-xs font-semibold text-ink-secondary">
              Fiches consultables hors ligne :
            </p>
            <div className="flex flex-wrap gap-2">
              {visitedCodes.map((code) => (
                <Link
                  key={code}
                  to={`/a/${code}`}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border font-mono text-xs font-bold text-institution hover:border-institution transition-colors"
                >
                  {code}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Chargement initial de la recherche
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse"
        aria-label="Chargement de la vue carte"
      >
        <div className="lg:col-span-5 space-y-3" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-surface border border-border" />
          ))}
        </div>
        <div
          className="lg:col-span-7 h-[460px] lg:h-[580px] rounded-2xl bg-surface border border-border"
          aria-hidden="true"
        />
      </div>
    );
  }

  // 3. Résultat vide
  if (hasSearched && items.length === 0 && !error) {
    return (
      <EmptyState
        illustration="/images/etat-vide-144w.webp"
        illustrationSrcSet="/images/etat-vide-144w.webp 144w, /images/etat-vide-320w.webp 320w, /images/etat-vide-480w.webp 480w"
        illustrationSizes="(max-width: 640px) 112px, 144px"
        title="Aucune adresse ne correspond à votre recherche."
        description="Modifiez vos filtres ou réinitialisez la recherche pour explorer les adresses sur la carte."
        action={
          hasActiveFilters
            ? {
                label: 'Réinitialiser les filtres',
                onClick: onResetFilters,
                icon: RotateCcw,
              }
            : undefined
        }
        secondaryAction={{
          label: 'Revenir à la grille',
          onClick: onSwitchToGrid,
          icon: LayoutGrid,
        }}
      />
    );
  }

  if (items.length === 0) {
    return null;
  }

  const mappedCodeSet = new Set(mappedItems.map((m) => m.item.code));

  return (
    <div data-testid="directory-map-view" className="space-y-4">
      {/* Bandeaux informatifs sur la localisation réelle */}
      {(rateLimitedCoords || (!isLoadingCoords && unmappedItems.length > 0)) && (
        <div
          role="status"
          className="rounded-xl border border-info-border bg-info-soft px-4 py-2.5 text-xs text-institution flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {rateLimitedCoords
              ? 'Limite de requêtes atteinte : certaines positions n’ont pas encore pu être chargées sur la carte.'
              : unmappedItems.length === 1
              ? '1 adresse de cette page n’a pas pu être positionnée sur la carte ; elle reste consultable dans la liste.'
              : `${unmappedItems.length} adresses de cette page n’ont pas pu être positionnées sur la carte ; elles restent consultables dans la liste.`}
          </span>
        </div>
      )}

      {/* Split-view Desktop (liste gauche + carte droite fixe) / Carte prioritaire Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Carte interactive (prioritaire visuellement sur mobile, colonne droite sur desktop) */}
        <div className="order-1 lg:order-2 lg:col-span-7 lg:sticky lg:top-20">
          <div className="relative h-[56vh] min-h-[360px] max-h-[640px] lg:h-[min(600px,calc(100vh-11rem))] lg:min-h-[480px] rounded-2xl overflow-hidden border border-border bg-surface shadow-sm">
            {/* Indicateur d'hydratation progressive des coordonnées */}
            {isLoadingCoords && (
              <div
                role="status"
                aria-live="polite"
                className="absolute top-3 right-3 z-[400] inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated/95 backdrop-blur-xs border border-border shadow-sm text-xs font-semibold text-ink"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-institution" aria-hidden="true" />
                <span>
                  Localisation… ({resolvedCount}/{totalCount})
                </span>
              </div>
            )}

            <Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-ink-muted bg-surface">
                  <Loader2 className="w-6 h-6 animate-spin text-institution" aria-hidden="true" />
                  <span className="text-xs font-medium">Chargement de la carte interactive…</span>
                </div>
              }
            >
              <DirectoryMapCanvas
                items={mappedItems}
                selectedCode={selectedCode}
                onSelectCode={handleMarkerSelect}
              />
            </Suspense>

            {/* Carte d'aperçu flottante de l'adresse sélectionnée sur la carte */}
            {selectedEntry && (
              <div
                data-testid="map-selected-preview"
                className="absolute bottom-3 left-3 right-3 z-[450] max-w-md mx-auto rounded-2xl bg-surface-elevated border border-border shadow-xl p-3.5 sa-animate-scale-in"
              >
                <div className="flex items-start gap-3">
                  {selectedEntry.item.photoUrl ? (
                    <img
                      src={selectedEntry.item.photoUrl}
                      alt={`Façade de ${selectedEntry.item.code}`}
                      className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-institution shrink-0">
                      <MapPin className="w-5 h-5" aria-hidden="true" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <AddressCode code={selectedEntry.item.code} size="sm" variant="inline" />
                      <button
                        type="button"
                        onClick={() => setSelectedCode(null)}
                        aria-label="Fermer l'aperçu de l'adresse"
                        className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <LocationBadge type={selectedEntry.item.locationType} size="sm" />
                      <NeighborhoodTag
                        quartierCode={selectedEntry.item.quartier}
                        zoneCode={selectedEntry.item.zone}
                        showIcon={false}
                      />
                    </div>

                    <p className="text-xs text-ink-secondary line-clamp-2 leading-snug">
                      {selectedEntry.item.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-ink-muted">
                        {selectedEntry.latitude.toFixed(4)}, {selectedEntry.longitude.toFixed(4)}
                      </span>
                      <Link
                        to={`/a/${selectedEntry.item.code}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-institution hover:text-institution-hover"
                      >
                        <span>Voir la fiche</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liste synchronisée des résultats */}
        <div
          ref={listContainerRef}
          className="order-2 lg:order-1 lg:col-span-5 space-y-3.5"
        >
          <div className="flex items-center justify-between text-xs text-ink-muted px-0.5">
            <span>
              <strong className="text-ink font-semibold">{mappedItems.length}</strong>{' '}
              {mappedItems.length > 1 ? 'adresses localisées' : 'adresse localisée'} sur{' '}
              {items.length} affichées
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const isMapped = mappedCodeSet.has(item.code);
              const isSelected = selectedCode === item.code;

              return (
                <AddressCard
                  key={item.code}
                  address={item}
                  layout="horizontal"
                  isSelected={isSelected}
                  footer={
                    <div className="w-full flex items-center justify-between gap-2 flex-wrap">
                      {isMapped ? (
                        <button
                          type="button"
                          onClick={() => setSelectedCode(item.code)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution rounded px-1 py-0.5"
                        >
                          <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isSelected ? 'Centré sur la carte' : 'Localiser'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted">
                          {isLoadingCoords ? 'Position en cours…' : 'Position non chargée'}
                        </span>
                      )}

                      <Link
                        to={`/a/${item.code}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-institution hover:text-institution-hover transition-colors focus-visible:outline-2 focus-visible:outline-institution rounded px-1 py-0.5"
                      >
                        <span>Voir la fiche</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  }
                />
              );
            })}
          </div>

          {/* Pagination en vue carte */}
          <div className="flex flex-col items-center gap-2.5 pt-2">
            <p className="text-xs text-ink-muted">
              Affichage de <strong className="text-ink font-semibold">{items.length}</strong> sur{' '}
              <strong className="text-ink font-semibold">{totalElements}</strong>
            </p>
            {canLoadMore && (
              <Button
                variant="outline"
                size="md"
                isLoading={loadingMore}
                onClick={onLoadMore}
                className="w-full"
              >
                {loadingMore ? 'Chargement…' : "Afficher plus d'adresses"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
