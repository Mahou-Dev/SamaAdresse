import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getMyAddresses,
  updateAddress,
  uploadAddressPhoto,
  deleteAddressPhoto,
} from '../api/addressApi';
import type { AddressResponse, LocationType } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressPlate } from '../components/AddressPlate';
import { AddressStatusBadge } from '../components/shared/AddressStatusBadge';
import { useToast } from '../components/Toast';
import { compressImage, formatFileSize } from '../utils/imageCompressor';
import { validateStep2Details, validateStep3Photo } from '../utils/formValidation';
import { ConnectedLayout } from '../components/ConnectedLayout';
import { ErrorState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AddressDetailsFields } from '../features/addresses/components/AddressDetailsFields';
import { DirectoryVisibilitySection } from '../features/addresses/components/DirectoryVisibilitySection';
import { getQuartierName, getZoneName } from '../utils/geoGrid';
import { resolvePhotoSrc } from '../features/addresses/utils';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import {
  Loader2,
  AlertCircle,
  Lock,
  Camera,
  Trash2,
  Check,
  Image as ImageIcon,
  ExternalLink,
  WifiOff,
} from 'lucide-react';

export const EditAddressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isOnline } = useOnlineStatus();

  const [address, setAddress] = useState<AddressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Champs modifiables
  const [locationType, setLocationType] = useState<LocationType>('MAISON');
  const [description, setDescription] = useState<string>('');
  const [listed, setListed] = useState<boolean>(false);
  const [showOwnerName, setShowOwnerName] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const savingRef = useRef(false);

  // Protection contre la perte accidentelle de modifications
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // Gestion photo
  const [photoUploading, setPhotoUploading] = useState<boolean>(false);
  const [photoDeleting, setPhotoDeleting] = useState<boolean>(false);
  const [confirmDeletePhotoOpen, setConfirmDeletePhotoOpen] = useState<boolean>(false);
  const [photoBrokenUrl, setPhotoBrokenUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAddress = async () => {
      if (!id) {
        setErrorMsg("Identifiant d'adresse manquant.");
        setLoading(false);
        return;
      }

      try {
        const list = await getMyAddresses();
        if (cancelled) return;
        const found = list.find((a) => a.id === id);
        if (!found) {
          setErrorMsg('Adresse introuvable ou accès non autorisé.');
        } else {
          setAddress(found);
          setLocationType(found.locationType);
          setDescription(found.description);
          setListed(found.listed ?? false);
          setShowOwnerName(found.showOwnerName ?? false);
          setErrorMsg(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setErrorMsg(
          err instanceof ApiError ? err.message : 'Impossible de charger cette adresse.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAddress();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isReadOnlyStatus = Boolean(address && address.status !== 'ACTIVE');

  const isDirty = Boolean(
    address &&
      (locationType !== address.locationType ||
        description.trim() !== address.description.trim() ||
        listed !== (address.listed ?? false) ||
        (listed ? showOwnerName : false) !== (address.showOwnerName ?? false))
  );

  // Avertissement navigateur si fermeture d'onglet avec saisie non enregistrée
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || savingRef.current || saving || isReadOnlyStatus) return;

    if (!isOnline) {
      setFormError('La modification d’une adresse nécessite une connexion Internet.');
      return;
    }

    const validation = validateStep2Details(locationType, description);
    if (!validation.isValid) {
      setFormError(validation.error || 'Veuillez vérifier les informations saisies.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateAddress(address.id, {
        description: description.trim(),
        locationType,
        listed,
        showOwnerName: listed ? showOwnerName : false,
      });
      setAddress(updated);
      showToast('Modifications enregistrées.', 'success');
      navigate('/addresses/mine');
    } catch (err: unknown) {
      setFormError(
        err instanceof ApiError ? err.message : "Impossible d'enregistrer les modifications."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setConfirmLeaveOpen(true);
    } else {
      navigate('/addresses/mine');
    }
  };

  const handleSelectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address || isReadOnlyStatus) return;

    if (!isOnline) {
      showToast('Une connexion Internet est requise pour envoyer une photo.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validation = validateStep3Photo(file);
    if (!validation.isValid) {
      showToast(validation.error || 'Image non valide.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPhotoUploading(true);
    try {
      const compressed = await compressImage(file);
      setCompressionStats({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        reductionPercentage: compressed.reductionPercentage,
      });
      const updated = await uploadAddressPhoto(address.id, compressed.file);
      setAddress(updated);
      setPhotoBrokenUrl(null);
      showToast('Photo mise à jour.', 'success');
    } catch (err: unknown) {
      showToast(
        err instanceof ApiError ? err.message : "Erreur lors de l'envoi de la photo.",
        'error'
      );
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmRemovePhoto = async () => {
    if (!address || isReadOnlyStatus) return;
    setConfirmDeletePhotoOpen(false);
    setPhotoDeleting(true);
    try {
      const updated = await deleteAddressPhoto(address.id);
      setAddress(updated);
      setCompressionStats(null);
      setPhotoBrokenUrl(null);
      showToast('Photo supprimée.', 'info');
    } catch (err: unknown) {
      showToast(
        err instanceof ApiError ? err.message : 'Impossible de supprimer la photo.',
        'error'
      );
    } finally {
      setPhotoDeleting(false);
    }
  };

  const photoSrc = resolvePhotoSrc(address?.photoUrl);
  const hasVisiblePhoto = Boolean(photoSrc) && photoBrokenUrl !== photoSrc;

  return (
    <ConnectedLayout
      title={`Modifier l'adresse ${address?.code || ''}`}
      subtitle="Mettez à jour le type de lieu, le repère visuel, la visibilité ou la photo de façade."
      backTo="/addresses/mine"
      backLabel="Retour à mes adresses"
    >
      {loading ? (
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse"
          aria-label="Chargement de l'adresse"
        >
          <div className="lg:col-span-7 space-y-5">
            <div className="h-80 rounded-2xl bg-surface-elevated border border-border" />
            <div className="h-56 rounded-2xl bg-surface-elevated border border-border" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-72 rounded-2xl bg-surface-elevated border border-border" />
          </div>
        </div>
      ) : errorMsg || !address ? (
        <ErrorState
          title="Modification impossible"
          description={errorMsg || 'Adresse introuvable.'}
          homeTo="/addresses/mine"
          homeLabel="Retour à mes adresses"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne principale : Formulaire modifiable & Gestion photo */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
            {!isOnline && (
              <div
                role="status"
                className="p-3.5 rounded-2xl bg-warning-soft border border-warning-border text-warning text-xs sm:text-sm font-medium flex items-start gap-2.5"
              >
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Vous êtes hors ligne. Reconnectez-vous pour enregistrer les modifications ou modifier la photo.
                </span>
              </div>
            )}

            {isReadOnlyStatus && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-warning-soft border border-warning-border text-warning text-xs sm:text-sm font-medium flex items-start gap-2.5"
              >
                <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Cette adresse n'est pas active ({address.status === 'ARCHIVED' ? 'archivée' : 'suspendue'}). Elle ne peut pas être modifiée dans cet état.
                </span>
              </div>
            )}

            {/* Carte des informations éditables */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base font-bold text-ink">Informations modifiables</h2>
                {isDirty && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-soft text-brand-hover border border-brand-border">
                    Modifications non enregistrées
                  </span>
                )}
              </div>

              <AddressDetailsFields
                locationType={locationType}
                onLocationTypeChange={setLocationType}
                description={description}
                onDescriptionChange={setDescription}
                descriptionId="edit-description"
                descriptionLabel="Description et repère visuel"
                descriptionPlaceholder="Ex. : Portail bleu face à la boulangerie…"
                disabled={isReadOnlyStatus || saving}
              />

              <DirectoryVisibilitySection
                listed={listed}
                showOwnerName={showOwnerName}
                onListedChange={setListed}
                onShowOwnerNameChange={setShowOwnerName}
                listedId="edit-directory-listed"
                showOwnerId="edit-directory-show-owner"
                defaultOpen={false}
                disabled={isReadOnlyStatus || saving}
                listedHelpText="Permet aux livreurs, visiteurs et services de trouver cette adresse par son code, son quartier ou son repère visuel."
              />

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-danger-soft border border-danger-border text-danger text-xs sm:text-sm font-medium flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || isReadOnlyStatus || !isOnline}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  )}
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </div>

            {/* Carte dédiée : Photo de façade (indépendante, préservée si non modifiée) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-ink">Photo de façade</h2>
                <p className="text-xs text-ink-muted">
                  La photo actuelle est conservée automatiquement si vous ne la modifiez pas.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSelectPhoto}
                className="hidden"
              />

              {hasVisiblePhoto && photoSrc ? (
                <div className="space-y-3.5">
                  <div className="relative rounded-2xl overflow-hidden border border-border aspect-[4/3] max-h-64 w-full bg-surface-secondary">
                    <img
                      src={photoSrc}
                      alt={`Façade ${address.code}`}
                      onError={() => setPhotoBrokenUrl(photoSrc)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading || photoDeleting || isReadOnlyStatus || !isOnline}
                      className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-institution text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {photoUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Camera className="w-4 h-4" aria-hidden="true" />
                      )}
                      <span>Remplacer la photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeletePhotoOpen(true)}
                      disabled={photoUploading || photoDeleting || isReadOnlyStatus || !isOnline}
                      className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border border-danger-border bg-danger-soft hover:bg-danger/10 text-danger text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {photoDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      )}
                      <span>Supprimer la photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-ink-muted">
                    <ImageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Aucune photo associée à cette adresse.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading || isReadOnlyStatus || !isOnline}
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-institution text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {photoUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>Ajouter une photo</span>
                  </button>
                </div>
              )}

              {compressionStats && (
                <p className="text-xs text-success font-medium">
                  Image compressée avant envoi : {formatFileSize(compressionStats.originalSize)} →{' '}
                  {formatFileSize(compressionStats.compressedSize)} (-
                  {compressionStats.reductionPercentage}%)
                </p>
              )}
            </div>
          </form>

          {/* Colonne latérale : Identité immuable (plaque, statut, position GPS) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Identité permanente
                </span>
                <AddressStatusBadge status={address.status} size="sm" />
              </div>

              <div className="w-full flex justify-center">
                <AddressPlate
                  code={address.code}
                  zone={address.zone}
                  type={locationType}
                  size="md"
                  showCopy={false}
                  className="w-full"
                />
              </div>

              <dl className="p-3.5 rounded-xl bg-surface border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted font-medium">Quartier</dt>
                  <dd className="font-semibold text-ink">
                    {getQuartierName(address.quartier, address.zone)} ({getZoneName(address.zone)})
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-ink-muted font-medium">Position enregistrée</dt>
                  <dd className="font-mono font-bold text-ink">
                    {address.latitude.toFixed(6)}°N, {address.longitude.toFixed(6)}°O
                  </dd>
                </div>
              </dl>

              <div className="flex items-start gap-2.5 text-xs text-ink-secondary bg-surface p-3.5 rounded-xl border border-border">
                <Lock className="w-4 h-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">
                  Le code et la position ne peuvent pas changer. Pour déplacer ce lieu, archivez cette adresse et créez-en une nouvelle.
                </p>
              </div>

              {address.status === 'ACTIVE' && (
                <Link
                  to={`/a/${address.code}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs font-semibold text-institution transition-colors"
                >
                  <span>Voir la fiche publique</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Modale de confirmation de perte de saisies non enregistrées */}
      <ConfirmDialog
        isOpen={confirmLeaveOpen}
        onClose={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false);
          navigate('/addresses/mine');
        }}
        title="Quitter sans enregistrer ?"
        description="Vous avez des modifications non enregistrées sur cette adresse. Si vous quittez maintenant, ces changements seront perdus."
        confirmLabel="Quitter sans enregistrer"
        cancelLabel="Continuer l'édition"
        variant="warning"
      />

      {/* Modale de confirmation de suppression de photo */}
      <ConfirmDialog
        isOpen={confirmDeletePhotoOpen}
        onClose={() => setConfirmDeletePhotoOpen(false)}
        onConfirm={handleConfirmRemovePhoto}
        title="Supprimer la photo de façade ?"
        description="La photo sera retirée de la fiche publique et de votre espace personnel. Vous pourrez en ajouter une nouvelle ultérieurement."
        confirmLabel="Supprimer la photo"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={photoDeleting}
      />
    </ConnectedLayout>
  );
};
