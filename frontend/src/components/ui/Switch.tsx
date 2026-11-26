import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id: providedId,
  className,
}) => {
  const generatedId = useId();
  const switchId = providedId || generatedId;
  const descriptionId = `${switchId}-desc`;

  const trackClasses = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const thumbClasses =
    size === 'sm'
      ? checked
        ? 'w-3.5 h-3.5 translate-x-4'
        : 'w-3.5 h-3.5 translate-x-0.5'
      : checked
      ? 'w-4.5 h-4.5 translate-x-5'
      : 'w-4.5 h-4.5 translate-x-0.5';

  return (
    <div className={cn('inline-flex items-start gap-3', className)}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center shrink-0 rounded-full border transition-colors duration-150 mt-0.5',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
          trackClasses,
          checked
            ? 'bg-brand border-brand'
            : 'bg-surface-active border-border-control hover:border-ink-secondary',
          disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block rounded-full bg-surface-elevated shadow-xs transition-transform duration-150',
            thumbClasses
          )}
        />
      </button>

      {(label || description) && (
        <label
          htmlFor={switchId}
          className={cn('flex flex-col select-none', disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer')}
        >
          {label && <span className="text-sm font-medium text-ink leading-snug">{label}</span>}
          {description && (
            <span id={descriptionId} className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              {description}
            </span>
          )}
        </label>
      )}
    </div>
  );
};
