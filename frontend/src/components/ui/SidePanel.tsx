import React from 'react';
import { Drawer } from './Drawer';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

/**
 * Façade rétrocompatible du panneau latéral de détail (Admin / Modération),
 * désormais adossée à la primitive unifiée Drawer du Design System Clarté.
 */
export const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}) => {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={footer}
      side="right"
      size={width}
    >
      {children}
    </Drawer>
  );
};
