import React from 'react';
import { Wifi, WifiOff, RefreshCw, CloudUpload } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface OfflineStatusIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
  onSyncClick?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Indicateur de connectivité et de synchronisation hors ligne (IndexedDB / Workbox).
 */
export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  isOnline,
  pendingCount = 0,
  isSyncing = false,
  onSyncClick,
  compact = false,
  className,
}) => {
  const state = isSyncing
    ? {
        label: 'Synchronisation…',
        classes: 'bg-institution-soft text-institution border-institution-border',
        Icon: RefreshCw,
        spin: true,
      }
    : !isOnline
    ? {
        label: pendingCount > 0 ? `Hors ligne (${pendingCount})` : 'Hors ligne',
        classes: 'bg-warning-soft text-warning border-warning-border',
        Icon: WifiOff,
        spin: false,
      }
    : pendingCount > 0
    ? {
        label: `${pendingCount} en attente`,
        classes: 'bg-brand-soft text-brand-hover border-brand-border',
        Icon: CloudUpload,
        spin: false,
      }
    : {
        label: 'En ligne',
        classes: 'bg-success-soft text-success border-success-border',
        Icon: Wifi,
        spin: false,
      };

  const Icon = state.Icon;
  const clickable = Boolean(onSyncClick) && isOnline && pendingCount > 0 && !isSyncing;

  const baseClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full border font-semibold leading-none whitespace-nowrap',
    compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs',
    state.classes,
    clickable && 'hover:opacity-90 cursor-pointer transition-opacity focus-visible:outline-2 focus-visible:outline-institution',
    className
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onSyncClick}
        aria-label={`${state.label} — Lancer la synchronisation`}
        className={baseClasses}
      >
        <Icon className={cn('w-3.5 h-3.5 shrink-0', state.spin && 'animate-spin')} aria-hidden="true" />
        <span>{state.label}</span>
      </button>
    );
  }

  return (
    <span role="status" aria-live="polite" className={baseClasses}>
      <Icon className={cn('w-3.5 h-3.5 shrink-0', state.spin && 'animate-spin')} aria-hidden="true" />
      <span>{state.label}</span>
    </span>
  );
};
