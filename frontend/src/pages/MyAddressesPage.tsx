import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  getMyAddresses,
  uploadAddressPhoto,
  archiveAddress,
  restoreAddress,
} from '../api/addressApi';
import type { AddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressPlate } from '../components/AddressPlate';
import { ShareAddress } from '../components/ShareAddress';
import { formatMyAddressesSubtitle } from '../utils/myAddresses';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import {
  Plus,
  Loader2,
  ExternalLink,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  QrCode,
  Share2,
  RefreshCw,
  MoreVertical,
  Pencil,
  Archive,
  RotateCcw,
  ShieldAlert,
  X,
  CheckCircle2,
} from 'lucide-react';

export const MyAddressesPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingAddressId, setUploadingAddressId] = useState<string | null>(null);
  const [shareOpenId, setShareOpenId] = useState<string | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Menu Actions accessible au clavier
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Modale de confirmation d'archivage
  const [archiveTarget, setArchiveTarget] = useState<AddressResponse | null>(null);
  const [archiving, setArchiving] = useState<boolean>(false);
  const archiveModalRef = useRef<HTMLDivElement>(null);

  // Bannière "Adresse archivée" avec action "Annuler"
  const [recentlyArchived, setRecentlyArchived] = useState<AddressResponse | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetAddressId, setTargetAddressId] = useState<string | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchAddresses = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMyAddresses();
      setAddresses(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Impossible de charger vos adresses.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Fermer le menu Actions sur Échap ou clic extérieur
  useEffect(() => {
    if (!openMenuId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Focus trap et fermeture sur Échap pour la modale d'archivage
  useEffect(() => {
    if (!archiveTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setArchiveTarget(null);
        return;
      }
      if (e.key === 'Tab' && archiveModalRef.current) {
        const focusable = archiveModalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const firstBtn = archiveModalRef.current?.querySelector<HTMLElement>('button');
    firstBtn?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [archiveTarget]);

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const updated = await archiveAddress(archiveTarget.id);
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setRecentlyArchived(updated);
      setArchiveTarget(null);
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'archiver cette adresse.", 'error');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (addressId: string) => {
    setRestoringId(addressId);
    try {
      const updated = await restoreAddress(addressId);
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (recentlyArchived?.id === addressId) {
        setRecentlyArchived(null);
      }
      showToast(`Adresse ${updated.code} restaurée.`, 'success');
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de restaurer cette adresse.', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownloadQrCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/api/addresses/${code}/qrcode`;
    link.download = `samaadresse-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Téléchargement du QR Code ${code} démarré`, 'success');
  };

  const handleOpenPhotoPicker = (addressId: string) => {
    setTargetAddressId(addressId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAddressId) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Format non supporté. Choisissez une image JPEG, PNG ou WebP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Taille d'image trop grande (max 5 Mo).", 'error');
      return;
    }

    setUploadingAddressId(targetAddressId);
    try {
      const updatedAddress = await uploadAddressPhoto(targetAddressId, file);
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === updatedAddress.id ? updatedAddress : addr))
      );
      setFailedPhotos((prev) => {
        const next = { ...prev };
        delete next[targetAddressId];
        return next;
      });
      showToast('Photo de façade mise à jour avec succès !', 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error');
      } else {
        showToast("Erreur lors de l'upload de la photo.", 'error');
      }
    } finally {
      setUploadingAddressId(null);
      setTargetAddressId(null);
    }
  };

  const activeAddresses = addresses.filter((a) => a.status !== 'ARCHIVED');
  const archivedAddresses = addresses.filter((a) => a.status === 'ARCHIVED');
  const displayedAddresses = activeTab === 'ACTIVE' ? activeAddresses : archivedAddresses;

  const total = activeAddresses.length;
  const withPhoto = activeAddresses.filter((a) => !!a.photoUrl && !failedPhotos[a.id]).length;
  const hasAddressWithoutPhoto = total > 0 && withPhoto < total;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 font-sans">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* En-tête : Titre h1, Ligne de compteurs sobre, et Action Principale */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-[#E6DDD0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
            Mes adresses
          </h1>
          <p className="text-xs sm:text-sm text-[#5C4D44] mt-1 font-medium min-h-[20px]">
            {loading ? (
              <span className="inline-block w-28 h-4 bg-[#E6DDD0] rounded animate-pulse" />
            ) : !errorMsg && addresses.length > 0 ? (
              formatMyAddressesSubtitle(activeAddresses.length, archivedAddresses.length)
            ) : null}
          </p>
        </div>

        <Link
          to="/addresses/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] touch-target shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle adresse</span>
        </Link>
      </div>

      {/* Message d'archivage récent avec bouton "Annuler" */}
      {recentlyArchived && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] flex items-center justify-between gap-3 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2 text-[#231A15] font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2A6B44] shrink-0" />
            <span>
              Adresse archivée (<span className="font-mono font-bold">{recentlyArchived.code}</span>)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleRestore(recentlyArchived.id)}
              disabled={restoringId === recentlyArchived.id}
              className="px-3 py-1.5 rounded-lg border border-[#1D528F] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => setRecentlyArchived(null)}
              className="p-1 text-[#5C4D44] hover:text-[#231A15] cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Onglets "Actives (n)" / "Archivées (n)" */}
      {!loading && !errorMsg && addresses.length > 0 && (
        <div
          role="tablist"
          aria-label="Filtrer par état des adresses"
          className="flex items-center gap-2 mb-5 border-b border-[#E6DDD0]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ACTIVE'}
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer -mb-px ${
              activeTab === 'ACTIVE'
                ? 'border-[#B84A24] text-[#231A15]'
                : 'border-transparent text-[#5C4D44] hover:text-[#231A15]'
            }`}
          >
            Actives ({activeAddresses.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ARCHIVED'}
            onClick={() => setActiveTab('ARCHIVED')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer -mb-px ${
              activeTab === 'ARCHIVED'
                ? 'border-[#B84A24] text-[#231A15]'
                : 'border-transparent text-[#5C4D44] hover:text-[#231A15]'
            }`}
          >
            Archivées ({archivedAddresses.length})
          </button>
        </div>
      )}

      {/* Bannière unique d'aide pour les photos de façade (si au moins 1 adresse active n'a pas de photo) */}
      {!loading && !errorMsg && activeTab === 'ACTIVE' && hasAddressWithoutPhoto && (
        <div className="p-3.5 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] text-xs font-medium text-[#231A15] flex items-center gap-2.5 mb-6 shadow-[0_1px_0_rgba(35,26,21,0.04)]">
          <ImageIcon className="w-4 h-4 text-[#8A3112] shrink-0" />
          <span>Une photo de la façade aide à retrouver l'adresse.</span>
        </div>
      )}

      {/* ÉTAT HORS LIGNE SI AUCUNE ADRESSE CHARGÉE */}
      {!isOnline && addresses.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-[#8A3112] mx-auto" />
          <h2 className="text-base font-bold text-[#231A15]">Connexion requise pour afficher cette page</h2>
          <p className="text-xs text-[#5C4D44] leading-relaxed">
            Vos adresses enregistrées nécessitent une connexion réseau pour être synchronisées.
          </p>
        </div>
      ) : loading ? (
        /* ÉTAT DE CHARGEMENT : Squelettes dimensionnés exactement à la taille des cartes réelles */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Chargement des adresses">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#D4CEBF] bg-[#FFFFFF] shadow-[0_2px_0_rgba(35,26,21,0.06)] p-2.5 sm:p-3 flex flex-col justify-between gap-2 h-[185px] sm:h-[190px] animate-pulse"
            >
              <div className="flex gap-2.5 items-start">
                <div className="w-16 h-16 min-w-16 min-h-16 aspect-square rounded-lg bg-[#F2ECE1] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-7 bg-[#E6DDD0] rounded w-full" />
                  <div className="h-3.5 bg-[#F2ECE1] rounded w-3/4" />
                  <div className="h-3 bg-[#F2ECE1] rounded w-1/3" />
                </div>
              </div>
              <div className="pt-2 border-t border-[#E6DDD0] flex items-center justify-between">
                <div className="h-4 bg-[#E6DDD0] rounded w-32" />
                <div className="h-6 bg-[#E6DDD0] rounded w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        /* ÉTAT D'ERREUR : Message clair + Bouton Réessayer */
        <div className="p-6 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={fetchAddresses}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold transition cursor-pointer touch-target shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : addresses.length === 0 ? (
        /* ÉTAT VIDE : Illustration SVG pointillée + Conditions (pas de double bouton) */
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#FFFFFF] border border-[#8C8272]/40 shadow-[0_1px_0_rgba(35,26,21,0.06)] space-y-6 max-w-xl mx-auto">
          <div className="py-2">
            <svg
              className="w-56 h-28 mx-auto text-[#8C8272]"
              viewBox="0 0 200 100"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="6"
                y="6"
                width="188"
                height="88"
                rx="8"
                stroke="#8C8272"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <circle cx="16" cy="16" r="3" fill="#8C8272" />
              <circle cx="184" cy="16" r="3" fill="#8C8272" />
              <circle cx="16" cy="84" r="3" fill="#8C8272" />
              <circle cx="184" cy="84" r="3" fill="#8C8272" />
              <text
                x="100"
                y="58"
                textAnchor="middle"
                fill="#8C8272"
                fontFamily="JetBrains Mono, monospace"
                fontSize="18"
                fontWeight="bold"
              >
                ZIG-???-????
              </text>
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#231A15]">Vous n'avez pas encore d'adresse.</h2>
            <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
              Pour enregistrer votre première adresse, deux conditions simples :
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#D4CEBF] text-left text-xs space-y-2 text-[#231A15]">
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#8A3112] shrink-0">1.</span>
              <span>Être physiquement devant l'entrée du bâtiment ou de la concession.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#8A3112] shrink-0">2.</span>
              <span>Avoir le GPS activé sur votre smartphone ou tablette.</span>
            </div>
          </div>
        </div>
      ) : displayedAddresses.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#FFFFFF] border border-[#D4CEBF] text-xs sm:text-sm text-[#5C4D44]">
          {activeTab === 'ACTIVE'
            ? "Aucune adresse active pour le moment."
            : "Vous n'avez aucune adresse archivée."}
        </div>
      ) : (
        /* LISTE COMPACTE */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedAddresses.map((address) => {
            const hasPhoto = !!address.photoUrl && !failedPhotos[address.id];
            const photoSrc = address.photoUrl?.startsWith('http')
              ? address.photoUrl
              : `${import.meta.env.VITE_API_BASE_URL || ''}${address.photoUrl}`;
            const isArchived = address.status === 'ARCHIVED';
            const isSuspended = address.status === 'SUSPENDED';

            return (
              <div
                key={address.id}
                className="rounded-xl border border-[#8C8272] bg-[#FFFFFF] shadow-[0_2px_0_rgba(35,26,21,0.06)] p-2.5 sm:p-3 flex flex-col justify-between gap-2 relative"
              >
                {/* Mention de suspension par la modération le cas échéant */}
                {isSuspended && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-[11px] font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{address.moderationNotice || 'Suspendue par la modération'}</span>
                  </div>
                )}

                {/* Ligne Principale : Vignette 64x64 + AddressPlate sm + Description */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-16 h-16 min-w-16 min-h-16 rounded-lg bg-[#F2ECE1] border border-[#D4CEBF] overflow-hidden relative group shrink-0 flex items-center justify-center">
                    {hasPhoto ? (
                      <img
                        src={photoSrc}
                        alt={`Façade ${address.code}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={() => setFailedPhotos((prev) => ({ ...prev, [address.id]: true }))}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#8C8272]" />
                    )}

                    {uploadingAddressId === address.id && (
                      <div className="absolute inset-0 bg-[#231A15]/60 flex items-center justify-center text-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Plaque et description */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <AddressPlate
                          code={address.code}
                          zone={address.zone}
                          type={address.locationType}
                          size="sm"
                          showCopy={false}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <p
                      className="text-xs text-[#231A15] font-medium line-clamp-2 leading-tight"
                      title={address.description}
                    >
                      {address.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[#5C4D44] text-[10px] sm:text-[11px] block font-mono">
                        {new Date(address.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {address.listed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1D528F]/10 text-[#1D528F] border border-[#1D528F]/30">
                          Dans l'annuaire
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rangée d'actions texte + icône et menu Actions accessible au clavier (flex-wrap) */}
                <div className="pt-2 border-t border-[#E6DDD0] flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {!isArchived && !isSuspended && (
                      <>
                        {/* Partager */}
                        <button
                          type="button"
                          onClick={() => setShareOpenId(shareOpenId === address.id ? null : address.id)}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline cursor-pointer min-h-[44px] px-1.5 touch-manipulation"
                          aria-expanded={shareOpenId === address.id}
                          title="Partager cette adresse"
                        >
                          <Share2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{shareOpenId === address.id ? 'Fermer' : 'Partager'}</span>
                        </button>

                        {/* QR Code */}
                        <button
                          type="button"
                          onClick={(e) => handleDownloadQrCode(address.code, e)}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline cursor-pointer min-h-[44px] px-1.5 touch-manipulation"
                          title="Télécharger le QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 shrink-0" />
                          <span>QR</span>
                        </button>

                        {/* Fiche Publique */}
                        <Link
                          to={`/a/${address.code}`}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline min-h-[44px] px-1.5 touch-manipulation"
                          title="Ouvrir la fiche publique"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>Fiche</span>
                        </Link>

                        {/* Photo (Ajouter / Changer) */}
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoPicker(address.id)}
                          disabled={uploadingAddressId === address.id}
                          className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline cursor-pointer min-h-[44px] px-1.5 disabled:opacity-50 touch-manipulation"
                          title={hasPhoto ? 'Changer la photo de façade' : 'Ajouter une photo de façade'}
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0" />
                          <span>{hasPhoto ? 'Photo' : '+Photo'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Menu Actions accessible au clavier (masqué si suspendue) */}
                  {!isSuspended && (
                    <div
                      className="relative shrink-0 ml-auto"
                      ref={openMenuId === address.id ? menuContainerRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === address.id ? null : address.id)}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === address.id}
                        aria-label={`Actions pour ${address.code}`}
                        title={`Actions pour ${address.code}`}
                        className="inline-flex items-center justify-center p-1.5 sm:p-2 rounded-lg border border-[#D4CEBF] bg-[#FBF9F5] hover:bg-[#F2ECE1] text-[#231A15] min-h-[36px] min-w-[36px] cursor-pointer"
                      >
                        <span className="sr-only">Actions pour {address.code}</span>
                        <MoreVertical className="w-4 h-4 text-[#5C4D44]" />
                      </button>

                    {openMenuId === address.id && (
                      <div
                        role="menu"
                        aria-label={`Options pour ${address.code}`}
                        className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-[#FFFFFF] border border-[#8C8272] shadow-lg py-1 z-30"
                      >
                        {!isArchived ? (
                          <>
                            {!isSuspended && (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/addresses/${address.id}/edit`);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#231A15] hover:bg-[#F2ECE1] flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#1D528F]" />
                                <span>Modifier</span>
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setArchiveTarget(address);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#991B1B] hover:bg-[#FEF2F2] flex items-center gap-2 cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archiver</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            role="menuitem"
                            disabled={restoringId === address.id}
                            onClick={() => {
                              setOpenMenuId(null);
                              handleRestore(address.id);
                            }}
                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#1D528F] hover:bg-[#F2ECE1] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurer</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {/* Bloc de partage dépliable */}
                {shareOpenId === address.id && !isArchived && (
                  <div className="pt-2 border-t border-[#E6DDD0]">
                    <ShareAddress code={address.code} description={address.description} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modale accessible de confirmation d'archivage (focus trap, Échap ferme) */}
      {archiveTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#231A15]/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setArchiveTarget(null);
          }}
        >
          <div
            ref={archiveModalRef}
            className="w-full max-w-[calc(100vw-32px)] sm:max-w-md rounded-xl bg-[#FBF9F5] border border-[#8C8272] shadow-lg p-5 sm:p-6 space-y-4 mx-auto"
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#E6DDD0] pb-3">
              <h2 id="archive-modal-title" className="text-base font-bold text-[#231A15] break-words">
                Archiver l'adresse {archiveTarget.code} ?
              </h2>
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="p-1.5 rounded-lg text-[#5C4D44] hover:bg-[#F2ECE1] transition cursor-pointer shrink-0"
                aria-label="Fermer la fenêtre de confirmation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#231A15] leading-relaxed">
              La fiche publique et le QR code cesseront de fonctionner. Vous pourrez restaurer l'adresse.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-[#E6DDD0]">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition cursor-pointer touch-target text-center"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={archiving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 touch-target text-center"
              >
                {archiving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Archiver l'adresse</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
