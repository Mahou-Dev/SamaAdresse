import React, { useState } from 'react';
import type { ExtendedSize } from '../../types/designSystem';
import { cn } from '../../utils/cn';

export interface AvatarProps {
  name?: string;
  src?: string | null;
  alt?: string;
  size?: ExtendedSize;
  tone?: 'brand' | 'institution' | 'nature' | 'neutral';
  status?: 'online' | 'offline';
  className?: string;
}

const SIZE_CLASSES: Record<ExtendedSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const TONE_CLASSES = {
  brand: 'bg-brand-soft text-brand-hover border-brand-border',
  institution: 'bg-institution-soft text-institution border-institution-border',
  nature: 'bg-nature-soft text-nature border-nature-border',
  neutral: 'bg-surface text-ink-secondary border-border-strong',
};

function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  alt,
  size = 'md',
  tone = 'institution',
  status,
  className,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const initials = getInitials(name);
  const label = alt || name || 'Utilisateur';

  return (
    <span className={cn('relative inline-flex shrink-0 select-none', className)}>
      {showImage ? (
        <img
          src={src!}
          alt={label}
          onError={() => setFailedSrc(src ?? null)}
          className={cn(
            'rounded-full object-cover border border-border',
            SIZE_CLASSES[size]
          )}
        />
      ) : (
        <span
          role="img"
          aria-label={label}
          className={cn(
            'rounded-full border font-bold inline-flex items-center justify-center tracking-tight',
            SIZE_CLASSES[size],
            TONE_CLASSES[tone]
          )}
        >
          {initials}
        </span>
      )}

      {status && (
        <span
          aria-label={status === 'online' ? 'En ligne' : 'Hors ligne'}
          className={cn(
            'absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-canvas',
            status === 'online' ? 'bg-success' : 'bg-ink-muted'
          )}
        />
      )}
    </span>
  );
};
