import React from 'react';
import {
  Menu,
  LayoutDashboard,
  MapPin,
  Plus,
  User,
  ShieldAlert,
  LogOut,
  LogIn,
  UserPlus,
  HelpCircle,
} from 'lucide-react';
import type { UserProfile } from '../../api/apiClient';
import { Avatar } from '../ui/Avatar';
import { DropdownMenu } from '../ui/DropdownMenu';
import type { DropdownMenuItem } from '../ui/DropdownMenu';
import { cn } from '../../utils/cn';

export interface UserProfileMenuProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnline?: boolean;
  onLogout?: () => void;
  className?: string;
}

/**
 * Menu de profil utilisateur inspiré des standards marketplace (pilule Avatar + Menu),
 * exposant uniquement les routes réelles de SamaAdresse selon le rôle utilisateur.
 */
export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  user,
  isAuthenticated,
  isOnline = true,
  onLogout,
  className,
}) => {
  const items: DropdownMenuItem[] = isAuthenticated && user
    ? [
        { id: 'dashboard', label: 'Tableau de bord', to: '/tableau-de-bord', icon: LayoutDashboard },
        { id: 'my-addresses', label: 'Mes adresses', to: '/addresses/mine', icon: MapPin },
        { id: 'new-address', label: 'Nouvelle adresse', to: '/addresses/new', icon: Plus },
        { id: 'account', label: 'Mon compte', to: '/account', icon: User, dividerBefore: true },
        { id: 'help', label: 'Aide & guide', to: '/account?tab=aide', icon: HelpCircle },
        ...(user.role === 'ADMIN'
          ? [
              {
                id: 'admin',
                label: 'Modération admin',
                to: '/admin',
                icon: ShieldAlert,
                dividerBefore: true,
              },
            ]
          : []),
        {
          id: 'logout',
          label: 'Se déconnecter',
          icon: LogOut,
          danger: true,
          dividerBefore: true,
          onClick: onLogout,
        },
      ]
    : [
        { id: 'login', label: 'Se connecter', to: '/login', icon: LogIn },
        { id: 'register', label: 'Créer un compte', to: '/register', icon: UserPlus },
      ];

  const trigger = (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-full border border-border-strong',
        'bg-surface-elevated hover:shadow-md transition-shadow min-h-[44px]'
      )}
    >
      <Menu className="w-4 h-4 text-ink-secondary" aria-hidden="true" />
      <Avatar
        name={isAuthenticated && user ? user.fullName : 'Visiteur'}
        size="sm"
        tone={isAuthenticated ? 'institution' : 'neutral'}
        status={isAuthenticated ? (isOnline ? 'online' : 'offline') : undefined}
      />
    </span>
  );

  const header =
    isAuthenticated && user ? (
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-ink truncate">{user.fullName}</p>
        {user.email && <p className="text-xs text-ink-muted truncate">{user.email}</p>}
      </div>
    ) : undefined;

  return (
    <DropdownMenu
      trigger={trigger}
      triggerAriaLabel={isAuthenticated ? 'Ouvrir le menu du compte' : 'Ouvrir le menu de connexion'}
      header={header}
      items={items}
      align="right"
      className={className}
    />
  );
};
