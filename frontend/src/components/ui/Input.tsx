import React, { useId } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { ComponentSize } from '../../types/designSystem';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string | null;
  success?: string | null;
  size?: ComponentSize;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  rightAddon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  containerClassName?: string;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: 'min-h-[36px] text-xs px-3 py-1.5 rounded-lg',
  md: 'min-h-[44px] text-sm px-3.5 py-2.5 rounded-xl',
  lg: 'min-h-[48px] text-base px-4 py-3 rounded-xl',
};

export const Input: React.FC<InputProps> = ({
  id: providedId,
  label,
  helperText,
  error,
  success,
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  rightAddon,
  clearable = false,
  onClear,
  required,
  disabled,
  value,
  containerClassName,
  className,
  ...rest
}) => {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const feedbackId = `${inputId}-feedback`;
  const hasError = Boolean(error);
  const hasSuccess = !hasError && Boolean(success);
  const showClear = clearable && Boolean(value) && !disabled && Boolean(onClear);

  const describedBy = hasError || hasSuccess || helperText ? feedbackId : undefined;

  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-ink leading-snug"
        >
          {label}
          {required && (
            <span className="text-danger ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <span
            className="pointer-events-none absolute left-3.5 flex items-center text-ink-muted"
            aria-hidden="true"
          >
            <LeftIcon className="w-4 h-4" />
          </span>
        )}

        <input
          id={inputId}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full bg-surface-elevated text-ink placeholder:text-ink-muted',
            'border transition-[border-color,box-shadow,background-color] duration-150',
            'focus-visible:outline-none focus-visible:ring-3',
            hasError
              ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
              : hasSuccess
              ? 'border-success focus-visible:border-success focus-visible:ring-success/20'
              : 'border-border-control hover:border-ink-secondary focus-visible:border-institution focus-visible:ring-institution/20',
            disabled && 'bg-surface text-ink-muted opacity-65 cursor-not-allowed hover:border-border-control',
            SIZE_CLASSES[size],
            LeftIcon && 'pl-10',
            Boolean(RightIcon || rightAddon || showClear) && 'pr-10',
            className
          )}
          {...rest}
        />

        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Effacer le champ"
            className="absolute right-2.5 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : rightAddon ? (
          <div className="absolute right-2.5 flex items-center">{rightAddon}</div>
        ) : RightIcon ? (
          <span
            className="pointer-events-none absolute right-3.5 flex items-center text-ink-muted"
            aria-hidden="true"
          >
            <RightIcon className="w-4 h-4" />
          </span>
        ) : null}
      </div>

      {hasError ? (
        <p id={feedbackId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hasSuccess ? (
        <p id={feedbackId} className="flex items-start gap-1.5 text-xs font-medium text-success">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{success}</span>
        </p>
      ) : helperText ? (
        <p id={feedbackId} className="text-xs text-ink-muted leading-relaxed">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
