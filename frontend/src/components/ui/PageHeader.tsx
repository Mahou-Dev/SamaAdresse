import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Retour',
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#766B5B] ${className}`}
    >
      <div className="space-y-1">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C4D44] hover:text-[#231A15] transition mb-1 touch-target"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 flex items-center gap-2">
          {action.to ? (
            <Link
              to={action.to}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm touch-target ${
                action.variant === 'secondary'
                  ? 'border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15]'
                  : 'bg-[#B84A24] hover:bg-[#8A3112] text-[#FBF7EF]'
              }`}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              <span>{action.label}</span>
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm touch-target cursor-pointer ${
                action.variant === 'secondary'
                  ? 'border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15]'
                  : 'bg-[#B84A24] hover:bg-[#8A3112] text-[#FBF7EF]'
              }`}
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
