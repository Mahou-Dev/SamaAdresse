import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && panelRef.current) {
          const focusables = panelRef.current.querySelectorAll<HTMLElement>(
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

      // Focus le premier élément focusable ou le bouton fermer
      setTimeout(() => {
        const closeBtn = panelRef.current?.querySelector<HTMLButtonElement>('button');
        closeBtn?.focus();
      }, 50);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[width];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidepanel-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className={`relative z-10 w-full ${widthClass} h-full bg-[#FBF7EF] border-l border-[#766B5B] shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#766B5B] flex items-start justify-between gap-4 bg-[#F2ECE1]">
          <div>
            <h2 id="sidepanel-title" className="text-base sm:text-lg font-bold text-[#231A15]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#5C4D44] mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="p-1.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] transition cursor-pointer touch-target shrink-0 focus-visible:outline-2 focus-visible:outline-[#F2B233]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-[#766B5B] bg-[#F2ECE1]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
