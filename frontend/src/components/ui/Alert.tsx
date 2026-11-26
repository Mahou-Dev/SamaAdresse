import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { FeedbackVariant } from '../../types/designSystem';
import { cn } from '../../utils/cn';

export interface AlertProps {
  variant?: FeedbackVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  FeedbackVariant,
  {
    container: string;
    iconColor: string;
    Icon: React.ComponentType<{ className?: string }>;
    role: 'alert' | 'status';
  }
> = {
  info: {
    container: 'bg-info-soft border-info-border text-ink',
    iconColor: 'text-info',
    Icon: Info,
    role: 'status',
  },
  success: {
    container: 'bg-success-soft border-success-border text-ink',
    iconColor: 'text-success',
    Icon: CheckCircle2,
    role: 'status',
  },
  warning: {
    container: 'bg-warning-soft border-warning-border text-ink',
    iconColor: 'text-warning',
    Icon: AlertTriangle,
    role: 'alert',
  },
  danger: {
    container: 'bg-danger-soft border-danger-border text-ink',
    iconColor: 'text-danger',
    Icon: AlertCircle,
    role: 'alert',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  action,
  className,
}) => {
  const { container, iconColor, Icon, role } = VARIANT_CONFIG[variant];

  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed',
        container,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColor)} aria-hidden="true" />
      <div className="flex-1 min-w-0 space-y-1">
        {title && <p className="font-semibold text-ink leading-snug">{title}</p>}
        <div className="text-xs sm:text-sm text-ink-secondary">{children}</div>
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer le message"
          className="p-1.5 -m-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition cursor-pointer focus-visible:outline-2 focus-visible:outline-institution shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
