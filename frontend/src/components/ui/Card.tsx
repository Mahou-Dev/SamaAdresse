import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  border = true,
  className = '',
  ...props
}) => {
  const paddingClass = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  const borderClass = border ? 'border border-[#766B5B]' : '';

  return (
    <div
      className={`rounded-xl bg-[#FBF7EF] shadow-[0_2px_0_rgba(35,26,21,0.06)] ${borderClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
