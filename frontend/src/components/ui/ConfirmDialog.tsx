import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Modal } from './Modal';
import { Button } from './Button';

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

const VARIANT_CONFIG = {
  danger: {
    iconBg: 'bg-danger-soft border-danger-border text-danger',
    Icon: AlertCircle,
    buttonVariant: 'danger' as const,
  },
  warning: {
    iconBg: 'bg-warning-soft border-warning-border text-warning',
    Icon: AlertTriangle,
    buttonVariant: 'primary' as const,
  },
  info: {
    iconBg: 'bg-info-soft border-info-border text-info',
    Icon: Info,
    buttonVariant: 'secondary' as const,
  },
};

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
  const { iconBg, Icon, buttonVariant } = VARIANT_CONFIG[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      initialFocusSelector='[data-action="cancel"]'
      titleId="confirm-dialog-title"
      descriptionId="confirm-dialog-description"
      footer={
        <>
          <Button
            variant="outline"
            size="md"
            data-action="cancel"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariant}
            size="md"
            isLoading={isLoading}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'w-10 h-10 rounded-full border flex items-center justify-center shrink-0',
            iconBg
          )}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <h2 id="confirm-dialog-title" className="text-base font-bold text-ink leading-snug">
            {title}
          </h2>
          <div
            id="confirm-dialog-description"
            className="text-xs sm:text-sm text-ink-muted leading-relaxed"
          >
            {description}
          </div>
        </div>
      </div>
    </Modal>
  );
};
