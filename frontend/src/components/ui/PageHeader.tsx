import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Breadcrumb } from './Breadcrumb';
import type { BreadcrumbItem } from './Breadcrumb';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Retour',
  breadcrumbs,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div className={cn('space-y-3 pb-5 border-b border-border', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition mb-1 py-1 rounded focus-visible:outline-2 focus-visible:outline-institution"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{subtitle}</p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            {secondaryAction}
            {action && (
              <Button
                variant={action.variant === 'secondary' ? 'outline' : 'primary'}
                size="md"
                to={action.to}
                onClick={action.onClick}
                leftIcon={action.icon}
              >
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
