import React from 'react';
import type { SemanticTone } from '../../types/designSystem';
import { cn } from '../../utils/cn';

export type BadgeVariant = SemanticTone | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface text-ink-secondary border-border',
  brand: 'bg-brand-soft text-brand-hover border-brand-border',
  institution: 'bg-institution-soft text-institution border-institution-border',
  success: 'bg-success-soft text-success border-success-border',
  warning: 'bg-warning-soft text-warning border-warning-border',
  danger: 'bg-danger-soft text-danger border-danger-border',
  outline: 'bg-surface-elevated text-ink-secondary border-border-strong',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-ink-muted',
  brand: 'bg-brand',
  institution: 'bg-institution',
  success: 'bg-success',
  warning: 'bg-warning-solid',
  danger: 'bg-danger',
  outline: 'bg-ink-muted',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon: Icon,
  className,
  ...rest
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border leading-none whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-xs gap-2',
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASSES[variant])} aria-hidden="true" />}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};
