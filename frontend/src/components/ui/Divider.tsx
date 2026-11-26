import React from 'react';
import { cn } from '../../utils/cn';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  tone?: 'default' | 'strong';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  tone = 'default',
  className,
}) => {
  const borderColor = tone === 'strong' ? 'border-border-strong' : 'border-border';

  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('inline-block self-stretch border-l', borderColor, className)}
      />
    );
  }

  if (label) {
    return (
      <div role="separator" className={cn('flex items-center gap-3 w-full', className)}>
        <span className={cn('flex-1 border-t', borderColor)} aria-hidden="true" />
        <span className="text-xs font-medium text-ink-muted shrink-0">{label}</span>
        <span className={cn('flex-1 border-t', borderColor)} aria-hidden="true" />
      </div>
    );
  }

  return <hr className={cn('w-full border-0 border-t', borderColor, className)} />;
};
