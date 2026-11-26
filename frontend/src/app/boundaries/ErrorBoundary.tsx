import React from 'react';
import { ErrorState } from '../../components/ui/ErrorState';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Frontière d'erreurs React globale évitant l'effondrement complet de l'application
 * en cas d'exception inattendue au rendu (P00 — P-10).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erreur inattendue lors de l’affichage.',
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Exception capturée :', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onReset?.();
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-canvas">
          <div className="max-w-lg w-full">
            <ErrorState
              title="L'affichage de cette page a rencontré un problème"
              description={
                import.meta.env.DEV && this.state.errorMessage
                  ? this.state.errorMessage
                  : 'Une erreur technique inattendue est survenue. Vos données hors ligne restent préservées.'
              }
              onRetry={this.handleReset}
              retryLabel="Recharger la section"
              homeTo="/"
              onHomeClick={this.handleReset}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
