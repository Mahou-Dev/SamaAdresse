import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import type { ComponentSize, SelectOption } from '../../types/designSystem';
import { cn } from '../../utils/cn';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string | null;
  placeholder?: string;
  options?: SelectOption[];
  size?: ComponentSize;
  containerClassName?: string;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: 'min-h-[36px] text-xs pl-3 pr-9 py-1.5 rounded-lg',
  md: 'min-h-[44px] text-sm pl-3.5 pr-10 py-2.5 rounded-xl',
  lg: 'min-h-[48px] text-base pl-4 pr-11 py-3 rounded-xl',
};

export const Select: React.FC<SelectProps> = ({
  id: providedId,
  label,
  helperText,
  error,
  placeholder,
  options,
  size = 'md',
  required,
  disabled,
  children,
  containerClassName,
  className,
  ...rest
}) => {
  const generatedId = useId();
  const selectId = providedId || generatedId;
  const feedbackId = `${selectId}-feedback`;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-ink leading-snug">
          {label}
          {required && (
            <span className="text-danger ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError || helperText ? feedbackId : undefined}
          className={cn(
            'w-full appearance-none bg-surface-elevated text-ink font-medium',
            'border transition-[border-color,box-shadow,background-color] duration-150',
            'focus-visible:outline-none focus-visible:ring-3',
            hasError
              ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
              : 'border-border-control hover:border-ink-secondary focus-visible:border-institution focus-visible:ring-institution/20',
            disabled ? 'bg-surface text-ink-muted opacity-65 cursor-not-allowed' : 'cursor-pointer',
            SIZE_CLASSES[size],
            className
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted"
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>

      {hasError ? (
        <p id={feedbackId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={feedbackId} className="text-xs text-ink-muted leading-relaxed">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
