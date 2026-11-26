import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCoveredZoneNames } from '../utils/geoGrid';

export const AppFooter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const coveredZones = getCoveredZoneNames().join(' · ');

  return (
    <footer className="w-full border-t border-border bg-surface py-10 px-4 sm:px-6 lg:px-8 mt-auto no-print">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 justify-center sm:justify-start">
            <span className="w-6 h-6 rounded-lg bg-brand text-ink-inverse inline-flex items-center justify-center shadow-xs">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-ink tracking-tight">SamaAdresse</span>
            <span className="text-xs text-ink-muted">· Adressage numérique au Sénégal</span>
          </div>
          <p className="text-xs text-ink-muted">
            Zones couvertes : {coveredZones}
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 text-xs font-medium text-ink-secondary"
          aria-label="Liens de pied de page"
        >
          <Link to="/" className="hover:text-ink transition-colors py-1">
            Accueil
          </Link>
          <Link to="/annuaire" className="hover:text-ink transition-colors py-1">
            Annuaire
          </Link>
          <Link to="/addresses/new" className="hover:text-ink transition-colors py-1">
            Créer une adresse
          </Link>
          {isAuthenticated ? (
            <Link to="/tableau-de-bord" className="hover:text-ink transition-colors py-1">
              Tableau de bord
            </Link>
          ) : (
            <Link to="/login" className="hover:text-ink transition-colors py-1">
              Se connecter
            </Link>
          )}
          <span className="text-ink-muted">© 2026 SamaAdresse</span>
        </nav>
      </div>
    </footer>
  );
};
