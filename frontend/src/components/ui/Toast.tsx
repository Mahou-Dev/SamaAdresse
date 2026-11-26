import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ToastContext } from './toastContext';
import type { ToastMessage, ToastType } from './toastContext';

const TOAST_STYLES: Record<
  ToastType,
  { container: string; iconColor: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    container: 'bg-surface-elevated border-success-border text-ink',
    iconColor: 'text-success',
    Icon: CheckCircle2,
  },
  error: {
    container: 'bg-surface-elevated border-danger-border text-ink',
    iconColor: 'text-danger',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-surface-elevated border-warning-border text-ink',
    iconColor: 'text-warning',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-surface-elevated border-border-strong text-ink',
    iconColor: 'text-institution',
    Icon: Info,
  },
};

export interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { container, iconColor, Icon } = TOAST_STYLES[toast.type];

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-lg sa-animate-scale-in',
        container
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColor)} aria-hidden="true" />
        <div className="min-w-0">
          {toast.title && <p className="text-sm font-semibold text-ink leading-snug">{toast.title}</p>}
          <p className="text-sm font-medium text-ink-secondary leading-snug">{toast.message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
        className="p-1.5 -m-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-institution"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message, title }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-5 right-0 md:right-5 left-0 md:left-auto mx-auto md:mx-0 z-[var(--z-toast)] flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
