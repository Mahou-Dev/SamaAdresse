import React from 'react';
import { cn } from '../../utils/cn';

export interface AuthLayoutProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}

/**
 * Layout cible pour les écrans d'authentification (/login, /register) :
 * colonne unique centrée sur mobile/tablette, écran partagé équilibré à partir de 1024 px.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, aside, className }) => {
  return (
    <div
      className={cn(
        'flex-1 w-full bg-canvas text-ink flex items-center justify-center p-4 sm:p-8',
        className
      )}
    >
      <div className="w-full max-w-md lg:max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="w-full max-w-md mx-auto lg:mx-0">{children}</div>
        {aside && <div className="hidden lg:block">{aside}</div>}
      </div>
    </div>
  );
};
