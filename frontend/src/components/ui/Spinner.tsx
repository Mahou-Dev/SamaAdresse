import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
export type SpinnerTone = 'current' | 'brand' | 'institution' | 'muted';

export interface SpinnerProps {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

const TONE_CLASSES: Record<SpinnerTone, string> = {
  current: 'text-current',
  brand: 'text-brand',
  institution: 'text-institution',
  muted: 'text-ink-muted',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  tone = 'current',
  label = 'Chargement en cours',
  className,
}) => {
  return (
    <span role="status" className={cn('inline-flex items-center justify-center', className)}>
      <Loader2
        className={cn('animate-spin shrink-0', SIZE_CLASSES[size], TONE_CLASSES[tone])}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};
