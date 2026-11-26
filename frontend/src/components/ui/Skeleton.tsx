import React from 'react';
import { cn } from '../../utils/cn';

export type SkeletonVariant = 'rect' | 'text' | 'circle' | 'card';

export interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: SkeletonVariant;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  rect: 'rounded-xl',
  text: 'rounded-md h-4',
  circle: 'rounded-full',
  card: 'rounded-2xl h-48 border border-border',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  count = 1,
  variant = 'rect',
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-surface-hover',
            VARIANT_CLASSES[variant],
            className
          )}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
