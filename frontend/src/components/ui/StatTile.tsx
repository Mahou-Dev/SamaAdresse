import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export interface StatTileProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'alert' | 'warning' | 'neutral';
  dataTestId?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  to,
  onClick,
  variant = 'default',
  dataTestId,
}) => {
  const variantStyles = {
    default: {
      border: 'border-[#766B5B]',
      iconBg: 'bg-[#F2ECE1] text-[#12304F]',
      hover: 'hover:border-[#12304F] hover:bg-[#F2ECE1]/50',
    },
    success: {
      border: 'border-[#2A6B44]/40',
      iconBg: 'bg-[#2A6B44]/10 text-[#2A6B44]',
      hover: 'hover:border-[#2A6B44] hover:bg-[#2A6B44]/5',
    },
    alert: {
      border: 'border-[#DC2626]/40',
      iconBg: 'bg-[#FEF2F2] text-[#991B1B]',
      hover: 'hover:border-[#DC2626] hover:bg-[#FEF2F2]/60',
    },
    warning: {
      border: 'border-[#8A3112]/40',
      iconBg: 'bg-[#F2ECE1] text-[#8A3112]',
      hover: 'hover:border-[#8A3112] hover:bg-[#F2ECE1]/60',
    },
    neutral: {
      border: 'border-[#766B5B]',
      iconBg: 'bg-[#F2ECE1] text-[#5C4D44]',
      hover: 'hover:border-[#231A15] hover:bg-[#F2ECE1]/50',
    },
  }[variant];

  const content = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-[#5C4D44] leading-snug">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-[#766B5B]/30 ${variantStyles.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
          {(to || onClick) && (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#5C4D44] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight font-mono">
          {value}
        </div>
        {sublabel && (
          <p className="text-[11px] text-[#5C4D44] mt-1 leading-tight">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );

  const baseClasses = `group text-left rounded-xl bg-[#FBF7EF] border ${variantStyles.border} shadow-[0_2px_0_rgba(35,26,21,0.06)] transition cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F2B233] block ${variantStyles.hover}`;

  if (to) {
    return (
      <Link to={to} className={baseClasses} data-testid={dataTestId}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses} data-testid={dataTestId}>
        {content}
      </button>
    );
  }

  return (
    <div className={`rounded-xl bg-[#FBF7EF] border ${variantStyles.border} shadow-[0_2px_0_rgba(35,26,21,0.06)]`} data-testid={dataTestId}>
      {content}
    </div>
  );
};
