import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, Home, LayoutDashboard } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'PROPRIETAIRE')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex-1 min-h-[60vh] flex items-center justify-center p-6 bg-surface"
        aria-busy="true"
        aria-label="Vérification de la session en cours"
      >
        <div className="flex flex-col items-center gap-3 px-8 py-7 rounded-2xl bg-surface-elevated border border-border shadow-xs">
          <Loader2 className="w-7 h-7 text-institution animate-spin" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-medium text-ink-muted">
            Vérification de la session…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Hors ligne : permettre au composant cible d'afficher son état sobre de repli hors ligne
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-surface">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-surface-elevated border border-border shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-danger-soft border border-danger-border text-danger flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
            Accès réservé
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Cette page est réservée aux comptes disposant des droits d'administration.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            <Link
              to="/tableau-de-bord"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
            >
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              <span>Mon tableau de bord</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
