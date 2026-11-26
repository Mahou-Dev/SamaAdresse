import React, { useRef } from 'react';
import type { LocationType } from '../api/addressApi';
import { Home, Store, Building2 } from 'lucide-react';
import { LOCATION_TYPES } from '../utils/locationTypes';
import { cn } from '../utils/cn';

export interface SegmentedPickerProps {
  value: LocationType;
  onChange: (value: LocationType) => void;
  label?: string;
  disabled?: boolean;
}

const TYPE_ICONS: Record<LocationType, React.ComponentType<{ className?: string }>> = {
  MAISON: Home,
  COMMERCE: Store,
  INSTITUTION: Building2,
};

export const SegmentedPicker: React.FC<SegmentedPickerProps> = ({
  value,
  onChange,
  label = 'Type de lieu',
  disabled = false,
}) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % LOCATION_TYPES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + LOCATION_TYPES.length) % LOCATION_TYPES.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = LOCATION_TYPES.length - 1;
    } else {
      return;
    }

    const nextType = LOCATION_TYPES[nextIndex].id;
    onChange(nextType);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'grid grid-cols-3 gap-1.5 p-1.5 bg-surface rounded-2xl border border-border',
        disabled && 'opacity-65 pointer-events-none'
      )}
    >
      {LOCATION_TYPES.map((type, idx) => {
        const isSelected = value === type.id;
        const Icon = TYPE_ICONS[type.id];

        return (
          <button
            key={type.id}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(type.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer min-h-[44px]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
              isSelected
                ? 'bg-ink text-ink-inverse shadow-xs'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-elevated'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 shrink-0',
                isSelected ? 'text-brand-border' : 'text-ink-muted'
              )}
              aria-hidden="true"
            />
            <span className="truncate">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};
