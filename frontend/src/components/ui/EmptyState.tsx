import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  illustration?: string;
  illustrationSrcSet?: string;
  illustrationSizes?: string;
  title: string;
  description: string;
  headingLevel?: 'h2' | 'h3' | 'p';
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  illustration,
  illustrationSrcSet,
  illustrationSizes,
  title,
  description,
  headingLevel = 'h2',
  action,
  secondaryAction,
  compact = false,
  className,
}) => {
  const HeadingTag = headingLevel;

  return (
    <div
      className={cn(
        'text-center rounded-2xl bg-surface-elevated border border-border shadow-xs flex flex-col items-center justify-center',
        compact ? 'p-6 space-y-3' : 'p-8 sm:p-12 space-y-4',
        className
      )}
    >
      {illustration ? (
        <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-2xl overflow-hidden border border-border shadow-xs mb-1 bg-surface-secondary">
          <img
            src={illustration}
            srcSet={illustrationSrcSet}
            sizes={illustrationSizes || '(max-width: 640px) 112px, 144px'}
            width="144"
            height="144"
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
      ) : Icon ? (
        <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-institution">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      ) : null}

      <div className="max-w-md space-y-1.5">
        <HeadingTag className="text-base sm:text-lg font-bold text-ink">{title}</HeadingTag>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {action && (
            <Button
              variant="primary"
              size="md"
              to={action.to}
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size="md"
              to={secondaryAction.to}
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
