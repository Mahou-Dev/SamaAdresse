import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Compass, LogIn } from 'lucide-react';

export const HomeCtaSection: React.FC = () => {
  return (
    <section
      aria-labelledby="home-cta-title"
      className="w-full bg-canvas py-14 sm:py-20"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-surface-inverse text-ink-inverse px-6 py-10 sm:px-12 sm:py-14 shadow-lg">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <h2
              id="home-cta-title"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
            >
              Prêt à créer l'adresse de votre logement ou commerce ?
            </h2>
            <p className="text-sm sm:text-base text-border-strong leading-relaxed">
              Obtenez un code permanent, une plaque imprimable et une fiche publique géolocalisée pour guider vos proches et vos livreurs sans détour.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/addresses/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-sm font-semibold transition-colors min-h-[46px] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                <span>Créer mon adresse</span>
              </Link>

              <Link
                to="/annuaire"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-ink-muted bg-canvas/10 hover:bg-canvas/15 text-ink-inverse text-sm font-semibold transition-colors min-h-[46px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
              >
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>Explorer l'annuaire</span>
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-border-strong hover:text-ink-inverse hover:bg-canvas/10 text-sm font-semibold transition-colors min-h-[46px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Se connecter</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
