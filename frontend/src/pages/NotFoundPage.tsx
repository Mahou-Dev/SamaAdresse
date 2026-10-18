import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-12 max-w-xl mx-auto my-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#F2ECE1] border border-[#766B5B] flex items-center justify-center text-[#B84A24] mb-6 shadow-[0_2px_0_rgba(35,26,21,0.08)]">
        <MapPinOff className="w-8 h-8" />
      </div>

      <span className="font-mono text-4xl sm:text-5xl font-extrabold text-[#1D528F] tracking-tight block mb-2">
        404
      </span>

      <h1 className="text-xl sm:text-2xl font-bold text-[#231A15] mb-3">
        Page ou repère introuvable
      </h1>

      <p className="text-sm text-[#5C4D44] max-w-md mb-8 leading-relaxed">
        L'adresse ou la page demandée n'existe pas, a été modifiée ou n'est plus accessible.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] touch-target cursor-pointer"
      >
        <Home className="w-4 h-4" />
        <span>Retour à l'accueil</span>
      </Link>
    </div>
  );
};
