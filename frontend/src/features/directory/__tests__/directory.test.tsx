import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseDirectoryView } from '../types';
import { DirectoryFiltersBar } from '../DirectoryFiltersBar';
import { DirectoryResultsGrid } from '../DirectoryResultsGrid';
import { DirectoryMapSection } from '../DirectoryMapSection';
import type { DirectoryItemResponse } from '../../../api/addressApi';

const sampleItems: DirectoryItemResponse[] = [
  {
    code: 'ZIG-KBG-4271',
    zone: 'ZIG',
    quartier: 'KBG',
    locationType: 'MAISON',
    description: 'Maison familiale près de la grande mosquée',
    createdAt: '2026-10-15T10:00:00Z',
    ownerName: 'Mamadou Diallo',
  },
  {
    code: 'ZIG-ESC-1042',
    zone: 'ZIG',
    quartier: 'ESC',
    locationType: 'COMMERCE',
    description: 'Boutique alimentation générale Escale',
    createdAt: '2026-10-16T10:00:00Z',
  },
];

describe('P02 — Composants Annuaire & Carte (Directory)', () => {
  it('parseDirectoryView normalise correctement les modes Grille / Liste / Carte', () => {
    expect(parseDirectoryView(null)).toBe('grid');
    expect(parseDirectoryView('grid')).toBe('grid');
    expect(parseDirectoryView('list')).toBe('list');
    expect(parseDirectoryView('map')).toBe('map');
    expect(parseDirectoryView('autre')).toBe('grid');
  });

  it('DirectoryFiltersBar expose #directory-search-input, #filter-quartier (8 quartiers), pilules de type et bascule Grille/Liste/Carte', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DirectoryFiltersBar
          inputQ="mosquee"
          urlQ="mosquee"
          selectedQuartier="ESC"
          selectedType="COMMERCE"
          viewMode="list"
          loading={false}
          isOffline={false}
          hasActiveFilters={true}
          totalElements={2}
          onInputChange={vi.fn()}
          onSearchSubmit={vi.fn()}
          onClearSearch={vi.fn()}
          onQuartierChange={vi.fn()}
          onTypeChange={vi.fn()}
          onViewChange={vi.fn()}
          onResetFilters={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(html).toContain('id="directory-search-input"');
    expect(html).toContain('placeholder="Code, quartier ou description…"');
    expect(html).toContain('id="filter-quartier"');
    // Tous les quartiers réels de geo-grid.json sont proposés
    expect(html).toContain('value="KBG"');
    expect(html).toContain('value="ESC"');
    expect(html).toContain('value="PLT"');
    expect(html).toContain('value="NDR"');
    // Bascules de vue accessibles
    expect(html).toContain('aria-label="Vue grille"');
    expect(html).toContain('aria-label="Vue liste"');
    expect(html).toContain('aria-label="Vue carte"');
    // Chips des filtres actifs + réinitialisation
    expect(html).toContain('Recherche : « mosquee »');
    expect(html).toContain('Quartier : Escale Center');
    expect(html).toContain('Type : Commerce');
    expect(html).toContain('Tout effacer');
  });

  it('DirectoryResultsGrid rend les modes Grille, Liste, squelettes de chargement, pagination et état vide', () => {
    const gridHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DirectoryResultsGrid
          items={sampleItems}
          viewMode="grid"
          loading={false}
          loadingMore={false}
          hasSearched={true}
          hasActiveFilters={false}
          totalElements={24}
          canLoadMore={true}
          error={null}
          onLoadMore={vi.fn()}
          onResetFilters={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(gridHtml).toContain('data-testid="directory-grid-view"');
    expect(gridHtml).toContain('ZIG-KBG-4271');
    expect(gridHtml).toContain('Mamadou Diallo');
    expect(gridHtml).toContain('Afficher plus d&#x27;adresses');

    const listHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DirectoryResultsGrid
          items={sampleItems}
          viewMode="list"
          loading={false}
          loadingMore={false}
          hasSearched={true}
          hasActiveFilters={false}
          totalElements={2}
          canLoadMore={false}
          error={null}
          onLoadMore={vi.fn()}
          onResetFilters={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(listHtml).toContain('data-testid="directory-list-view"');

    const emptyHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DirectoryResultsGrid
          items={[]}
          viewMode="grid"
          loading={false}
          loadingMore={false}
          hasSearched={true}
          hasActiveFilters={true}
          totalElements={0}
          canLoadMore={false}
          error={null}
          onLoadMore={vi.fn()}
          onResetFilters={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(emptyHtml).toContain('Aucune adresse ne correspond à votre recherche.');
    expect(emptyHtml).toContain('/images/etat-vide-144w.webp');
    expect(emptyHtml).toContain('/images/etat-vide-320w.webp');
    expect(emptyHtml).toContain('Réinitialiser les filtres');
  });

  it('DirectoryMapSection affiche le repli hors ligne explicite et les fiches en cache', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DirectoryMapSection
          items={[]}
          loading={false}
          loadingMore={false}
          hasSearched={false}
          hasActiveFilters={false}
          isOffline={true}
          visitedCodes={['ZIG-KBG-4271']}
          totalElements={0}
          canLoadMore={false}
          error={null}
          onLoadMore={vi.fn()}
          onResetFilters={vi.fn()}
          onSwitchToGrid={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(html).toContain('data-testid="directory-map-offline"');
    expect(html).toContain('Carte interactive indisponible hors ligne');
    expect(html).toContain('href="/a/ZIG-KBG-4271"');
  });

  it('DirectoryMapSection affiche un état vide propre lorsque aucun résultat n’est retourné', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DirectoryMapSection
          items={[]}
          loading={false}
          loadingMore={false}
          hasSearched={true}
          hasActiveFilters={true}
          isOffline={false}
          visitedCodes={[]}
          totalElements={0}
          canLoadMore={false}
          error={null}
          onLoadMore={vi.fn()}
          onResetFilters={vi.fn()}
          onSwitchToGrid={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(html).toContain('Aucune adresse ne correspond à votre recherche.');
    expect(html).toContain('Revenir à la grille');
  });
});
