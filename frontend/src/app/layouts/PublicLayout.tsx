import React from 'react';
import { cn } from '../../utils/cn';
import { AppShell } from './AppShell';
import type { ContainerWidth } from './AppShell';

export interface PublicLayoutProps {
  children: React.ReactNode;
  hero?: React.ReactNode;
  maxWidth?: ContainerWidth;
  surface?: 'canvas' | 'surface' | 'secondary';
  className?: string;
}

const SURFACE_CLASSES = {
  canvas: 'bg-canvas',
  surface: 'bg-surface',
  secondary: 'bg-surface-secondary',
} as const;

/**
 * Layout cible pour l'espace public SamaAdresse 2.0 (Accueil, Annuaire, Fiche publique).
 * Prêt pour l'intégration progressive en P02 et P03.
 */
export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  hero,
  maxWidth = 'wide',
  surface = 'canvas',
  className,
}) => {
  return (
    <div className={cn('flex-1 flex flex-col w-full text-ink', SURFACE_CLASSES[surface], className)}>
      {hero}
      <AppShell maxWidth={maxWidth} padding="md" className="flex-1 space-y-8">
        {children}
      </AppShell>
    </div>
  );
};
