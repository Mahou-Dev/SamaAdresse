import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  QrCode,
  Share2,
  ExternalLink,
  MoreVertical,
  Pencil,
  Archive,
  RotateCcw,
  ShieldAlert,
  Globe,
  Lock,
} from 'lucide-react';
import type { AddressResponse } from '../../api/addressApi';
import { AddressPlate } from '../../components/AddressPlate';
import { ShareAddress } from '../../components/ShareAddress';
import { StatusBadge } from '../../components/ui';
import { NeighborhoodTag } from '../../components/shared/NeighborhoodTag';
import { resolvePhotoSrc } from '../addresses/utils';

export interface MyAddressCardProps {
  address: AddressResponse;
  isOnline: boolean;
  photoFailed: boolean;
  isUploadingPhoto: boolean;
  isShareOpen: boolean;
  isMenuOpen: boolean;
  isRestoring: boolean;
  isTogglingVisibility: boolean;
  onPhotoError: (addressId: string) => void;
  onToggleShare: (addressId: string) => void;
  onToggleMenu: (addressId: string | null) => void;
  onDownloadQrCode: (code: string, e: React.MouseEvent) => void;
  onOpenPhotoPicker: (addressId: string) => void;
  onEdit: (addressId: string) => void;
  onRequestArchive: (address: AddressResponse) => void;
  onRestore: (addressId: string) => void;
  onRequestVisibilityToggle: (address: AddressResponse) => void;
}

export const MyAddressCard: React.FC<MyAddressCardProps> = ({
  address,
  isOnline,
  photoFailed,
  isUploadingPhoto,
  isShareOpen,
  isMenuOpen,
  isRestoring,
  isTogglingVisibility,
  onPhotoError,
  onToggleShare,
  onToggleMenu,
  onDownloadQrCode,
  onOpenPhotoPicker,
  onEdit,
  onRequestArchive,
  onRestore,
  onRequestVisibilityToggle,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onToggleMenu(null);
        menuButtonRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggleMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, onToggleMenu]);

  const photoSrc = resolvePhotoSrc(address.photoUrl);
  const hasPhoto = Boolean(photoSrc) && !photoFailed;
  const isArchived = address.status === 'ARCHIVED';
  const isSuspended = address.status === 'SUSPENDED';
  const isActive = address.status === 'ACTIVE';

  return (
    <article className="rounded-xl border border-border bg-surface-elevated shadow-xs hover:border-border-strong transition-colors p-3.5 sm:p-4 flex flex-col justify-between gap-3.5 relative min-w-0">
      {/* Alerte modération si suspendue */}
      {isSuspended && (
        <div
          role="status"
          className="px-3 py-2 rounded-xl bg-danger-soft border border-danger-border text-danger text-xs font-semibold flex items-start gap-2"
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="leading-snug">
            Suspendue par la modération
            {address.moderationNotice ? ` : ${address.moderationNotice}` : ''}
          </span>
        </div>
      )}

      <div className="flex gap-3 items-start min-w-0">
        {/* Miniature façade */}
        <div className="w-16 h-16 min-w-16 min-h-16 rounded-xl bg-surface border border-border overflow-hidden relative shrink-0 flex items-center justify-center">
          {hasPhoto && photoSrc ? (
            <img
              src={photoSrc}
              alt={`Façade ${address.code}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => onPhotoError(address.id)}
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-ink-subtle" aria-hidden="true" />
          )}

          {isUploadingPhoto && (
            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-ink-inverse">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Plaque, description et statuts */}
        <div className="flex-1 min-w-0 space-y-2">
          <AddressPlate
            code={address.code}
            zone={address.zone}
            type={address.locationType}
            size="sm"
            showCopy={false}
            className="w-full"
          />

          <p
            className="text-xs sm:text-sm text-ink-secondary line-clamp-2 leading-snug"
            title={address.description}
          >
            {address.description || 'Sans description'}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={address.status} size="sm" />
            <NeighborhoodTag
              quartierCode={address.quartier}
              zoneCode={address.zone}
              showIcon={false}
            />
            {address.listed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-institution-soft text-institution border border-institution-border">
                <Globe className="w-3 h-3" aria-hidden="true" />
                <span>Dans l'annuaire</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface text-ink-muted border border-border">
                <Lock className="w-3 h-3" aria-hidden="true" />
                <span>Privée</span>
              </span>
            )}
            <span className="text-ink-subtle text-[11px] font-mono">
              {new Date(address.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      {/* Barre d'actions compacte, garantie sans débordement à 320 px */}
      <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-1 min-w-0">
          {isActive && (
            <>
              <button
                type="button"
                onClick={() => onToggleShare(address.id)}
                className="inline-flex items-center gap-1 text-institution hover:bg-institution-soft font-semibold rounded-lg min-h-[36px] px-2 cursor-pointer transition-colors"
                aria-expanded={isShareOpen}
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isShareOpen ? 'Fermer' : 'Partager'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => onDownloadQrCode(address.code, e)}
                className="inline-flex items-center gap-1 text-institution hover:bg-institution-soft font-semibold rounded-lg min-h-[36px] px-2 cursor-pointer transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>QR</span>
              </button>

              <Link
                to={`/a/${address.code}`}
                title="Ouvrir la fiche publique"
                className="inline-flex items-center gap-1 text-institution hover:bg-institution-soft font-semibold rounded-lg min-h-[36px] px-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Fiche</span>
              </Link>

              <button
                type="button"
                onClick={() => onOpenPhotoPicker(address.id)}
                disabled={isUploadingPhoto || !isOnline}
                className="inline-flex items-center gap-1 text-institution hover:bg-institution-soft font-semibold rounded-lg min-h-[36px] px-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                <Camera className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{hasPhoto ? 'Photo' : '+Photo'}</span>
              </button>
            </>
          )}

          {isArchived && (
            <button
              type="button"
              disabled={isRestoring || !isOnline}
              onClick={() => onRestore(address.id)}
              className="inline-flex items-center gap-1.5 text-institution hover:bg-institution-soft font-semibold rounded-lg min-h-[36px] px-2.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isRestoring ? 'Restauration…' : 'Restaurer'}</span>
            </button>
          )}
        </div>

        {/* Menu actions contextuel accessible */}
        {!isSuspended && (
          <div className="relative shrink-0 ml-auto" ref={menuRef}>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => onToggleMenu(isMenuOpen ? null : address.id)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={`Actions pour ${address.code}`}
              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border-strong bg-surface-elevated hover:bg-surface text-ink-secondary min-h-[36px] min-w-[36px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-institution"
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                aria-label={`Options pour ${address.code}`}
                className="absolute right-0 bottom-full mb-1.5 w-52 rounded-xl bg-surface-elevated border border-border shadow-xl py-1.5 z-30 sa-animate-scale-in"
              >
                {isActive ? (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onToggleMenu(null);
                        onEdit(address.id);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-ink hover:bg-surface flex items-center gap-2.5 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-institution shrink-0" aria-hidden="true" />
                      <span>Modifier</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      disabled={isTogglingVisibility || !isOnline}
                      onClick={() => {
                        onToggleMenu(null);
                        onRequestVisibilityToggle(address);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-ink hover:bg-surface flex items-center gap-2.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {address.listed ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
                          <span>Retirer de l'annuaire</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5 text-institution shrink-0" aria-hidden="true" />
                          <span>Publier dans l'annuaire</span>
                        </>
                      )}
                    </button>

                    <div className="my-1 border-t border-border" role="separator" />

                    <button
                      type="button"
                      role="menuitem"
                      disabled={!isOnline}
                      onClick={() => {
                        onToggleMenu(null);
                        onRequestArchive(address);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-danger hover:bg-danger-soft flex items-center gap-2.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <Archive className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Archiver</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isRestoring || !isOnline}
                    onClick={() => {
                      onToggleMenu(null);
                      onRestore(address.id);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-institution hover:bg-institution-soft flex items-center gap-2.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Restaurer</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panneau de partage dépliable (composant P03 réutilisé) */}
      {isShareOpen && isActive && (
        <div className="pt-3 border-t border-border">
          <ShareAddress code={address.code} description={address.description} showQrCode={false} />
        </div>
      )}
    </article>
  );
};
