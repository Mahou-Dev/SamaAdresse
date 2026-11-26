import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane" className={cn('w-full overflow-x-auto sa-no-scrollbar', className)}>
      <ol className="flex items-center gap-1.5 text-xs font-medium text-ink-muted whitespace-nowrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const Icon = item.icon;

          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5 min-w-0">
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-ink-subtle shrink-0" aria-hidden="true" />
              )}

              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs',
                    isLast ? 'font-semibold text-ink' : 'text-ink-muted'
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-1 text-ink-muted hover:text-institution transition-colors rounded px-1 -mx-1 py-0.5 focus-visible:outline-2 focus-visible:outline-institution"
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
