import React from 'react';
import { CheckCircle2, AlertCircle, Archive, Clock, Check, X, Flag } from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatusType =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED'
  | 'SIGNALED'
  | 'PENDING'
  | 'OPEN'
  | 'RESOLVED'
  | 'DISMISSED';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  {
    label: string;
    classes: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  ACTIVE: {
    label: 'Active',
    classes: 'bg-success-soft text-success border-success-border',
    icon: CheckCircle2,
  },
  SUSPENDED: {
    label: 'Suspendue',
    classes: 'bg-danger-soft text-danger border-danger-border',
    icon: AlertCircle,
  },
  SIGNALED: {
    label: 'Signalée',
    classes: 'bg-warning-soft text-warning border-warning-border',
    icon: Flag,
  },
  ARCHIVED: {
    label: 'Archivée',
    classes: 'bg-surface text-ink-muted border-border-strong',
    icon: Archive,
  },
  PENDING: {
    label: "En attente d'envoi",
    classes: 'bg-warning-soft text-warning border-warning-border',
    icon: Clock,
  },
  OPEN: {
    label: 'Ouvert',
    classes: 'bg-brand-soft text-brand-hover border-brand-border',
    icon: AlertCircle,
  },
  RESOLVED: {
    label: 'Traité',
    classes: 'bg-success-soft text-success border-success-border',
    icon: Check,
  },
  DISMISSED: {
    label: 'Classé sans suite',
    classes: 'bg-surface text-ink-muted border-border-strong',
    icon: X,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  className,
}) => {
  const upper = status.toUpperCase();
  const normalizedStatus: StatusType =
    upper in STATUS_CONFIG ? (upper as StatusType) : 'PENDING';

  const config = STATUS_CONFIG[normalizedStatus];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border leading-none whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-xs gap-1.5',
        config.classes,
        className
      )}
    >
      <Icon
        className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
};
