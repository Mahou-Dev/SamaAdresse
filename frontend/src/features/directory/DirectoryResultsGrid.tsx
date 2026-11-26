import React from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import type { DirectoryItemResponse } from '../../api/addressApi';
import { AddressCard } from '../../components/shared/AddressCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export interface DirectoryResultsGridProps {
  items: DirectoryItemResponse[];
  viewMode: 'grid' | 'list';
  loading: boolean;
  loadingMore: boolean;
  hasSearched: boolean;
  hasActiveFilters: boolean;
  totalElements: number;
  canLoadMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onResetFilters: () => void;
}

export const DirectoryResultsGrid: React.FC<DirectoryResultsGridProps> = ({
  items,
  viewMode,
  loading,
  loadingMore,
  hasSearched,
  hasActiveFilters,
  totalElements,
  canLoadMore,
  error,
  onLoadMore,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'flex flex-col gap-4'
        }
        aria-label="Chargement des adresses de l'annuaire"
      >
        {[1, 2, 3, 4, 5, 6].map((i) =>
          viewMode === 'grid' ? (
            <div
              key={i}
              aria-hidden="true"
              className="rounded-2xl border border-border bg-surface-elevated overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] w-full bg-surface-hover" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between gap-2">
                  <div className="h-5 w-28 bg-surface-hover rounded-full" />
                  <div className="h-5 w-24 bg-surface-hover rounded-full" />
                </div>
                <div className="h-4 w-full bg-surface-hover rounded" />
                <div className="h-4 w-2/3 bg-surface-hover rounded" />
                <div className="pt-3 border-t border-border flex justify-between">
                  <div className="h-3.5 w-20 bg-surface-hover rounded" />
                  <div className="h-3.5 w-24 bg-surface-hover rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div
              key={i}
              aria-hidden="true"
              className="rounded-2xl border border-border bg-surface-elevated overflow-hidden flex flex-col sm:flex-row animate-pulse"
            >
              <div className="w-full sm:w-48 aspect-[4/3] sm:aspect-auto sm:min-h-[144px] bg-surface-hover shrink-0" />
              <div className="flex-1 p-4 space-y-3">
                <div className="flex justify-between gap-2">
                  <div className="h-5 w-32 bg-surface-hover rounded-full" />
                  <div className="h-5 w-28 bg-surface-hover rounded-full" />
                </div>
                <div className="h-4 w-5/6 bg-surface-hover rounded" />
                <div className="h-4 w-1/2 bg-surface-hover rounded" />
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  if (hasSearched && items.length === 0 && !error) {
    return (
      <EmptyState
        illustration="/images/etat-vide-144w.webp"
        illustrationSrcSet="/images/etat-vide-144w.webp 144w, /images/etat-vide-320w.webp 320w, /images/etat-vide-480w.webp 480w"
        illustrationSizes="(max-width: 640px) 112px, 144px"
        title="Aucune adresse ne correspond à votre recherche."
        description="Essayez avec un mot-clé plus court, ou retirez les filtres par quartier ou type de lieu."
        action={
          hasActiveFilters
            ? {
                label: 'Réinitialiser les filtres',
                onClick: onResetFilters,
                icon: RotateCcw,
              }
            : {
                label: 'Créer une adresse',
                to: '/addresses/new',
                icon: Plus,
              }
        }
      />
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div
        data-testid={viewMode === 'grid' ? 'directory-grid-view' : 'directory-list-view'}
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'flex flex-col gap-4'
        }
      >
        {items.map((item) => (
          <AddressCard
            key={item.code}
            address={item}
            layout={viewMode === 'grid' ? 'vertical' : 'horizontal'}
            copyableCode={true}
          />
        ))}
      </div>

      {/* Pagination discrète */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-xs text-ink-muted">
          Affichage de <strong className="text-ink font-semibold">{items.length}</strong> sur{' '}
          <strong className="text-ink font-semibold">{totalElements}</strong>{' '}
          {totalElements > 1 ? 'adresses' : 'adresse'}
        </p>

        {canLoadMore && (
          <Button
            variant="outline"
            size="md"
            isLoading={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? 'Chargement des adresses suivantes…' : "Afficher plus d'adresses"}
          </Button>
        )}
      </div>
    </div>
  );
};
