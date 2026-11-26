import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowUpRight, User } from 'lucide-react';
import type { AddressStatus, LocationType } from '../../api/addressApi';
import { cn } from '../../utils/cn';
import { AddressCode } from './AddressCode';
import { LocationBadge } from './LocationBadge';
import { NeighborhoodTag } from './NeighborhoodTag';
import { AddressStatusBadge } from './AddressStatusBadge';

export interface AddressCardData {
  code: string;
  zone: string;
  quartier: string;
  locationType: LocationType;
  description: string;
  photoUrl?: string | null;
  status?: AddressStatus | 'PENDING';
  ownerName?: string | null;
  createdAt?: string;
}

export interface AddressCardProps {
  address: AddressCardData;
  layout?: 'vertical' | 'horizontal';
  to?: string;
  onSelect?: (address: AddressCardData) => void;
  showStatus?: boolean;
  copyableCode?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  layout = 'vertical',
  to,
  onSelect,
  showStatus = false,
  copyableCode = false,
  footer,
  className,
}) => {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const hasPhoto = Boolean(address.photoUrl) && failedPhotoUrl !== address.photoUrl;
  const targetUrl = to ?? `/a/${address.code}`;

  const imageBlock = (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-secondary shrink-0',
        layout === 'vertical'
          ? 'aspect-[4/3] w-full'
          : 'w-full sm:w-48 aspect-[4/3] sm:aspect-auto sm:min-h-[144px]'
      )}
    >
      {hasPhoto ? (
        <img
          src={address.photoUrl!}
          alt={`Façade de l'adresse ${address.code}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailedPhotoUrl(address.photoUrl ?? null)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-ink-muted bg-surface-secondary">
          <div className="w-11 h-11 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-institution shadow-xs">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-xs font-medium text-ink-muted">Aucune photo de façade</span>
        </div>
      )}

      {/* Badges superposés discrets */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
        <LocationBadge type={address.locationType} surface="overlay" size="sm" />
      </div>

      {showStatus && address.status && (
        <div className="absolute top-3 right-3">
          <AddressStatusBadge status={address.status} size="sm" />
        </div>
      )}
    </div>
  );

  return (
    <article
      className={cn(
        'group rounded-2xl border border-border bg-surface-elevated overflow-hidden shadow-xs',
        'hover:border-border-strong hover:shadow-card-hover transition-[border-color,box-shadow] duration-200 flex',
        layout === 'vertical' ? 'flex-col' : 'flex-col sm:flex-row',
        className
      )}
    >
      {imageBlock}

      <div className="flex-1 min-w-0 p-4 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <AddressCode
              code={address.code}
              size="sm"
              variant="pill"
              copyable={copyableCode}
            />
            <NeighborhoodTag
              quartierCode={address.quartier}
              zoneCode={address.zone}
              showZone={false}
              showIcon={true}
            />
          </div>

          <p className="text-sm font-medium text-ink leading-relaxed line-clamp-2">
            {address.description}
          </p>

          {address.ownerName && (
            <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{address.ownerName}</span>
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
          {footer ? (
            footer
          ) : (
            <>
              <span className="text-xs text-ink-muted">
                {address.createdAt
                  ? new Date(address.createdAt).toLocaleDateString('fr-FR')
                  : address.zone}
              </span>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(address)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-institution hover:text-institution-hover transition cursor-pointer focus-visible:outline-2 focus-visible:outline-institution rounded px-1 py-0.5"
                >
                  <span>Consulter</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              ) : (
                <Link
                  to={targetUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-institution hover:text-institution-hover transition focus-visible:outline-2 focus-visible:outline-institution rounded px-1 py-0.5"
                >
                  <span>Voir la fiche</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};
