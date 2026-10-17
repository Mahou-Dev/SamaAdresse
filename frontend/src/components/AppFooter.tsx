import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AppFooter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="w-full border-t border-[#E6DDD0] bg-[#FBF9F5] py-6 px-4 sm:px-8 mt-auto no-print">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="text-xs font-semibold text-[#231A15]">
            SamaAdresse · Adressage numérique
          </p>
          <p className="text-[11px] text-[#5C4D44] mt-0.5">
            Déploiement en cours à Ziguinchor et Dakar, Sénégal
          </p>
        </div>

        <nav className="flex items-center gap-4 text-xs font-medium text-[#1D528F]" aria-label="Liens de pied de page">
          <Link to="/" className="hover:underline">
            Accueil
          </Link>
          <span>·</span>
          {isAuthenticated ? (
            <Link to="/addresses/mine" className="hover:underline">
              Mes adresses
            </Link>
          ) : (
            <Link to="/login" className="hover:underline">
              Se connecter
            </Link>
          )}
          <span>·</span>
          <span className="text-[#5C4D44]">© 2026</span>
        </nav>
      </div>
    </footer>
  );
};
