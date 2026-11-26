import React, { useId, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface RadioOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface RadioGroupProps<T extends string = string> {
  name?: string;
  label?: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'card' | 'segmented';
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup<T extends string = string>({
  name: providedName,
  label,
  options,
  value,
  onChange,
  orientation = 'vertical',
  variant = 'default',
  error,
  disabled = false,
  className,
}: RadioGroupProps<T>) {
  const generatedId = useId();
  const groupName = providedName || generatedId;
  const labelId = `${groupName}-label`;
  const errorId = `${groupName}-error`;
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasEnabledSelection = options.some(
    (opt) => opt.value === value && !opt.disabled && !disabled
  );
  const firstEnabledIndex = options.findIndex((opt) => !opt.disabled && !disabled);

  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    const enabledIndices = options
      .map((opt, idx) => (!opt.disabled && !disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    if (enabledIndices.length === 0) return;

    const pos = enabledIndices.indexOf(currentIndex);
    let nextPos = -1;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      nextPos = (pos + 1) % enabledIndices.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      nextPos = (pos - 1 + enabledIndices.length) % enabledIndices.length;
    }

    if (nextPos !== -1) {
      const targetIndex = enabledIndices[nextPos];
      onChange(options[targetIndex].value);
      buttonRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <span id={labelId} className="block text-sm font-semibold text-ink">
          {label}
        </span>
      )}

      <div
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          variant === 'segmented'
            ? 'grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-xl bg-surface border border-border'
            : orientation === 'horizontal'
            ? 'flex flex-wrap gap-3'
            : 'flex flex-col gap-2.5'
        )}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const isOptionDisabled = disabled || Boolean(option.disabled);
          const isTabStop = isSelected || (!hasEnabledSelection && index === firstEnabledIndex);
          const Icon = option.icon;

          if (variant === 'segmented') {
            return (
              <button
                key={option.value}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isOptionDisabled}
                tabIndex={isTabStop ? 0 : -1}
                onClick={() => !isOptionDisabled && onChange(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  'inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
                  isSelected
                    ? 'bg-surface-elevated text-ink shadow-xs border border-border'
                    : 'text-ink-muted hover:text-ink',
                  isOptionDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                {Icon && (
                  <Icon
                    className={cn('w-4 h-4 shrink-0', isSelected ? 'text-brand' : 'text-ink-muted')}
                    aria-hidden="true"
                  />
                )}
                <span>{option.label}</span>
              </button>
            );
          }

          if (variant === 'card') {
            return (
              <button
                key={option.value}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isOptionDisabled}
                tabIndex={isTabStop ? 0 : -1}
                onClick={() => !isOptionDisabled && onChange(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
                  isSelected
                    ? 'border-brand bg-brand-soft/60 shadow-xs'
                    : 'border-border bg-surface-elevated hover:border-border-strong hover:bg-surface',
                  isOptionDisabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? 'border-brand' : 'border-border-control'
                  )}
                >
                  {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {Icon && <Icon className="w-4 h-4 text-institution shrink-0" aria-hidden="true" />}
                    <span>{option.label}</span>
                  </span>
                  {option.description && (
                    <span className="block text-xs text-ink-muted mt-0.5 leading-relaxed">
                      {option.description}
                    </span>
                  )}
                </span>
              </button>
            );
          }

          return (
            <button
              key={option.value}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isOptionDisabled}
              tabIndex={isTabStop ? 0 : -1}
              onClick={() => !isOptionDisabled && onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'inline-flex items-start gap-2.5 py-1 text-left rounded-lg',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
                isOptionDisabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'border-brand' : 'border-border-control'
                )}
              >
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-ink">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-ink-muted mt-0.5">{option.description}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
