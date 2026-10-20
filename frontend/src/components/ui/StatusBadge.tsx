import React from 'react';
import { CheckCircle2, AlertCircle, Archive, Clock, Check, X } from 'lucide-react';

export type StatusType =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED'
  | 'PENDING'
  | 'OPEN'
  | 'RESOLVED'
  | 'DISMISSED';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-[#2A6B44]/10',
    text: 'text-[#2A6B44]',
    border: 'border-[#2A6B44]/25',
    icon: CheckCircle2,
  },
  SUSPENDED: {
    label: 'Suspendue',
    bg: 'bg-[#FBF7EF]',
    text: 'text-[#8A3112]',
    border: 'border-[#8A3112]/40',
    icon: AlertCircle,
  },
  ARCHIVED: {
    label: 'Archivée',
    bg: 'bg-[#F2ECE1]',
    text: 'text-[#5C4D44]',
    border: 'border-[#766B5B]',
    icon: Archive,
  },
  PENDING: {
    label: "En attente d'envoi",
    bg: 'bg-[#F2ECE1]',
    text: 'text-[#8A3112]',
    border: 'border-[#8A3112]/30',
    icon: Clock,
  },
  OPEN: {
    label: 'Ouvert',
    bg: 'bg-[#F2ECE1]',
    text: 'text-[#8A3112]',
    border: 'border-[#8A3112]/30',
    icon: AlertCircle,
  },
  RESOLVED: {
    label: 'Traité',
    bg: 'bg-[#2A6B44]/10',
    text: 'text-[#2A6B44]',
    border: 'border-[#2A6B44]/25',
    icon: Check,
  },
  DISMISSED: {
    label: 'Classé sans suite',
    bg: 'bg-[#F2ECE1]',
    text: 'text-[#5C4D44]',
    border: 'border-[#766B5B]',
    icon: X,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  className = '',
}) => {
  const normalizedStatus = (status.toUpperCase() in STATUS_CONFIG
    ? (status.toUpperCase() as StatusType)
    : 'PENDING') as StatusType;

  const config = STATUS_CONFIG[normalizedStatus];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{displayLabel}</span>
    </span>
  );
};
