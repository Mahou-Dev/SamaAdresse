import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Store,
  Building2,
  ArrowRight,
  MapPin,
  Map as MapIcon,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { AddressCard } from '../../components/shared/AddressCard';
import { getAllZones, getAllQuartiers } from '../../utils/geoGrid';
import type { HomeDiscoveryState } from './useHomeDiscovery';
import type { LocationType } from '../../api/addressApi';

const CATEGORIES: {
  type: LocationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClasses: string;
}[] = [
  {
    type: 'MAISON',
    label: 'Maisons & concessions',
    description: 'Logements, villas et concessions familiales faciles à retrouver.',
    icon: Home,
    accentClasses: 'bg-institution-soft text-institution border-institution-border',
  },
  {
    type: 'COMMERCE',
    label: 'Commerces & services',
    description: 'Boutiques, ateliers, pharmacies et points de livraison locaux.',
    icon: Store,
    accentClasses: 'bg-brand-soft text-brand-hover border-brand-border',
  },
  {
    type: 'INSTITUTION',
    label: 'Institutions & lieux publics',
    description: 'Écoles, mairies, centres de santé et établissements publics.',
    icon: Building2,
    accentClasses: 'bg-nature-soft text-nature border-nature-border',
  },
];

export interface HomeDiscoverySectionProps {
  discovery: HomeDiscoveryState;
}

export const HomeDiscoverySection: React.FC<HomeDiscoverySectionProps> = ({ discovery }) => {
  const zones = getAllZones();
  const quartiers = getAllQuartiers();

  return (
    <section
      aria-labelledby="home-discovery-title"
      className="w-full bg-canvas py-14 sm:py-20"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* 1. Explorer par type de lieu */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5">
              <h2
                id="home-discovery-title"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink"
              >
                Explorer par catégorie
              </h2>
              <p className="text-sm sm:text-base text-ink-secondary">
                Accédez directement aux adresses publiques classées par usage.
              </p>
            </div>
            <Link
              to="/annuaire"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-institution hover:text-institution-hover transition-colors shrink-0"
            >
              <span>Ouvrir l'annuaire</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.type}
                  to={`/annuaire?type=${category.type}`}
                  className="group p-5 sm:p-6 rounded-2xl border border-border bg-surface-elevated hover:border-border-strong hover:shadow-card-hover transition-all flex items-start gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
                >
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${category.accentClasses}`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-ink group-hover:text-brand transition-colors">
                        {category.label}
                      </h3>
                      <ArrowRight
                        className="w-4 h-4 text-ink-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 2. Zones et quartiers couverts (issus de geo-grid.json) */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
              Quartiers couverts
            </h2>
            <p className="text-sm text-ink-secondary">
              Sélectionnez un quartier pour filtrer immédiatement les adresses enregistrées.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {zones.map((zone) => {
              const zoneQuartiers = quartiers.filter(
                (q) => q.zoneCode.toUpperCase() === zone.code.toUpperCase()
              );
              return (
                <div
                  key={zone.code}
                  className="p-5 rounded-2xl border border-border bg-surface space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-ink">{zone.name}</h3>
                    <span className="font-mono text-xs font-bold text-institution bg-institution-soft border border-institution-border px-2 py-0.5 rounded-md">
                      {zone.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {zoneQuartiers.map((quartier) => (
                      <Link
                        key={quartier.code}
                        to={`/annuaire?quartier=${quartier.code}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-elevated text-ink-secondary border border-border hover:border-institution hover:text-institution transition-colors min-h-[36px] focus-visible:outline-2 focus-visible:outline-institution"
                      >
                        <MapPin className="w-3 h-3 text-institution shrink-0" aria-hidden="true" />
                        <span>{quartier.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Adresses récentes réelles de l'annuaire public */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                  Adresses publiées dans l'annuaire
                </h2>
                {discovery.isOnline && !discovery.loading && discovery.totalElements > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-ink-secondary">
                    {discovery.totalElements === 1
                      ? '1 adresse publique'
                      : `${discovery.totalElements} adresses publiques`}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-ink-secondary">
                Consultez les fiches publiques partagées volontairement par leurs propriétaires.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                to="/annuaire?view=map"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border-strong bg-surface-elevated hover:bg-surface text-xs sm:text-sm font-semibold text-ink transition-colors min-h-[40px]"
              >
                <MapIcon className="w-4 h-4 text-institution" aria-hidden="true" />
                <span>Voir sur la carte</span>
              </Link>
              <Link
                to="/annuaire"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-hover hover:bg-surface-active text-xs sm:text-sm font-semibold text-ink transition-colors min-h-[40px]"
              >
                <span>Tout voir</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* État hors ligne */}
          {!discovery.isOnline ? (
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-soft border border-warning-border text-warning flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ink">
                    Aperçu de l'annuaire indisponible hors ligne
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted">
                    Reconnectez-vous pour explorer l'ensemble des adresses publiques. Les fiches que vous avez déjà consultées restent accessibles ci-dessous.
                  </p>
                </div>
              </div>

              {discovery.visitedCodes.length > 0 && (
                <div className="pt-3 border-t border-border flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-ink-secondary">
                    Fiches en cache :
                  </span>
                  {discovery.visitedCodes.map((code) => (
                    <Link
                      key={code}
                      to={`/a/${code}`}
                      className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border font-mono text-xs font-bold text-institution hover:border-institution transition-colors"
                    >
                      {code}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : discovery.loading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              aria-label="Chargement des adresses publiées"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-surface-elevated overflow-hidden animate-pulse"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/3] w-full bg-surface-hover" />
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between gap-2">
                      <div className="h-5 w-28 bg-surface-hover rounded-full" />
                      <div className="h-5 w-24 bg-surface-hover rounded-full" />
                    </div>
                    <div className="h-4 w-full bg-surface-hover rounded" />
                    <div className="h-4 w-2/3 bg-surface-hover rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : discovery.error ? (
            <div
              role="alert"
              className="p-6 rounded-2xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <p className="text-sm text-ink-secondary">{discovery.error}</p>
              <button
                type="button"
                onClick={discovery.reload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface-hover text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer min-h-[40px] shrink-0"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Réessayer</span>
              </button>
            </div>
          ) : discovery.items.length === 0 ? (
            <div className="p-8 rounded-2xl border border-border bg-surface text-center space-y-3">
              <p className="text-sm font-semibold text-ink">
                Aucune adresse publique n'est encore référencée dans l'annuaire.
              </p>
              <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
                Créez votre adresse et activez l'option d'affichage dans l'annuaire pour apparaître ici.
              </p>
              <div className="pt-1">
                <Link
                  to="/addresses/new"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs sm:text-sm font-semibold transition-colors"
                >
                  <span>Créer une adresse</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {discovery.items.map((item) => (
                <AddressCard
                  key={item.code}
                  address={item}
                  copyableCode={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
