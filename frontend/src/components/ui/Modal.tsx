import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../utils/cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocusSelector?: string;
  titleId?: string;
  descriptionId?: string;
  className?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocusSelector,
  titleId: providedTitleId,
  descriptionId: providedDescriptionId,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = providedTitleId || `${generatedId}-title`;
  const descriptionId = providedDescriptionId || `${generatedId}-description`;

  useFocusTrap({
    isActive: isOpen,
    containerRef: modalRef,
    onEscape: closeOnEscape ? onClose : undefined,
    initialFocusSelector,
    lockScroll: true,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title || providedTitleId ? titleId : undefined}
      aria-describedby={description || providedDescriptionId ? descriptionId : undefined}
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Voile d'arrière-plan */}
      <div
        className="fixed inset-0 bg-surface-inverse/50 backdrop-blur-[2px] sa-animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Boîte de dialogue */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full rounded-2xl bg-surface-elevated border border-border shadow-xl',
          'max-h-[90vh] flex flex-col overflow-hidden sa-animate-scale-in focus:outline-none',
          SIZE_CLASSES[size],
          className
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
            <div className="space-y-1 min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-bold text-ink leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="text-sm text-ink-muted leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fenêtre"
                className="p-2 -mr-2 -mt-1 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-hover transition cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-institution"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
