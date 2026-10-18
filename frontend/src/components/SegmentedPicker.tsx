import React, { useRef } from 'react';
import type { LocationType } from '../api/addressApi';
import { Home, ShoppingBag, Building2 } from 'lucide-react';
import { LOCATION_TYPES } from '../utils/locationTypes';

interface SegmentedPickerProps {
  value: LocationType;
  onChange: (value: LocationType) => void;
  label?: string;
}

const TYPE_ICONS: Record<LocationType, React.ElementType> = {
  MAISON: Home,
  COMMERCE: ShoppingBag,
  INSTITUTION: Building2,
};

export const SegmentedPicker: React.FC<SegmentedPickerProps> = ({
  value,
  onChange,
  label = 'Type de lieu',
}) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % LOCATION_TYPES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + LOCATION_TYPES.length) % LOCATION_TYPES.length;
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
      className="grid grid-cols-3 gap-2 p-1.5 bg-[#F2ECE1] rounded-xl border border-[#766B5B]"
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
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(type.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition duration-150 cursor-pointer min-h-[44px] ${
              isSelected
                ? 'bg-[#231A15] text-[#FBF7EF] shadow-sm'
                : 'text-[#5C4D44] hover:text-[#231A15] hover:bg-[#FBF7EF]'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#B84A24]' : 'text-[#766B5B]'}`} />
            <span>{type.label}</span>
          </button>
        );
      })}
    </div>
  );
};
