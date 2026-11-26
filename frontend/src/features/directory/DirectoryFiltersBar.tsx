import React, { useState, useMemo } from 'react';
import {
  Home,
  Store,
  Building2,
  LayoutGrid,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  RotateCcw,
  X,
} from 'lucide-react';
import type { LocationType } from '../../api/addressApi';
import { SearchBar } from '../../components/shared/SearchBar';
import { SearchFilter } from '../../components/shared/SearchFilter';
import type { SearchFilterOption } from '../../components/shared/SearchFilter';
import { Select } from '../../components/ui/Select';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { getAllQuartiers, getQuartierName, getZoneName } from '../../utils/geoGrid';
import { getLocationTypeLabel } from '../../utils/locationTypes';
import { cn } from '../../utils/cn';
import type { DirectoryViewMode } from './types';

export interface DirectoryFiltersBarProps {
  inputQ: string;
  urlQ: string;
  selectedQuartier: string;
  selectedType: '' | LocationType;
  viewMode: DirectoryViewMode;
  loading: boolean;
  isOffline: boolean;
  hasActiveFilters: boolean;
  totalElements: number;
  onInputChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onClearSearch: () => void;
  onQuartierChange: (quartier: string) => void;
  onTypeChange: (type: '' | LocationType) => void;
  onViewChange: (view: DirectoryViewMode) => void;
  onResetFilters: () => void;
}

const TYPE_OPTIONS: SearchFilterOption<'' | LocationType>[] = [
  { value: '', label: 'Tous', icon: LayoutGrid },
  { value: 'MAISON', label: 'Maison', icon: Home },
  { value: 'COMMERCE', label: 'Commerce', icon: Store },
  { value: 'INSTITUTION', label: 'Institution', icon: Building2 },
];

const VIEW_MODES: {
  id: DirectoryViewMode;
  label: string;
  ariaLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'grid', label: 'Grille', ariaLabel: 'Vue grille', icon: LayoutGrid },
  { id: 'list', label: 'Liste', ariaLabel: 'Vue liste', icon: List },
  { id: 'map', label: 'Carte', ariaLabel: 'Vue carte', icon: MapIcon },
];

export const DirectoryFiltersBar: React.FC<DirectoryFiltersBarProps> = ({
  inputQ,
  urlQ,
  selectedQuartier,
  selectedType,
  viewMode,
  loading,
  isOffline,
  hasActiveFilters,
  totalElements,
  onInputChange,
  onSearchSubmit,
  onClearSearch,
  onQuartierChange,
  onTypeChange,
  onViewChange,
  onResetFilters,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const quartierOptions = useMemo(() => {
    const quartiers = getAllQuartiers();
    return [
      { value: '', label: 'Tous les quartiers' },
      ...quartiers.map((q) => ({
        value: q.code,
        label: `${q.name} (${q.code}) · ${getZoneName(q.zoneCode)}`,
      })),
    ];
  }, []);

  const mobileSecondaryFiltersCount = (selectedQuartier ? 1 : 0) + (selectedType ? 1 : 0);

  const renderViewToggle = (compactMobile = false) => (
    <div
      role="group"
      aria-label="Mode d'affichage des résultats"
      className="inline-flex items-center p-1 rounded-full bg-surface border border-border shrink-0"
    >
      {VIEW_MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            aria-label={mode.ariaLabel}
            aria-pressed={isActive}
            onClick={() => onViewChange(mode.id)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
              compactMobile ? 'min-h-[38px] px-2.5 sm:px-3' : 'min-h-[38px] px-3.5',
              isActive
                ? 'bg-ink text-ink-inverse shadow-xs'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      aria-label="Recherche et filtres dans l'annuaire"
      className="space-y-4"
    >
      {/* 1. Barre de recherche principale (largeur maximale sur mobile pour placeholder lisible à 360 px) */}
      <SearchBar
        inputId="directory-search-input"
        value={inputQ}
        onChange={onInputChange}
        onSubmit={onSearchSubmit}
        onClear={onClearSearch}
        placeholder="Code, quartier ou description…"
        ariaLabel="Rechercher une adresse, un commerce ou un quartier"
        variant="hero"
        isLoading={loading}
        disabled={isOffline}
        showSubmitButton={false}
        className="w-full"
      />

      {/* 2. Barre de filtres et bascule de vue Desktop (>= 768 px) */}
      <div className="hidden md:flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <SearchFilter
            label="Filtrer par type de lieu"
            options={TYPE_OPTIONS}
            value={selectedType}
            onChange={onTypeChange}
          />

          <div className="w-64 shrink-0">
            <Select
              id="filter-quartier"
              aria-label="Filtrer par quartier"
              size="sm"
              value={selectedQuartier}
              onChange={(e) => onQuartierChange(e.target.value)}
              options={quartierOptions}
              disabled={isOffline}
              className="rounded-full min-h-[40px]"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-full text-xs font-semibold text-brand hover:bg-brand-soft transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {renderViewToggle(false)}
      </div>

      {/* 3. Barre de filtres et bascule de vue Mobile (< 768 px) */}
      <div className="md:hidden space-y-2.5">
        <SearchFilter
          label="Filtrer par type de lieu"
          options={TYPE_OPTIONS}
          value={selectedType}
          onChange={onTypeChange}
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            disabled={isOffline}
            aria-expanded={mobileDrawerOpen}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold min-h-[44px] transition-colors cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
              selectedQuartier
                ? 'bg-ink text-ink-inverse border-ink'
                : 'bg-surface-elevated text-ink border-border-strong hover:bg-surface'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Filtres</span>
            {mobileSecondaryFiltersCount > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold',
                  selectedQuartier
                    ? 'bg-canvas text-ink'
                    : 'bg-brand text-ink-inverse'
                )}
              >
                {mobileSecondaryFiltersCount}
              </span>
            )}
          </button>

          {renderViewToggle(true)}
        </div>
      </div>

      {/* 4. Bandeau des filtres actifs (supprimables individuellement en 1 clic) */}
      {hasActiveFilters && (
        <div
          className="flex items-center gap-2 flex-wrap pt-1"
          aria-label="Filtres actuellement appliqués"
        >
          {urlQ.trim() && (
            <button
              type="button"
              onClick={onClearSearch}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface border border-border text-ink hover:border-border-strong transition-colors cursor-pointer"
            >
              <span>Recherche : « {urlQ.trim()} »</span>
              <X className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
            </button>
          )}

          {selectedQuartier && (
            <button
              type="button"
              onClick={() => onQuartierChange('')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-institution-soft border border-institution-border text-institution hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Quartier : {getQuartierName(selectedQuartier)}</span>
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          {selectedType && (
            <button
              type="button"
              onClick={() => onTypeChange('')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-soft border border-brand-border text-brand-hover hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Type : {getLocationTypeLabel(selectedType)}</span>
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-ink-muted hover:text-ink underline underline-offset-2 px-1 py-1 cursor-pointer"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Tiroir mobile pour les filtres détaillés */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        side="bottom"
        title="Filtrer l'annuaire"
        subtitle="Affinez les adresses par quartier ou catégorie."
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                onResetFilters();
              }}
              disabled={!hasActiveFilters}
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setMobileDrawerOpen(false)}
            >
              {totalElements === 0
                ? 'Voir les résultats'
                : totalElements === 1
                ? 'Voir 1 adresse'
                : `Voir ${totalElements} adresses`}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Select
            id="mobile-filter-quartier"
            label="Quartier"
            value={selectedQuartier}
            onChange={(e) => onQuartierChange(e.target.value)}
            options={quartierOptions}
          />

          <div className="space-y-2">
            <span className="block text-sm font-semibold text-ink">Type de lieu</span>
            <div className="grid grid-cols-2 gap-2.5">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = selectedType === option.value;
                return (
                  <button
                    key={option.value || '__all__'}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onTypeChange(option.value)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-3 rounded-xl border text-sm font-semibold transition-colors cursor-pointer min-h-[44px]',
                      isActive
                        ? 'bg-ink text-ink-inverse border-ink'
                        : 'bg-surface-elevated text-ink-secondary border-border hover:border-border-strong'
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer>
    </section>
  );
};
