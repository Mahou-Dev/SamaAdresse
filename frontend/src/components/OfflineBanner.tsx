import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../context/OnlineStatusContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Avertissement de connexion"
      className="bg-[#F2ECE1] border-b border-[#D4CEBF] text-[#5C4D44] text-xs font-medium py-2 px-4 shadow-[0_1px_0_rgba(35,26,21,0.04)]"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-center">
        <WifiOff className="w-4 h-4 text-[#8A3112] shrink-0" aria-hidden="true" />
        <span>Vous êtes hors ligne. Les fiches déjà consultées restent disponibles.</span>
      </div>
    </aside>
  );
};
