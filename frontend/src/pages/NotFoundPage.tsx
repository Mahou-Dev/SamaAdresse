import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 bg-canvas">
      <div className="max-w-md w-full space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-soft border border-brand-border flex items-center justify-center text-brand mx-auto">
          <MapPinOff className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="font-mono text-4xl sm:text-5xl font-extrabold text-institution tracking-tight block">
          404
        </span>

        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
          Page ou repère introuvable
        </h1>

        <p className="text-sm text-ink-muted leading-relaxed">
          L'adresse ou la page demandée n'existe pas, a été modifiée ou n'est plus accessible.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Retour à l'accueil</span>
          </Link>
          <Link
            to="/annuaire"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Compass className="w-4 h-4 text-institution" aria-hidden="true" />
            <span>Explorer l'annuaire</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
