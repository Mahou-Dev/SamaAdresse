import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Compass,
  LayoutDashboard,
  Map as MapIcon,
  ArrowRight,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { getMyAddresses } from '../../api/addressApi';
import type { AddressResponse } from '../../api/addressApi';
import type { UserProfile } from '../../api/apiClient';
import { SearchBar } from '../../components/shared/SearchBar';
import { AddressCard } from '../../components/shared/AddressCard';
import { getAllQuartiers } from '../../utils/geoGrid';

export interface HomeConnectedViewProps {
  user: UserProfile | null;
}

export const HomeConnectedView: React.FC<HomeConnectedViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recentAddresses, setRecentAddresses] = useState<AddressResponse[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);

  const firstName = user?.fullName?.split(' ')[0] || 'vous';
  const quartiers = getAllQuartiers();

  useEffect(() => {
    let cancelled = false;

    const loadMine = async () => {
      try {
        const data = await getMyAddresses();
        if (cancelled) return;
        setRecentAddresses(data.slice(0, 3));
        setAddressError(null);
      } catch {
        if (cancelled) return;
        setAddressError('Impossible de charger vos adresses récentes.');
      } finally {
        if (!cancelled) {
          setLoadingAddresses(false);
        }
      }
    };

    void loadMine();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchSubmit = (rawValue: string) => {
    const trimmed = rawValue.trim();
    navigate(trimmed ? `/annuaire?q=${encodeURIComponent(trimmed)}` : '/annuaire');
  };

  return (
    <div className="flex-1 w-full bg-canvas">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* En-tête de bienvenue & recherche annuaire */}
        <div className="rounded-3xl border border-border bg-surface-secondary p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Bonjour {firstName}
              </h1>
              <p className="text-sm text-ink-secondary">
                Retrouvez vos adresses récentes ou recherchez un lieu dans l'annuaire public.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/tableau-de-bord"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-sm font-semibold transition-colors min-h-[44px]"
              >
                <LayoutDashboard className="w-4 h-4 text-institution" aria-hidden="true" />
                <span>Tableau de bord</span>
              </Link>
              <Link
                to="/addresses/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                <span>Nouvelle adresse</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSearchSubmit}
              placeholder="Rechercher dans l'annuaire public…"
              ariaLabel="Rechercher une adresse dans l'annuaire"
              variant="compact"
              className="flex-1"
            />
            <Link
              to="/annuaire?view=map"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-border-strong bg-surface-elevated hover:bg-surface text-xs sm:text-sm font-semibold text-ink transition-colors min-h-[44px] shrink-0"
            >
              <MapIcon className="w-4 h-4 text-institution" aria-hidden="true" />
              <span>Vue carte</span>
            </Link>
          </div>
        </div>

        {/* Section Adresses récentes */}
        <section aria-labelledby="recent-addresses-heading" className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="recent-addresses-heading"
              className="text-xl font-bold text-ink tracking-tight"
            >
              Vos adresses récentes
            </h2>
            <Link
              to="/addresses/mine"
              className="inline-flex items-center gap-1 text-sm font-semibold text-institution hover:text-institution-hover shrink-0"
            >
              <span>Tout voir</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {loadingAddresses ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-surface-elevated overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-surface-hover" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-28 bg-surface-hover rounded-full" />
                    <div className="h-4 w-full bg-surface-hover rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : addressError ? (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-danger-soft border border-danger-border text-danger text-sm flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{addressError}</span>
            </div>
          ) : recentAddresses.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-surface border border-border space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-brand mx-auto">
                <Compass className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-ink">
                  Vous n'avez pas encore d'adresse.
                </h3>
                <p className="text-sm text-ink-muted max-w-md mx-auto">
                  Placez-vous devant l'entrée de votre bâtiment avec le GPS actif pour générer votre première plaque SamaAdresse.
                </p>
              </div>
              <Link
                to="/addresses/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Créer ma première adresse</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentAddresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={{
                    code: addr.code,
                    zone: addr.zone,
                    quartier: addr.quartier,
                    locationType: addr.locationType,
                    description: addr.description,
                    photoUrl: addr.photoUrl,
                    status: addr.status,
                    createdAt: addr.createdAt,
                  }}
                  showStatus={true}
                  copyableCode={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* Découverte rapide par quartier */}
        <section aria-labelledby="connected-quartiers-heading" className="space-y-3 pt-2 border-t border-border">
          <h2 id="connected-quartiers-heading" className="text-sm font-bold text-ink-secondary">
            Explorer l'annuaire par quartier
          </h2>
          <div className="flex flex-wrap gap-2">
            {quartiers.map((q) => (
              <Link
                key={q.code}
                to={`/annuaire?quartier=${q.code}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface hover:bg-surface-hover text-ink-secondary border border-border transition-colors"
              >
                <MapPin className="w-3 h-3 text-institution shrink-0" aria-hidden="true" />
                <span>{q.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
