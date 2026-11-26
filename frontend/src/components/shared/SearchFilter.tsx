import React from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchFilterOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface SearchFilterProps<T extends string = string> {
  label?: string;
  options: SearchFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onReset?: () => void;
  showReset?: boolean;
  resetLabel?: string;
  className?: string;
}

/**
 * Barre horizontale de pilules de filtrage (quartiers, types de lieu, statuts),
 * pensée mobile-first avec défilement tactile fluide.
 */
export function SearchFilter<T extends string = string>({
  label = 'Filtres',
  options,
  value,
  onChange,
  onReset,
  showReset = false,
  resetLabel = 'Réinitialiser',
  className,
}: SearchFilterProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex items-center gap-2 overflow-x-auto sa-no-scrollbar py-1', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value || '__all__'}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
              isActive
                ? 'bg-ink text-ink-inverse border-ink shadow-xs'
                : 'bg-surface-elevated text-ink-secondary border-border hover:border-border-strong hover:bg-surface'
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-3.5 h-3.5 shrink-0',
                  isActive ? 'text-ink-inverse' : 'text-ink-muted'
                )}
                aria-hidden="true"
              />
            )}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  'font-mono text-xs px-1.5 py-0.5 rounded-full leading-none',
                  isActive ? 'bg-canvas/20 text-ink-inverse' : 'bg-surface text-ink-muted'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}

      {showReset && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold text-brand hover:bg-brand-soft transition whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{resetLabel}</span>
        </button>
      )}
    </div>
  );
}
