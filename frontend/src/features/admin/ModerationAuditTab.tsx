import React, { useMemo, useState } from 'react';
import { History, Search, Info } from 'lucide-react';
import { Card, DataTable, EmptyState } from '../../components/ui';
import type { LocalAuditAction } from './types';

export interface ModerationAuditTabProps {
  logs: LocalAuditAction[];
}

export const ModerationAuditTab: React.FC<ModerationAuditTabProps> = ({ logs }) => {
  const [auditFilterType, setAuditFilterType] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  const filteredLogs = useMemo(() => {
    let list = [...logs];
    if (auditFilterType !== 'ALL') {
      list = list.filter((l) => l.actionType === auditFilterType);
    }
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.addressCode.toLowerCase().includes(q) ||
          l.actionLabel.toLowerCase().includes(q) ||
          l.reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, auditFilterType, auditSearchQuery]);

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">Type d'action :</span>
            <select
              aria-label="Filtrer par type d'action"
              value={auditFilterType}
              onChange={(e) => setAuditFilterType(e.target.value)}
              className="px-3 py-2 min-h-[38px] text-xs font-semibold rounded-xl border border-border-strong bg-canvas text-ink focus:outline-none focus:border-institution cursor-pointer"
            >
              <option value="ALL">Toutes les actions</option>
              <option value="SUSPEND">Suspensions</option>
              <option value="REINSTATE">Rétablissements</option>
              <option value="RESOLVE">Résolutions</option>
              <option value="DISMISS">Classements sans suite</option>
            </select>
          </div>

          <div className="relative min-w-[240px]">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={auditSearchQuery}
              onChange={(e) => setAuditSearchQuery(e.target.value)}
              placeholder="Rechercher par code ou motif…"
              className="w-full pl-9 pr-3 py-2 min-h-[38px] text-xs rounded-xl border border-border-strong bg-canvas text-ink placeholder:text-ink-subtle focus:outline-none focus:border-institution focus:ring-2 focus:ring-institution-soft"
            />
          </div>
        </div>
      </Card>

      {/* Transparence sur la persistance côté serveur */}
      <div className="p-4 rounded-2xl bg-info-soft border border-info-border flex items-start gap-2.5 text-xs text-info leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-0.5">
          <span className="font-bold text-ink block">
            Traçabilité des actions administratives
          </span>
          <p className="text-ink-secondary">
            Toutes vos actions de modération sont persistées côté serveur dans la table{' '}
            <code className="font-mono bg-surface-elevated border border-border px-1.5 py-0.5 rounded text-ink">
              admin_actions
            </code>
            . Cet onglet récapitule les actions confirmées durant votre session active.
          </p>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Aucune action enregistrée dans cette session"
          description="Les suspensions d'adresses, rétablissements et clôtures de signalements effectués apparaîtront ici."
        />
      ) : (
        <DataTable<LocalAuditAction>
          data={filteredLogs}
          keyExtractor={(l) => l.id}
          ariaLabel="Journal d'audit de session"
          columns={[
            {
              key: 'actionLabel',
              header: 'Action',
              render: (l) => <span className="font-semibold text-ink">{l.actionLabel}</span>,
            },
            {
              key: 'addressCode',
              header: 'Code adresse',
              render: (l) => (
                <span className="font-mono font-bold text-institution">{l.addressCode}</span>
              ),
            },
            {
              key: 'reason',
              header: 'Motif renseigné',
              render: (l) => (
                <span className="text-ink-secondary line-clamp-1">{l.reason || '—'}</span>
              ),
            },
            {
              key: 'adminEmail',
              header: 'Administrateur',
              render: (l) => (
                <span className="font-mono text-xs text-ink-muted">{l.adminEmail}</span>
              ),
            },
            {
              key: 'timestamp',
              header: 'Heure',
              render: (l) => (
                <span className="font-mono text-xs text-ink-muted">
                  {new Date(l.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              ),
            },
          ]}
          renderMobileCard={(l) => (
            <div className="p-4 rounded-2xl border border-border bg-surface-elevated shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink">{l.actionLabel}</span>
                <span className="font-mono font-bold text-institution">{l.addressCode}</span>
              </div>
              {l.reason && (
                <p className="text-ink-secondary bg-surface p-2.5 rounded-xl border border-border">
                  Motif : {l.reason}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                <span className="truncate">{l.adminEmail}</span>
                <span className="font-mono shrink-0">
                  {new Date(l.timestamp).toLocaleTimeString('fr-FR')}
                </span>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};
