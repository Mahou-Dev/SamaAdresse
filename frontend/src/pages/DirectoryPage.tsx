import React from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, AlertCircle } from 'lucide-react';
import { PublicLayout } from '../app/layouts/PublicLayout';
import { ErrorState } from '../components/ui/ErrorState';
import { useDirectorySearch } from '../features/directory/useDirectorySearch';
import { DirectoryFiltersBar } from '../features/directory/DirectoryFiltersBar';
import { DirectoryResultsGrid } from '../features/directory/DirectoryResultsGrid';
import { DirectoryMapSection } from '../features/directory/DirectoryMapSection';

export const DirectoryPage: React.FC = () => {
  const dir = useDirectorySearch();

  return (
    <PublicLayout maxWidth="wide" surface="canvas">
      <div className="space-y-6">
        {/* En-tête éditorial de l'annuaire */}
        <header className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Annuaire public
            </h1>
            {!dir.isOffline && !dir.loading && dir.hasSearched && !dir.error && (
              <p className="text-xs sm:text-sm font-medium text-ink-muted">
                {dir.totalElements === 0
                  ? 'Aucun résultat'
                  : dir.totalElements === 1
                  ? '1 adresse trouvée'
                  : `${dir.totalElements} adresses trouvées`}
              </p>
            )}
          </div>
          <p className="text-sm text-ink-secondary max-w-2xl leading-relaxed">
            Recherchez les adresses, commerces et institutions ayant choisi de figurer dans l'annuaire public SamaAdresse.
          </p>
        </header>

        {/* Live region accessible pour les lecteurs d'écran */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {dir.liveAnnouncement}
        </div>

        {/* Barre de recherche, filtres et sélecteur de vue (Grille / Liste / Carte) */}
        <DirectoryFiltersBar
          inputQ={dir.inputQ}
          urlQ={dir.urlQ}
          selectedQuartier={dir.selectedQuartier}
          selectedType={dir.selectedType}
          viewMode={dir.viewMode}
          loading={dir.loading}
          isOffline={dir.isOffline}
          hasActiveFilters={dir.hasActiveFilters}
          totalElements={dir.totalElements}
          onInputChange={dir.handleInputChange}
          onSearchSubmit={dir.handleSearchSubmit}
          onClearSearch={dir.handleClearSearch}
          onQuartierChange={dir.handleQuartierChange}
          onTypeChange={dir.handleTypeChange}
          onViewChange={dir.handleViewChange}
          onResetFilters={dir.resetFilters}
        />

        {/* État Hors ligne (en vue Grille/Liste ; la vue Carte affiche son propre repli dédié) */}
        {dir.isOffline && dir.viewMode !== 'map' && (
          <div
            role="status"
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-border text-ink space-y-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-warning-soft border border-warning-border text-warning flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold text-ink">
                  L'annuaire n'est pas disponible hors ligne.
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Une connexion réseau est nécessaire pour interroger la base publique. Consultez vos fiches enregistrées ci-dessous.
                </p>
              </div>
            </div>

            {dir.visitedCodes.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-xs font-semibold text-ink-secondary block">
                  Fiches consultables hors ligne :
                </span>
                <div className="flex flex-wrap gap-2">
                  {dir.visitedCodes.map((code) => (
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
        )}

        {/* État Rate limit 429 */}
        {dir.isRateLimited && !dir.isOffline && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-danger-soft border border-danger-border text-danger text-xs sm:text-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Trop de recherches. Merci de patienter un instant.</span>
            </div>
            {dir.retryAfterSeconds > 0 && (
              <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-canvas border border-danger-border shrink-0">
                {dir.retryAfterSeconds}s
              </span>
            )}
          </div>
        )}

        {/* Erreur WAF 403 ou erreur réseau standard */}
        {dir.error && !dir.isRateLimited && !dir.isOffline && (
          <ErrorState
            compact={true}
            title="Impossible d'afficher les résultats"
            description={dir.error}
            onRetry={dir.retry}
          />
        )}

        {/* Zone des résultats (hauteur réservée pour maintenir CLS < 0,1) */}
        <div className="min-h-[540px] space-y-8">
          {dir.viewMode === 'map' ? (
            <DirectoryMapSection
              items={dir.items}
              loading={dir.loading}
              loadingMore={dir.loadingMore}
              hasSearched={dir.hasSearched}
              hasActiveFilters={dir.hasActiveFilters}
              isOffline={dir.isOffline}
              visitedCodes={dir.visitedCodes}
              totalElements={dir.totalElements}
              canLoadMore={dir.canLoadMore}
              error={dir.error}
              onLoadMore={dir.loadMore}
              onResetFilters={dir.resetFilters}
              onSwitchToGrid={() => dir.handleViewChange('grid')}
            />
          ) : (
            !dir.isOffline && (
              <DirectoryResultsGrid
                items={dir.items}
                viewMode={dir.viewMode}
                loading={dir.loading}
                loadingMore={dir.loadingMore}
                hasSearched={dir.hasSearched}
                hasActiveFilters={dir.hasActiveFilters}
                totalElements={dir.totalElements}
                canLoadMore={dir.canLoadMore}
                error={dir.error}
                onLoadMore={dir.loadMore}
                onResetFilters={dir.resetFilters}
              />
            )
          )}

          {/* Bandeau panoramique discret en pied de grille/liste */}
          {dir.viewMode !== 'map' && (
            <div className="rounded-2xl overflow-hidden border border-border bg-surface-secondary">
              <img
                src="/images/bandeau-annuaire-800w.webp"
                srcSet="/images/bandeau-annuaire-480w.webp 480w, /images/bandeau-annuaire-800w.webp 800w, /images/bandeau-annuaire-1280w.webp 1280w"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1216px"
                alt=""
                loading="lazy"
                decoding="async"
                width="1280"
                height="320"
                className="w-full h-24 sm:h-36 object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default DirectoryPage;
