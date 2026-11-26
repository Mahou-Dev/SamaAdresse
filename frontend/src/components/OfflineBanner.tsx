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
      role="status"
      aria-live="polite"
      aria-label="Avertissement de connexion"
      className="bg-warning-soft border-b border-warning-border text-warning text-xs font-medium py-2.5 px-4 no-print"
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-2 text-center">
        <WifiOff className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
        <span>
          {isAddressManagement
            ? 'Mode hors ligne · les nouvelles adresses seront transmises à votre retour en ligne'
            : 'Vous êtes hors ligne. Les fiches déjà consultées restent disponibles.'}
        </span>
      </div>
    </aside>
  );
};
