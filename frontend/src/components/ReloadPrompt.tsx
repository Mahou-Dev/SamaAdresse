import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__triggerPwaRefreshPrompt = () => setNeedRefresh(true);
    }
  }, [setNeedRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 right-4 z-50 p-4 rounded-xl border border-[#8C8272] bg-[#FFFFFF] shadow-[0_4px_12px_rgba(35,26,21,0.15)] max-w-sm flex flex-col gap-2.5 font-sans"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold text-[#231A15]">
          Nouvelle version disponible
        </p>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-[#5C4D44] hover:text-[#231A15] p-1 cursor-pointer"
          aria-label="Fermer la notification de mise à jour"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[11px] text-[#5C4D44] leading-relaxed">
        Une mise à jour de l'application SamaAdresse a été téléchargée.
      </p>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>
    </div>
  );
};
