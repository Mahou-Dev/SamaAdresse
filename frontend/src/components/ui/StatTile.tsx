import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatTileProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'alert' | 'warning' | 'neutral';
  dataTestId?: string;
}

const VARIANT_STYLES = {
  default: {
    border: 'border-border',
    iconBg: 'bg-institution-soft text-institution border-institution-border',
    hover: 'hover:border-institution hover:shadow-card-hover',
  },
  success: {
    border: 'border-success-border',
    iconBg: 'bg-success-soft text-success border-success-border',
    hover: 'hover:border-success hover:shadow-card-hover',
  },
  alert: {
    border: 'border-danger-border',
    iconBg: 'bg-danger-soft text-danger border-danger-border',
    hover: 'hover:border-danger hover:shadow-card-hover',
  },
  warning: {
    border: 'border-warning-border',
    iconBg: 'bg-warning-soft text-warning border-warning-border',
    hover: 'hover:border-warning-solid hover:shadow-card-hover',
  },
  neutral: {
    border: 'border-border',
    iconBg: 'bg-surface text-ink-secondary border-border-strong',
    hover: 'hover:border-border-strong hover:shadow-card-hover',
  },
} as const;

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  to,
  onClick,
  variant = 'default',
  dataTestId,
}) => {
  const styles = VARIANT_STYLES[variant];

  const content = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-ink-muted leading-snug">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border',
              styles.iconBg
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
          {(to || onClick) && (
            <ArrowUpRight
              className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-mono tabular-nums">
          {value}
        </div>
        {sublabel && (
          <p className="text-xs text-ink-muted mt-1 leading-tight">{sublabel}</p>
        )}
      </div>
    </div>
  );

  const interactiveClasses = cn(
    'group text-left rounded-2xl bg-surface-elevated border shadow-xs transition-all duration-200 cursor-pointer block',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
    styles.border,
    styles.hover
  );

  if (to) {
    return (
      <Link to={to} className={interactiveClasses} data-testid={dataTestId}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={interactiveClasses} data-testid={dataTestId}>
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn('rounded-2xl bg-surface-elevated border shadow-xs', styles.border)}
      data-testid={dataTestId}
    >
      {content}
    </div>
  );
};
