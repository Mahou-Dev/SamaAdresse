import React, { useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string | null;
  success?: string | null;
  showCount?: boolean;
  containerClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  id: providedId,
  label,
  helperText,
  error,
  success,
  showCount = false,
  maxLength,
  value,
  required,
  disabled,
  rows = 4,
  containerClassName,
  className,
  ...rest
}) => {
  const generatedId = useId();
  const textareaId = providedId || generatedId;
  const feedbackId = `${textareaId}-feedback`;
  const hasError = Boolean(error);
  const hasSuccess = !hasError && Boolean(success);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {(label || (showCount && maxLength !== undefined)) && (
        <div className="flex items-baseline justify-between gap-2">
          {label ? (
            <label htmlFor={textareaId} className="block text-sm font-semibold text-ink leading-snug">
              {label}
              {required && (
                <span className="text-danger ml-1" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          ) : (
            <span />
          )}

          {showCount && maxLength !== undefined && (
            <span
              className={cn(
                'text-xs font-mono tabular-nums',
                currentLength >= maxLength ? 'text-danger font-semibold' : 'text-ink-muted'
              )}
              aria-live="polite"
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError || hasSuccess || helperText ? feedbackId : undefined}
        className={cn(
          'w-full rounded-xl bg-surface-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted',
          'border transition-[border-color,box-shadow,background-color] duration-150 resize-y',
          'focus-visible:outline-none focus-visible:ring-3',
          hasError
            ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
            : hasSuccess
            ? 'border-success focus-visible:border-success focus-visible:ring-success/20'
            : 'border-border-control hover:border-ink-secondary focus-visible:border-institution focus-visible:ring-institution/20',
          disabled && 'bg-surface text-ink-muted opacity-65 cursor-not-allowed hover:border-border-control',
          className
        )}
        {...rest}
      />

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
