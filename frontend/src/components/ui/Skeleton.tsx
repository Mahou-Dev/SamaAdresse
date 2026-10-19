import React from 'react';

export interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-[#F2ECE1] border border-[#766B5B]/20 rounded-lg ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
