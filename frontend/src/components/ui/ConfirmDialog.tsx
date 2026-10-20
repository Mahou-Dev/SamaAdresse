import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        const cancelBtn = modalRef.current?.querySelector<HTMLButtonElement>('[data-action="cancel"]');
        cancelBtn?.focus();
      }, 50);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      iconBg: 'bg-[#FBF7EF] border-[#8A3112]/30 text-[#8A3112]',
      icon: AlertCircle,
      confirmBtn: 'bg-[#8A3112] hover:bg-[#9A3816] text-[#FBF7EF]',
    },
    warning: {
      iconBg: 'bg-[#F2ECE1] border-[#8A3112]/30 text-[#8A3112]',
      icon: AlertTriangle,
      confirmBtn: 'bg-[#B84A24] hover:bg-[#8A3112] text-[#FBF7EF]',
    },
    info: {
      iconBg: 'bg-[#F2ECE1] border-[#1D528F]/30 text-[#1D528F]',
      icon: Info,
      confirmBtn: 'bg-[#12304F] hover:bg-[#0C233B] text-[#FBF7EF]',
    },
  }[variant];

  const Icon = variantConfig.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div
        ref={modalRef}
        className="bg-[#FBF7EF] rounded-2xl border border-[#766B5B] shadow-2xl p-6 max-w-md w-full space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${variantConfig.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 id="confirm-dialog-title" className="text-base font-bold text-[#231A15]">
              {title}
            </h2>
            <div id="confirm-dialog-description" className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#766B5B]/30">
          <button
            type="button"
            data-action="cancel"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] text-[#231A15] hover:bg-[#F2ECE1] text-xs font-bold transition min-h-[44px] cursor-pointer touch-target disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#F2B233]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition min-h-[44px] cursor-pointer touch-target shadow-sm disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#F2B233] ${variantConfig.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
