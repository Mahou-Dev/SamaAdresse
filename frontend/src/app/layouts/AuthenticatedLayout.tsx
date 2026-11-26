import React from 'react';
import { cn } from '../../utils/cn';
import { AppShell } from './AppShell';
import { PageHeader } from '../../components/ui/PageHeader';
import type { PageHeaderProps } from '../../components/ui/PageHeader';

export interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  header?: PageHeaderProps;
  sidebar?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

/**
 * Layout cible pour l'espace connecté propriétaire (Tableau de bord, Mes adresses, Compte).
 * Conçu pour éliminer la triple navigation superposée (P00 — P-03) lors de P02/P04.
 */
export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  header,
  sidebar,
  toolbar,
  className,
}) => {
  return (
    <div className={cn('flex-1 w-full bg-surface text-ink', className)}>
      <AppShell maxWidth="wide" padding="md" className="space-y-6 pb-24 md:pb-12">
        {header && <PageHeader {...header} />}
        {toolbar && <div>{toolbar}</div>}

        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
            <aside className="hidden lg:block sticky top-20">{sidebar}</aside>
            <div className="min-w-0 space-y-6">{children}</div>
          </div>
        ) : (
          <div className="space-y-6">{children}</div>
        )}
      </AppShell>
    </div>
  );
};
