import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Map as MapIcon, Plus, ExternalLink } from 'lucide-react';
import { SearchBar } from '../../components/shared/SearchBar';
import { AddressPlate } from '../../components/AddressPlate';
import { getCoveredZoneNames } from '../../utils/geoGrid';

export interface HomeHeroProps {
  demoCode: string;
}

const FEATURED_QUARTIERS = [
  { code: 'KBG', label: 'Boucotte' },
  { code: 'ESC', label: 'Escale' },
  { code: 'TIL', label: 'Tilène' },
  { code: 'PLT', label: 'Dakar Plateau' },
] as const;

export const HomeHero: React.FC<HomeHeroProps> = ({ demoCode }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const coveredZones = getCoveredZoneNames().join(' · ');

  const handleSearchSubmit = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed) {
      navigate(`/annuaire?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/annuaire');
    }
  };

  return (
    <section
      aria-labelledby="home-hero-title"
      className="w-full border-b border-border bg-gradient-to-b from-surface-secondary via-canvas to-canvas"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Colonne gauche : proposition de valeur & recherche centrale */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border text-xs font-semibold text-ink-secondary shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden="true" />
              <span>{coveredZones}</span>
            </div>

            <div className="space-y-4">
              <h1
                id="home-hero-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink leading-[1.1]"
              >
                Trouvez et partagez chaque adresse, même sans nom de rue
              </h1>
              <p className="text-base sm:text-lg text-ink-secondary max-w-xl leading-relaxed">
                Recherchez un logement, un commerce ou une institution dans l'annuaire public, ou créez une plaque géolocalisée pour guider vos proches et vos livreurs.
              </p>
            </div>

            {/* Barre de recherche centrale reliée à /annuaire */}
            <div className="max-w-xl space-y-3">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={handleSearchSubmit}
                placeholder="Code, quartier, commerce ou repère…"
                ariaLabel="Rechercher une adresse dans l'annuaire public"
                submitLabel="Rechercher"
                variant="hero"
              />

              {/* Raccourcis de quartiers réels */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-xs font-medium text-ink-muted">Accès rapide :</span>
                {FEATURED_QUARTIERS.map((q) => (
                  <Link
                    key={q.code}
                    to={`/annuaire?quartier=${q.code}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface hover:bg-surface-hover text-ink-secondary border border-border transition-colors focus-visible:outline-2 focus-visible:outline-institution"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions directes */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/addresses/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-sm font-semibold transition-colors shadow-xs min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                <span>Créer mon adresse</span>
              </Link>

              <Link
                to="/annuaire?view=map"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
              >
                <MapIcon className="w-4 h-4 text-institution" aria-hidden="true" />
                <span>Explorer la carte</span>
              </Link>

              {demoCode && (
                <Link
                  to={`/a/${demoCode}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-institution hover:text-institution-hover hover:bg-institution-soft transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-institution"
                >
                  <span>Voir une fiche d'exemple</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          {/* Colonne droite : visuel d'ambiance + plaque d'adresse emblématique */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-border bg-surface-secondary shadow-lg">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src="/images/hero-accueil-800w.webp"
                  srcSet="/images/hero-accueil-480w.webp 480w, /images/hero-accueil-800w.webp 800w, /images/hero-accueil-1280w.webp 1280w"
                  sizes="(max-width: 1024px) 100vw, 520px"
                  width="800"
                  height="533"
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Cartouche plaque d'adresse */}
              <div className="p-4 sm:p-5 bg-surface-elevated border-t border-border space-y-2.5">
                <AddressPlate
                  code="ZIG-KBG-4271"
                  zone="ZIG"
                  type="MAISON"
                  size="md"
                  isExample={true}
                  className="w-full"
                />
                <div className="flex items-center justify-between gap-2 text-xs text-ink-muted pt-0.5">
                  <span>Boucotte - Kangourou · Ziguinchor</span>
                  <span className="font-semibold text-success">GPS &amp; hors ligne</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
