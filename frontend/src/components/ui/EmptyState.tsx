import React from 'react';
import { Link } from 'react-router-dom';

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  headingLevel?: 'h2' | 'h3' | 'p';
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  headingLevel = 'h2',
  action,
  className = '',
}) => {
  const HeadingTag = headingLevel;
  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-[0_2px_0_rgba(35,26,21,0.06)] flex flex-col items-center justify-center space-y-3.5 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F2ECE1] border border-[#766B5B] flex items-center justify-center text-[#12304F]">
        <Icon className="w-6 h-6" />
      </div>
      <div className="max-w-md space-y-1">
        <HeadingTag className="text-base font-bold text-[#231A15]">{title}</HeadingTag>
        <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <div className="pt-2">
          {action.to ? (
            <Link
              to={action.to}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-[#FBF7EF] text-xs font-bold transition shadow-sm touch-target"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              <span>{action.label}</span>
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-[#FBF7EF] text-xs font-bold transition shadow-sm touch-target cursor-pointer"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              <span>{action.label}</span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};
