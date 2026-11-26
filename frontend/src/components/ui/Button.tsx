import React from 'react';
import { Link } from 'react-router-dom';
import type { ComponentSize } from '../../types/designSystem';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
  /** Rend le bouton comme un lien interne React Router tout en conservant l'apparence exacte. */
  to?: string;
  /** Rend le bouton comme un lien HTML externe. */
  href?: string;
  target?: string;
  rel?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-ink-inverse border border-transparent shadow-xs hover:bg-brand-hover active:bg-brand-active',
  secondary:
    'bg-institution text-ink-inverse border border-transparent shadow-xs hover:bg-institution-hover active:bg-institution-active',
  outline:
    'bg-surface-elevated text-ink border border-border-strong shadow-xs hover:bg-surface hover:border-border-control active:bg-surface-hover',
  subtle:
    'bg-surface text-ink border border-border hover:bg-surface-hover hover:border-border-strong active:bg-surface-active',
  ghost:
    'bg-transparent text-ink-secondary border border-transparent hover:bg-surface-hover hover:text-ink active:bg-surface-active',
  danger:
    'bg-danger text-ink-inverse border border-transparent shadow-xs hover:bg-danger-hover active:bg-danger-active',
};

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'min-h-[44px] px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'min-h-[48px] px-6 py-3 text-base gap-2.5 rounded-xl',
};

const ICON_SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  disabled = false,
  type = 'button',
  to,
  href,
  target,
  rel,
  className,
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  const classes = cn(
    'inline-flex items-center justify-center font-semibold select-none',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
    'active:scale-[0.99] disabled:active:scale-100',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    isDisabled ? 'opacity-55 pointer-events-none cursor-not-allowed' : 'cursor-pointer',
    className
  );

  const content = (
    <>
      {isLoading ? (
        <Spinner size={size === 'lg' ? 'sm' : 'xs'} tone="current" label={loadingText || 'Chargement'} />
      ) : LeftIcon ? (
        <LeftIcon className={cn(ICON_SIZE_CLASSES[size], 'shrink-0')} aria-hidden="true" />
      ) : null}
      <span>{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && RightIcon ? (
        <RightIcon className={cn(ICON_SIZE_CLASSES[size], 'shrink-0')} aria-hidden="true" />
      ) : null}
    </>
  );

  if (to && !isDisabled) {
    return (
      <Link to={to} className={classes} aria-busy={isLoading || undefined}>
        {content}
      </Link>
    );
  }

  if (href && !isDisabled) {
    return (
      <a
        href={href}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={classes}
        aria-busy={isLoading || undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      onClick={onClick}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
};
