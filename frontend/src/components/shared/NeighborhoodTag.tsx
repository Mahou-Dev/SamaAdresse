import React from 'react';
import { MapPin } from 'lucide-react';
import { getQuartierName, getZoneName } from '../../utils/geoGrid';
import { cn } from '../../utils/cn';

export interface NeighborhoodTagProps {
  quartierCode: string;
  zoneCode?: string;
  showZone?: boolean;
  showCode?: boolean;
  showIcon?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NeighborhoodTag: React.FC<NeighborhoodTagProps> = ({
  quartierCode,
  zoneCode,
  showZone = false,
  showCode = false,
  showIcon = true,
  active = false,
  onClick,
  className,
}) => {
  const quartierName = getQuartierName(quartierCode, zoneCode);
  const zoneName = showZone && zoneCode ? getZoneName(zoneCode) : '';

  const label = [
    quartierName,
    showCode && quartierName !== quartierCode ? `(${quartierCode})` : '',
    zoneName ? `· ${zoneName}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const classes = cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
    active
      ? 'bg-ink text-ink-inverse border-ink'
      : 'bg-surface text-ink-secondary border-border',
    onClick && !active && 'hover:bg-surface-hover hover:border-border-strong cursor-pointer',
    onClick && active && 'cursor-pointer',
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          classes,
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution'
        )}
      >
        {showIcon && <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span className={classes}>
      {showIcon && <MapPin className="w-3.5 h-3.5 shrink-0 text-institution" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};
