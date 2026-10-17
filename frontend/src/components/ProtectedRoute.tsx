import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'PROPRIETAIRE')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 min-h-[1200px] flex items-start justify-center p-6 pt-16">
        <div className="flex flex-col items-center gap-3 p-8 rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)]">
          <Loader2 className="w-7 h-7 text-[#1D528F] animate-spin" />
          <p className="text-xs font-medium text-[#5C4D44]">Vérification de la session...</p>
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
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#231A15]">Accès réservé</h1>
          <p className="text-xs sm:text-sm text-[#5C4D44]">
            Cette page est réservée aux comptes disposant des droits d'administration.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] touch-target"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
