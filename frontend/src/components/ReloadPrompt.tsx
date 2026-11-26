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
      (window as unknown as { __triggerPwaRefreshPrompt?: () => void }).__triggerPwaRefreshPrompt =
        () => setNeedRefresh(true);
    }
  }, [setNeedRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 z-[var(--z-toast)] p-4 rounded-2xl border border-border bg-surface-elevated shadow-xl max-w-sm flex flex-col gap-2.5 font-sans no-print sa-animate-scale-in"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-ink">Nouvelle version disponible</p>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-ink-muted hover:text-ink hover:bg-surface p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Fermer la notification de mise à jour"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">
        Une mise à jour de l'application SamaAdresse a été téléchargée.
      </p>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[38px]"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Actualiser</span>
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="inline-flex items-center px-3 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink-secondary text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
};
