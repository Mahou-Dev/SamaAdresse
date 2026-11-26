import React from 'react';
import { WifiOff, Loader2, RefreshCw } from 'lucide-react';
import type { OfflineDraft } from '../../utils/offlineDb';
import { StatusBadge } from '../../components/ui';

export interface OfflineDraftsQueueProps {
  drafts: OfflineDraft[];
  isOnline: boolean;
  isSyncing: boolean;
  onSyncNow: () => void;
}

export const OfflineDraftsQueue: React.FC<OfflineDraftsQueueProps> = ({
  drafts,
  isOnline,
  isSyncing,
  onSyncNow,
}) => {
  if (drafts.length === 0) return null;

  return (
    <section
      aria-labelledby="drafts-heading"
      className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-warning-border shadow-xs space-y-3.5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-warning-soft border border-warning-border text-warning flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id="drafts-heading" className="text-sm font-bold text-ink">
              File d'attente hors ligne ({drafts.length})
            </h2>
            <p className="text-xs text-ink-muted">
              {isOnline
                ? 'Prêtes à être transmises au serveur.'
                : 'Conservées localement sur cet appareil jusqu’au retour du réseau.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSyncNow}
          disabled={!isOnline || isSyncing}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink hover:bg-ink-secondary text-ink-inverse text-xs font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed min-h-[40px] cursor-pointer shrink-0"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Synchronisation…</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Envoyer maintenant</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-2.5">
        {drafts.map((draft) => {
          const displayCode = draft.reservedCode || `${draft.zone}-${draft.quartier}-????`;
          const formattedDate = new Date(draft.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={draft.id}
              className="p-3.5 bg-surface rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-mono text-xs font-bold text-ink whitespace-nowrap">
                    {displayCode}
                  </span>
                  <span className="text-ink-secondary truncate">
                    · {draft.description || 'Sans description'}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Enregistrée le {formattedDate} ({draft.quartier})
                </p>
                {draft.lastError && (
                  <p role="alert" className="text-[11px] font-medium text-danger">
                    {draft.lastError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={draft.status} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
