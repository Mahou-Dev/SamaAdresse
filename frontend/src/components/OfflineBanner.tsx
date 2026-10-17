import React from 'react';
import { WifiOff } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useOnlineStatus } from '../context/OnlineStatusContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const location = useLocation();

  if (isOnline) return null;

  const isAddressManagement =
    location.pathname.startsWith('/addresses/new') || location.pathname.startsWith('/addresses/mine');

  return (
    <aside
      aria-label="Avertissement de connexion"
      className="bg-[#F2ECE1] border-b border-[#766B5B] text-[#5C4D44] text-xs font-medium py-2 px-4 shadow-sm"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-center">
        <WifiOff className="w-4 h-4 text-[#8A3112] shrink-0" aria-hidden="true" />
        <span>
          {isAddressManagement
            ? 'Mode hors ligne · les nouvelles adresses seront transmises à votre retour en ligne'
            : 'Vous êtes hors ligne. Les fiches déjà consultées restent disponibles.'}
        </span>
      </div>
    </aside>
  );
};
