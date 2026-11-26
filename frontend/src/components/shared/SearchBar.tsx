import React, { useId } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Spinner } from '../ui/Spinner';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  submitLabel?: string;
  variant?: 'hero' | 'compact';
  isLoading?: boolean;
  disabled?: boolean;
  showSubmitButton?: boolean;
  className?: string;
}

/**
 * Barre de recherche unifiée (inspiration Airbnb) adaptée à la recherche d'adresses SamaAdresse
 * (code ZIG-..., quartier, repère ou description).
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Rechercher un code, un quartier ou un repère…',
  ariaLabel = 'Rechercher une adresse',
  submitLabel = 'Rechercher',
  variant = 'hero',
  isLoading = false,
  disabled = false,
  showSubmitButton = true,
  className,
}) => {
  const inputId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      onSubmit?.(value);
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'group flex items-center bg-surface-elevated border border-border-strong rounded-full',
        'transition-[border-color,box-shadow] duration-200',
        'hover:border-border-control focus-within:border-institution focus-within:ring-3 focus-within:ring-institution/15',
        variant === 'hero' ? 'p-1.5 pl-4 shadow-search' : 'p-1 pl-3.5 shadow-xs',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        {ariaLabel}
      </label>

      <Search
        className={cn(
          'shrink-0 text-ink-muted',
          variant === 'hero' ? 'w-5 h-5 mr-2.5' : 'w-4 h-4 mr-2'
        )}
        aria-hidden="true"
      />

      <input
        id={inputId}
        type="search"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex-1 min-w-0 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none',
          variant === 'hero' ? 'text-sm sm:text-base py-2' : 'text-sm py-1.5'
        )}
      />

      {value && !isLoading && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Effacer la recherche"
          className="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-surface-hover transition cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-institution"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      {isLoading && (
        <span className="px-2 shrink-0">
          <Spinner size="xs" tone="institution" label="Recherche en cours" />
        </span>
      )}

      {showSubmitButton && (
        <button
          type="submit"
          aria-label={submitLabel}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-full bg-brand hover:bg-brand-hover active:bg-brand-active',
            'text-ink-inverse font-semibold transition-colors cursor-pointer shrink-0 ml-1',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
            variant === 'hero' ? 'min-h-[44px] min-w-[44px] px-3 sm:px-5 text-sm' : 'min-h-[36px] min-w-[36px] px-2.5 sm:px-3.5 text-xs'
          )}
        >
          <Search className="w-4 h-4 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">{submitLabel}</span>
        </button>
      )}
    </form>
  );
};
