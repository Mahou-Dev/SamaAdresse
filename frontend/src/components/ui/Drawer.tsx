import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../utils/cn';

export type DrawerSide = 'right' | 'left' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: DrawerSide;
  size?: DrawerSize;
  closeOnBackdrop?: boolean;
  className?: string;
}

const HORIZONTAL_SIZES: Record<DrawerSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const SIDE_LAYOUT: Record<
  DrawerSide,
  { wrapper: string; panel: string; animation: string }
> = {
  right: {
    wrapper: 'justify-end items-stretch',
    panel: 'h-full w-full border-l border-border',
    animation: 'sa-animate-slide-right',
  },
  left: {
    wrapper: 'justify-start items-stretch',
    panel: 'h-full w-full border-r border-border',
    animation: 'sa-animate-slide-left',
  },
  bottom: {
    wrapper: 'justify-center items-end',
    panel: 'w-full max-h-[88vh] rounded-t-2xl border-t border-border',
    animation: 'sa-animate-slide-bottom',
  },
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = 'right',
  size = 'md',
  closeOnBackdrop = true,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useFocusTrap({
    isActive: isOpen,
    containerRef: panelRef,
    onEscape: onClose,
    lockScroll: true,
  });

  if (!isOpen) return null;

  const layout = SIDE_LAYOUT[side];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn('fixed inset-0 z-[var(--z-modal)] flex', layout.wrapper)}
    >
      <div
        className="fixed inset-0 bg-surface-inverse/50 backdrop-blur-[2px] sa-animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 bg-surface-elevated shadow-xl flex flex-col focus:outline-none',
          layout.panel,
          side !== 'bottom' && HORIZONTAL_SIZES[size],
          layout.animation,
          className
        )}
      >
        {side === 'bottom' && (
          <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
            <span className="w-10 h-1 rounded-full bg-border-strong" />
          </div>
        )}

        <div className="px-5 sm:px-6 py-4 border-b border-border bg-surface flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base sm:text-lg font-bold text-ink truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="p-2 -mr-1 rounded-xl border border-border bg-surface-elevated hover:bg-surface-hover text-ink-secondary hover:text-ink transition cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-institution"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-border bg-surface">{footer}</div>
        )}
      </div>
    </div>
  );
};
