import React from 'react';
import { cn } from '../../utils/cn';

export type ContainerWidth = 'narrow' | 'form' | 'content' | 'wide' | 'max' | 'full';

export interface AppShellProps {
  children: React.ReactNode;
  maxWidth?: ContainerWidth;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  narrow: 'max-w-[640px]',
  form: 'max-w-[768px]',
  content: 'max-w-[1120px]',
  wide: 'max-w-[1280px]',
  max: 'max-w-[1440px]',
  full: 'max-w-none',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'px-4 sm:px-6 py-4 sm:py-6',
  md: 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  lg: 'px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
} as const;

export const AppShell: React.FC<AppShellProps> = ({
  children,
  maxWidth = 'wide',
  padding = 'md',
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        WIDTH_CLASSES[maxWidth],
        PADDING_CLASSES[padding],
        className
      )}
    >
      {children}
    </div>
  );
};
