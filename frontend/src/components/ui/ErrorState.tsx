import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  errorCode?: string | number;
  onRetry?: () => void;
  retryLabel?: string;
  homeTo?: string;
  homeLabel?: string;
  compact?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger cette section pour le moment. Vous pouvez réessayer ou revenir à l’accueil.',
  errorCode,
  onRetry,
  retryLabel = 'Réessayer',
  homeTo,
  homeLabel = 'Retour à l’accueil',
  compact = false,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-danger-border bg-surface-elevated shadow-xs flex flex-col items-center justify-center text-center',
        compact ? 'p-6 space-y-3' : 'p-8 sm:p-12 space-y-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-danger-soft border border-danger-border flex items-center justify-center text-danger">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="max-w-md space-y-1.5">
        {errorCode !== undefined && (
          <p className="text-xs font-mono font-semibold text-danger uppercase tracking-wider">
            Erreur {errorCode}
          </p>
        )}
        <h2 className="text-base sm:text-lg font-bold text-ink">{title}</h2>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{description}</p>
      </div>

      {(onRetry || homeTo) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {onRetry && (
            <Button variant="primary" size="md" leftIcon={RefreshCw} onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {homeTo && (
            <Button variant="outline" size="md" leftIcon={Home} to={homeTo}>
              {homeLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
