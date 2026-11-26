import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';
import { AppShell } from './AppShell';
import { PageHeader } from '../../components/ui/PageHeader';
import type { PageHeaderProps } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

export interface AdminLayoutProps {
  children: React.ReactNode;
  header?: PageHeaderProps;
  kpis?: React.ReactNode;
  className?: string;
}

/**
 * Layout cible pour l'espace d'administration et de modération (/admin).
 * Optimisé pour la densité maîtrisée (inspiration Linear / Stripe) et grands écrans 1440+.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  header,
  kpis,
  className,
}) => {
  return (
    <div className={cn('flex-1 w-full bg-surface text-ink', className)}>
      <AppShell maxWidth="max" padding="md" className="space-y-6 pb-20 md:pb-12">
        <div className="flex items-center gap-2">
          <Badge variant="institution" icon={ShieldAlert}>
            Espace Administration & Modération
          </Badge>
        </div>
        {header && <PageHeader {...header} />}
        {kpis && <section aria-label="Indicateurs de modération">{kpis}</section>}
        <div className="space-y-6">{children}</div>
      </AppShell>
    </div>
  );
};
