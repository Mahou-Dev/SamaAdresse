import React from 'react';
import { cn } from '../../utils/cn';

export type CardVariant = 'elevated' | 'outlined' | 'subtle' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  variant?: CardVariant;
  as?: 'div' | 'article' | 'section';
  className?: string;
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const VARIANT_CLASSES: Record<CardVariant, string> = {
  elevated: 'bg-surface-elevated shadow-sm',
  outlined: 'bg-surface-elevated shadow-xs',
  subtle: 'bg-surface shadow-none',
  interactive:
    'bg-surface-elevated shadow-xs hover:shadow-card-hover hover:border-border-strong transition-[border-color,box-shadow,transform] duration-200',
};

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  border = true,
  variant = 'elevated',
  as = 'div',
  className,
  ...props
}) => {
  const Component = as;

  return (
    <Component
      className={cn(
        'rounded-2xl',
        VARIANT_CLASSES[variant],
        border && 'border border-border',
        PADDING_CLASSES[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardSectionProps> = ({ children, className, ...props }) => (
  <div className={cn('pb-4 border-b border-border', className)} {...props}>
    {children}
  </div>
);

export const CardBody: React.FC<CardSectionProps> = ({ children, className, ...props }) => (
  <div className={cn('py-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardSectionProps> = ({ children, className, ...props }) => (
  <div className={cn('pt-4 border-t border-border', className)} {...props}>
    {children}
  </div>
);
