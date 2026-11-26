import React from 'react';
import { Home, ShoppingBag, Building2, MapPin } from 'lucide-react';
import type { LocationType } from '../../api/addressApi';
import { getLocationTypeLabel } from '../../utils/locationTypes';
import { cn } from '../../utils/cn';

export interface LocationBadgeProps {
  type: LocationType | string;
  size?: 'sm' | 'md';
  surface?: 'default' | 'overlay';
  className?: string;
}

const LOCATION_STYLE_MAP: Record<
  LocationType,
  { Icon: React.ComponentType<{ className?: string }>; defaultClasses: string }
> = {
  MAISON: {
    Icon: Home,
    defaultClasses: 'bg-brand-soft text-brand-hover border-brand-border',
  },
  COMMERCE: {
    Icon: ShoppingBag,
    defaultClasses: 'bg-institution-soft text-institution border-institution-border',
  },
  INSTITUTION: {
    Icon: Building2,
    defaultClasses: 'bg-nature-soft text-nature border-nature-border',
  },
};

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  type,
  size = 'sm',
  surface = 'default',
  className,
}) => {
  const upper = type.toUpperCase() as LocationType;
  const config = LOCATION_STYLE_MAP[upper];
  const Icon = config?.Icon ?? MapPin;
  const label = getLocationTypeLabel(type) || type;

  const surfaceClasses =
    surface === 'overlay'
      ? 'bg-canvas/95 text-ink border-canvas/60 shadow-sm backdrop-blur-xs'
      : config?.defaultClasses ?? 'bg-surface text-ink-secondary border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border leading-none whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-xs gap-1.5',
        surfaceClasses,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
