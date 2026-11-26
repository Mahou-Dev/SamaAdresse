import React, { useEffect, useId, useRef } from 'react';
import { Check, Minus, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  error?: string | null;
  indeterminate?: boolean;
  containerClassName?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id: providedId,
  label,
  description,
  error,
  checked = false,
  indeterminate = false,
  disabled = false,
  containerClassName,
  className,
  ...rest
}) => {
  const generatedId = useId();
  const checkboxId = providedId || generatedId;
  const feedbackId = `${checkboxId}-feedback`;
  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = Boolean(error);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <div className={cn('space-y-1', containerClassName)}>
      <label
        htmlFor={checkboxId}
        className={cn(
          'group inline-flex items-start gap-3 py-1 select-none',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <span className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            ref={inputRef}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-checked={indeterminate ? 'mixed' : undefined}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError || description ? feedbackId : undefined}
            className={cn('peer sr-only', className)}
            {...rest}
          />
          <span
            aria-hidden="true"
            className={cn(
              'w-5 h-5 rounded-md border flex items-center justify-center transition-colors duration-150',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-institution',
              checked || indeterminate
                ? 'bg-brand border-brand text-ink-inverse'
                : hasError
                ? 'bg-surface-elevated border-danger'
                : 'bg-surface-elevated border-border-control group-hover:border-ink-secondary'
            )}
          >
            {indeterminate ? (
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            ) : checked ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : null}
          </span>
        </span>

        <span className="flex flex-col">
          <span className="text-sm font-medium text-ink leading-snug">{label}</span>
          {description && (
            <span id={hasError ? undefined : feedbackId} className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </span>
      </label>

      {hasError && (
        <p id={feedbackId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger pl-8">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
