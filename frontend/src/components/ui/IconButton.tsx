import React from 'react';
import type { ComponentSize } from '../../types/designSystem';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';
import type { ButtonVariant } from './Button';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: React.ComponentType<{ className?: string }>;
  /** Libellé accessible obligatoire pour les boutons à icône seule (WCAG 2.2 AA). */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ComponentSize;
  rounded?: 'md' | 'full';
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-ink-inverse border border-transparent hover:bg-brand-hover active:bg-brand-active shadow-xs',
  secondary:
    'bg-institution text-ink-inverse border border-transparent hover:bg-institution-hover active:bg-institution-active shadow-xs',
  outline:
    'bg-surface-elevated text-ink-secondary border border-border-strong hover:bg-surface hover:text-ink hover:border-border-control active:bg-surface-hover shadow-xs',
  subtle:
    'bg-surface text-ink-secondary border border-border hover:bg-surface-hover hover:text-ink active:bg-surface-active',
  ghost:
    'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-hover hover:text-ink active:bg-surface-active',
  danger: 'bg-danger text-ink-inverse border border-transparent hover:bg-danger-hover active:bg-danger-active shadow-xs',
};

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-12 h-12',
};

const ICON_SIZES: Record<ComponentSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  rounded = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className,
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center shrink-0 select-none',
        'transition-[background-color,border-color,color,transform] duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
        'active:scale-[0.97] disabled:active:scale-100',
        rounded === 'full' ? 'rounded-full' : 'rounded-xl',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        isDisabled ? 'opacity-55 pointer-events-none cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <Spinner size="xs" tone="current" label={ariaLabel} />
      ) : (
        <Icon className={ICON_SIZES[size]} aria-hidden="true" />
      )}
    </button>
  );
};
